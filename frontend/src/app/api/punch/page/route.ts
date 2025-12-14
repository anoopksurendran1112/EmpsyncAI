

// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";

// export async function POST(req: Request) {
//   try {
//     const cookieStore = await cookies();
//     const token = cookieStore.get("access_token")?.value;

//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const body = await req.json();
//     const company_id = body.company_id || cookieStore.get("company_id")?.value;

//     if (!company_id) {
//       return NextResponse.json({ error: "Missing company_id" }, { status: 400 });
//     }

//     // ✅ Required by Django
//     const biometric_id = body.biometric_id;
//     const start_date = body.start_date;
//     const end_date = body.end_date;

//     if (!biometric_id || !start_date || !end_date) {
//       return NextResponse.json(
//         { error: "Missing required fields (biometric_id, start_date, end_date)" },
//         { status: 400 }
//       );
//     }

//     const page = body.page || 1;
//     const apiUrl = process.env.API_URL;

//     const res = await fetch(`${apiUrl}/punch/${page}`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({
//         biometric_id,
//         company_id,
//         start_date,
//         end_date,
//       }),
//       cache: "no-store",
//     });

//     if (!res.ok) {
//       return NextResponse.json(
//         { error: `Django API error ${res.status}` },
//         { status: res.status }
//       );
//     }

//     const data = await res.json();
//     return NextResponse.json(data);
//   } catch (err) {
//     console.error("Punch API error:", err);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }


