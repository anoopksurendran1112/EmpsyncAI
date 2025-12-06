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

    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      return NextResponse.json({ error: "API_URL not set" }, { status: 500 });
    }

    // Prepare payload for Django API
    const payload = biometric_id
      ? { biometric_id, company_id, start_date, end_date, user_id: biometric_id }
      : employee_ids.map((id: string) => ({
          biometric_id: id,
          company_id,
          start_date,
          end_date,
          user_id: id,
        }));

    // If batch, call Django API for each employee in parallel
    let results: Record<string, any> = {};

    if (Array.isArray(payload)) {
      const responses = await Promise.all(
        payload.map((p) =>
          fetch(`${apiUrl}/today-punch`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "X-Company-ID": company_id.toString(),
            },
            body: JSON.stringify(p),
            cache: "no-store",
          })
        )
      );

      for (let i = 0; i < responses.length; i++) {
        const res = responses[i];
        const empId = payload[i].biometric_id;
        if (res.ok) {
          const data = await res.json();
          
          // Process the data to extract multiple punches information
          if (data.data && Array.isArray(data.data)) {
            const punches = data.data;
            
            // Separate check-ins and check-outs
            const checkIns = punches.filter((p: any) => p.status === 'Check-In');
            const checkOuts = punches.filter((p: any) => p.status === 'Check-Out');
            
            // Sort by time
            checkIns.sort((a: any, b: any) => new Date(a.punch_time).getTime() - new Date(b.punch_time).getTime());
            checkOuts.sort((a: any, b: any) => new Date(a.punch_time).getTime() - new Date(b.punch_time).getTime());
            
            // Group into sessions (pairs of check-in and check-out)
            const sessions = [];
            let checkInIndex = 0;
            let checkOutIndex = 0;
            
            while (checkInIndex < checkIns.length || checkOutIndex < checkOuts.length) {
              const session: any = {};
              
              // Find next check-in
              if (checkInIndex < checkIns.length) {
                session.check_in = checkIns[checkInIndex].punch_time;
                session.check_in_device = checkIns[checkInIndex].device_id;
                checkInIndex++;
              }
              
              // Find corresponding check-out (after check-in)
              if (checkOutIndex < checkOuts.length) {
                // If we have a check-in, find the next check-out after it
                if (session.check_in) {
                  while (checkOutIndex < checkOuts.length && 
                         new Date(checkOuts[checkOutIndex].punch_time) < new Date(session.check_in)) {
                    checkOutIndex++; // Skip check-outs that are before check-in
                  }
                }
                
                if (checkOutIndex < checkOuts.length) {
                  session.check_out = checkOuts[checkOutIndex].punch_time;
                  session.check_out_device = checkOuts[checkOutIndex].device_id;
                  checkOutIndex++;
                }
              }
              
              // Calculate session duration if both exist
              if (session.check_in && session.check_out) {
                const durationMs = new Date(session.check_out).getTime() - new Date(session.check_in).getTime();
                session.duration_hours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100;
              }
              
              sessions.push(session);
            }
            
            // Add processed data to response
            data.punch_sessions = sessions;
            data.total_sessions = sessions.length;
            data.check_ins = checkIns;
            data.check_outs = checkOuts;
            data.check_in_count = checkIns.length;
            data.check_out_count = checkOuts.length;
          }
          
          results[empId] = data;
        } else {
          console.error(`Punch API failed for ${empId}:`, res.status);
          results[empId] = { 
            first_check_in: null, 
            last_check_out: null,
            data: [],
            multi_mode: false,
            punch_sessions: [],
            total_sessions: 0,
            check_ins: [],
            check_outs: [],
            check_in_count: 0,
            check_out_count: 0
          };
        }
      }
    } else {
      const res = await fetch(`${apiUrl}/today-punch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Company-ID": company_id.toString(),
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: `Django API error ${res.status}` },
          { status: res.status }
        );
      }

      results = await res.json();
      
      // Process single employee response to add multiple punches data
      if (results.data && Array.isArray(results.data)) {
        const punches = results.data;
        
        // Separate check-ins and check-outs
        const checkIns = punches.filter((p: any) => p.status === 'Check-In');
        const checkOuts = punches.filter((p: any) => p.status === 'Check-Out');
        
        // Sort by time
        checkIns.sort((a: any, b: any) => new Date(a.punch_time).getTime() - new Date(b.punch_time).getTime());
        checkOuts.sort((a: any, b: any) => new Date(a.punch_time).getTime() - new Date(b.punch_time).getTime());
        
        // Group into sessions
        const sessions = [];
        let checkInIndex = 0;
        let checkOutIndex = 0;
        
        while (checkInIndex < checkIns.length || checkOutIndex < checkOuts.length) {
          const session: any = {};
          
          if (checkInIndex < checkIns.length) {
            session.check_in = checkIns[checkInIndex].punch_time;
            session.check_in_device = checkIns[checkInIndex].device_id;
            checkInIndex++;
          }
          
          if (checkOutIndex < checkOuts.length) {
            if (session.check_in) {
              while (checkOutIndex < checkOuts.length && 
                     new Date(checkOuts[checkOutIndex].punch_time) < new Date(session.check_in)) {
                checkOutIndex++;
              }
            }
            
            if (checkOutIndex < checkOuts.length) {
              session.check_out = checkOuts[checkOutIndex].punch_time;
              session.check_out_device = checkOuts[checkOutIndex].device_id;
              checkOutIndex++;
            }
          }
          
          if (session.check_in && session.check_out) {
            const durationMs = new Date(session.check_out).getTime() - new Date(session.check_in).getTime();
            session.duration_hours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100;
          }
          
          sessions.push(session);
        }
        
        // Add processed data to response
        results.punch_sessions = sessions;
        results.total_sessions = sessions.length;
        results.check_ins = checkIns;
        results.check_outs = checkOuts;
        results.check_in_count = checkIns.length;
        results.check_out_count = checkOuts.length;
      }
    }

    return NextResponse.json(results);

  } catch (err) {
    console.error("Today Punch API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
/*import { NextResponse } from "next/server";
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

    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      return NextResponse.json({ error: "API_URL not set" }, { status: 500 });
    }

    // Prepare payload for Django API
    const payload = biometric_id
      ? { biometric_id, company_id, start_date, end_date, user_id: biometric_id }
      : employee_ids.map((id: string) => ({
          biometric_id: id,
          company_id,
          start_date,
          end_date,
          user_id: id,
        }));

    // If batch, call Django API for each employee in parallel
    let results: Record<string, any> = {};

    if (Array.isArray(payload)) {
      const responses = await Promise.all(
        payload.map((p) =>
          fetch(`${apiUrl}/today-punch`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "X-Company-ID": company_id.toString(),
            },
            body: JSON.stringify(p),
            cache: "no-store",
          })
        )
      );

      for (let i = 0; i < responses.length; i++) {
        const res = responses[i];
        const empId = payload[i].biometric_id;
        if (res.ok) {
          const data = await res.json();
          results[empId] = data;
        } else {
          console.error(`Punch API failed for ${empId}:`, res.status);
          results[empId] = { first_check_in: null, last_check_out: null };
        }
      }
    } else {
      const res = await fetch(`${apiUrl}/today-punch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Company-ID": company_id.toString(),
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: `Django API error ${res.status}` },
          { status: res.status }
        );
      }

      results = await res.json();
    }

    return NextResponse.json(results);

  } catch (err) {
    console.error("Today Punch API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
*/