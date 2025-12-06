// // app/api/calendar/[id]/route.ts - MINIMAL VERSION
// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";

// export async function POST(
//   req: Request,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const { id: userId } = await params;
//     const cookieStore = await cookies();
//     const token = cookieStore.get("access_token")?.value;
//     const company_id = cookieStore.get("company_id")?.value;

//     if (!token || !userId || !company_id) {
//       return NextResponse.json(
//         { success: false, message: "Missing required parameters" },
//         { status: 400 }
//       );
//     }

//     const body = await req.json();
//     const { date } = body;

//     if (!date) {
//       return NextResponse.json(
//         { success: false, message: "Missing date" },
//         { status: 400 }
//       );
//     }

//     const apiUrl = process.env.API_URL;
//     if (!apiUrl) {
//       return NextResponse.json(
//         { success: false, message: "Server configuration error" },
//         { status: 500 }
//       );
//     }

//     const backendUrl = `${apiUrl}/get-calendar/${userId}`;
//     const response = await fetch(backendUrl, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({ date, company_id }),
//     });

//     if (!response.ok) {
//       return NextResponse.json(
//         { success: false, message: "Backend request failed" },
//         { status: response.status }
//       );
//     }

//     const backendData = await response.json();
//     const backendRecords = backendData.data || [];
    
//     const transformedAttendance = backendRecords.map((record: any) => {
//       const type = record.type || 'absent';
//       let status = 'absent';
//       let title = '';

//       switch (type) {
//         case 'punch':
//           status = 'present';
//           title = 'PRESENT';
//           break;
//         case 'partial':
//           status = 'half_day';
//           title = 'HALF DAY';
//           break;
//         case 'leave':
//           status = 'absent';
//           title = `LEAVE - ${record.reason || ''}`;
//           break;
//         case 'holiday':
//           status = 'holiday';
//           title = `HOLIDAY - ${record.reason || ''}`;
//           break;
//         default:
//           status = 'absent';
//           title = 'ABSENT';
//       }

//       return {
//         date: record.date,
//         status: status,
//         type: type,
//         reason: record.reason || '',
//         title: title,
//         check_in: record.check_in || null,
//         check_out: record.check_out || null,
//         hours_worked: type === 'punch' ? 8 : (type === 'partial' ? 4 : 0)
//       };
//     });

//     return NextResponse.json({
//       success: true,
//       attendance: transformedAttendance,
//       message: `Found ${transformedAttendance.length} records`
//     });
    
//   } catch (err: any) {
//     console.error("Error in calendar API:", err);
//     return NextResponse.json(
//       { success: false, message: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// app/api/calendar/[id]/route.ts - UPDATED VERSION
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const company_id = cookieStore.get("company_id")?.value;

    if (!token || !userId || !company_id) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Missing required parameters",
          details: {
            token: !!token,
            userId: !!userId,
            company_id: !!company_id
          }
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { date } = body;

    if (!date) {
      return NextResponse.json(
        { success: false, message: "Missing date parameter" },
        { status: 400 }
      );
    }

    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      return NextResponse.json(
        { success: false, message: "Server configuration error" },
        { status: 500 }
      );
    }

    const backendUrl = `${apiUrl}/get-calendar/${userId}`;
    
    console.log('🔍 Calendar API Request:', {
      backendUrl,
      userId,
      company_id,
      date
    });

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ date, company_id }),
    });

    console.log('🔍 Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend request failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      return NextResponse.json(
        { 
          success: false, 
          message: "Backend request failed",
          status: response.status
        },
        { status: response.status }
      );
    }

    const backendData = await response.json();
    console.log('🔍 Raw backend data received:', {
      success: backendData.success,
      dataLength: backendData.data?.length || 0,
      message: backendData.message
    });
    
    const backendRecords = backendData.data || [];
    
    console.log('🔍 Processing records:', backendRecords.length);
    
    const transformedAttendance = backendRecords.map((record: any, index: number) => {
      console.log(`🔍 Record ${index}:`, record);
      
      const type = record.type || 'absent';
      let status = 'absent';
      let title = '';

      switch (type) {
        case 'punch':
          status = 'present';
          title = 'PRESENT';
          break;
        case 'partial':
          status = 'half_day';
          title = 'HALF DAY';
          break;
        case 'leave':
          status = 'absent';
          title = `LEAVE - ${record.reason || ''}`;
          break;
        case 'holiday':
          status = 'holiday';
          title = `HOLIDAY - ${record.reason || ''}`;
          break;
        default:
          status = 'absent';
          title = 'ABSENT';
      }

      const transformedRecord = {
        date: record.date,
        status: status,
        type: type,
        reason: record.reason || '',
        title: title,
        check_in: record.check_in || null,
        check_out: record.check_out || null,
        hours_worked: type === 'punch' ? 8 : (type === 'partial' ? 4 : 0)
      };
      
      console.log(`🔍 Transformed record ${index}:`, transformedRecord);
      return transformedRecord;
    });

    console.log('✅ Final response:', {
      totalRecords: transformedAttendance.length,
      records: transformedAttendance
    });

    return NextResponse.json({
      success: true,
      attendance: transformedAttendance,
      message: `Found ${transformedAttendance.length} records for ${date}`
    });
    
  } catch (err: any) {
    console.error("❌ Error in calendar API:", err);
    return NextResponse.json(
      { 
        success: false, 
        message: "Internal server error",
        error: err.message 
      },
      { status: 500 }
    );
  }
}