import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Safely read and parse the body
    const text = await req.text();
    if (!text) {
      return NextResponse.json({ error: "Empty request body" }, { status: 400 });
    }

    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const company_id = body.company_id || cookieStore.get("company_id")?.value;
    if (!company_id) {
      return NextResponse.json({ error: "Missing company_id" }, { status: 400 });
    }

    const { biometric_id, employee_ids, start_date, end_date } = body;

    // Validate input: either single biometric_id or an array
    if ((!biometric_id && (!employee_ids || !Array.isArray(employee_ids))) || !start_date || !end_date) {
      return NextResponse.json(
        { error: "Missing required fields (biometric_id or employee_ids, start_date, end_date)" },
        { status: 400 }
      );
    }

    const page = body.page || 1;
    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      return NextResponse.json({ error: "API_URL not set" }, { status: 500 });
    }

    // If batch request (multiple employees)
    if (employee_ids && Array.isArray(employee_ids)) {
      const responses = await Promise.all(
        employee_ids.map((empId: string) =>
          fetch(`${apiUrl}/punch/${page}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "X-Company-ID": company_id.toString(),
            },
            body: JSON.stringify({
              biometric_id: empId,
              company_id,
              start_date,
              end_date,
            }),
            cache: "no-store",
          })
        )
      );

      const results: Record<string, any> = {};
      
      for (let i = 0; i < responses.length; i++) {
        const res = responses[i];
        const empId = employee_ids[i];
        
        if (res.ok) {
          const data = await res.json();
          results[empId] = data;
          
          // Process multi-mode data for better frontend consumption
          if (data.multi_mode && data.data && Array.isArray(data.data)) {
            // Group punches by date for multi-mode
            const punchesByDate: Record<string, any[]> = {};
            
            data.data.forEach((punch: any) => {
              const punchDate = punch.date || (punch.punch_time ? punch.punch_time.split(' ')[0] : null);
              if (punchDate) {
                if (!punchesByDate[punchDate]) {
                  punchesByDate[punchDate] = [];
                }
                punchesByDate[punchDate].push(punch);
              }
            });
            
            // Sort punches within each date by time
            Object.keys(punchesByDate).forEach(date => {
              punchesByDate[date].sort((a, b) => {
                const timeA = a.punch_time ? new Date(a.punch_time).getTime() : 0;
                const timeB = b.punch_time ? new Date(b.punch_time).getTime() : 0;
                return timeA - timeB;
              });
            });
            
            // Add processed data to response
            data.punches_by_date = punchesByDate;
            data.dates = Object.keys(punchesByDate).sort().reverse();
          }
        } else {
          console.error(`Punch API failed for ${empId}:`, res.status);
          results[empId] = {
            status: res.status,
            error: `Failed to fetch punches for employee ${empId}`,
            data: [],
            multi_mode: false,
            total: 0,
            page: page,
            total_page: 0
          };
        }
      }

      return NextResponse.json(results);
    } 
    // Single employee request
    else {
      const res = await fetch(`${apiUrl}/punch/${page}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          biometric_id,
          company_id,
          start_date,
          end_date,
        }),
        cache: "no-store",
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Django API error:", errorText);
        return NextResponse.json(
          { error: `Django API error ${res.status}: ${errorText}` },
          { status: res.status }
        );
      }

      const data = await res.json();
      
      // Process multi-mode data for better frontend consumption
      if (data.multi_mode && data.data && Array.isArray(data.data)) {
        // Group punches by date
        const punchesByDate: Record<string, any[]> = {};
        const today = new Date().toISOString().split('T')[0];
        
        data.data.forEach((punch: any) => {
          let punchDate: string;
          
          if (punch.date) {
            punchDate = typeof punch.date === 'string' ? punch.date : 
                       punch.date.toISOString ? punch.date.toISOString().split('T')[0] : 
                       String(punch.date);
          } else if (punch.punch_time) {
            punchDate = punch.punch_time.split(' ')[0];
          } else {
            punchDate = today;
          }
          
          if (!punchesByDate[punchDate]) {
            punchesByDate[punchDate] = [];
          }
          punchesByDate[punchDate].push(punch);
        });
        
        // Sort punches within each date by time
        Object.keys(punchesByDate).forEach(date => {
          punchesByDate[date].sort((a, b) => {
            const timeA = a.punch_time ? new Date(a.punch_time).getTime() : 0;
            const timeB = b.punch_time ? new Date(b.punch_time).getTime() : 0;
            return timeA - timeB;
          });
        });
        
        // Calculate session information for multi-mode
        const sessionsByDate: Record<string, any[]> = {};
        
        Object.keys(punchesByDate).forEach(date => {
          const datePunches = punchesByDate[date];
          const sessions = [];
          
          for (let i = 0; i < datePunches.length; i += 2) {
            const checkIn = datePunches[i];
            const checkOut = i + 1 < datePunches.length ? datePunches[i + 1] : null;
            
            const session: any = {
              check_in: checkIn.punch_time,
              check_in_status: checkIn.status,
              check_in_device: checkIn.device_id,
              check_in_id: checkIn.id,
              has_check_out: !!checkOut,
            };
            
            if (checkOut) {
              session.check_out = checkOut.punch_time;
              session.check_out_status = checkOut.status;
              session.check_out_device = checkOut.device_id;
              session.check_out_id = checkOut.id;
              
              // Calculate duration
              const durationMs = new Date(checkOut.punch_time).getTime() - new Date(checkIn.punch_time).getTime();
              session.duration_hours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100;
              session.duration_minutes = Math.round(durationMs / (1000 * 60));
            } else {
              session.is_pending = true;
            }
            
            sessions.push(session);
          }
          
          sessionsByDate[date] = sessions;
        });
        
        // Add processed data to response
        data.punches_by_date = punchesByDate;
        data.sessions_by_date = sessionsByDate;
        data.dates = Object.keys(punchesByDate).sort().reverse();
        
        // Calculate summary statistics
        let totalPunches = 0;
        let totalSessions = 0;
        let pendingSessions = 0;
        let totalWorkHours = 0;
        
        Object.keys(sessionsByDate).forEach(date => {
          const dateSessions = sessionsByDate[date];
          totalSessions += dateSessions.length;
          dateSessions.forEach(session => {
            totalPunches += session.has_check_out ? 2 : 1;
            if (session.is_pending) pendingSessions++;
            if (session.duration_hours) totalWorkHours += session.duration_hours;
          });
        });
        
        data.summary = {
          total_punches: totalPunches,
          total_sessions: totalSessions,
          pending_sessions: pendingSessions,
          completed_sessions: totalSessions - pendingSessions,
          total_work_hours: totalWorkHours,
          date_range: `${start_date} to ${end_date}`,
        };
      }
      
      // For non-multi-mode, add device information if available
      if (!data.multi_mode && data.data && Array.isArray(data.data)) {
        data.data = data.data.map((punch: any) => ({
          ...punch,
          device_name: punch.device_name || `Device ${punch.device_id || 'N/A'}`,
          raw_time: punch.punch_time,
          formatted_time: punch.punch_time ? 
            new Date(punch.punch_time).toLocaleTimeString() : 
            null,
        }));
      }

      return NextResponse.json(data);
    }
  } catch (err) {
    console.error("Punch API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add PATCH method for updating punches (as per Django backend)
export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const apiUrl = process.env.API_URL;

    if (!apiUrl) {
      return NextResponse.json({ error: "API_URL not set" }, { status: 500 });
    }

    // Support both single update and batch updates
    const updates = Array.isArray(body) ? body : [body];
    
    // Validate updates
    const validUpdates = updates.filter(update => 
      update.id && update.biometric_id && update.punch_time
    );
    
    if (validUpdates.length === 0) {
      return NextResponse.json(
        { error: "No valid updates provided. Each update must have id, biometric_id, and punch_time" },
        { status: 400 }
      );
    }

    const res = await fetch(`${apiUrl}/punch/1`, { // Page number doesn't matter for PATCH
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(validUpdates),
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Django PATCH error:", errorText);
      return NextResponse.json(
        { error: `Django API error ${res.status}: ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
    
  } catch (err) {
    console.error("Punch PATCH API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}