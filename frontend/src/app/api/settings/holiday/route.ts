// // // app/api/settings/holiday/route.ts
// // import { NextRequest, NextResponse } from "next/server";
// // import { cookies } from "next/headers";

// // // GET: Fetch holidays for current company (from cookies)
// // export async function GET(req: NextRequest) {
// //   const cookieStore = await cookies();
// //   const token = cookieStore.get("access_token")?.value;
// //   const company_id = cookieStore.get("company_id")?.value;

// //   if (!token) {
// //     return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
// //   }

// //   if (!company_id) {
// //     return NextResponse.json({ 
// //       success: false, 
// //       message: "Missing company information" 
// //     }, { status: 400 });
// //   }

// //   try {
// //     console.log('📅 Fetching holidays for company:', company_id);

// //     const res = await fetch(`${process.env.API_URL}/holiday`, {
// //       method: "GET",
// //       headers: {
// //         Authorization: `Bearer ${token}`,
// //         Accept: "application/json",
// //         "X-Company-ID": company_id,
// //       },
// //     });

// //     const data = await res.json();
    
// //     console.log('📡 GET Holidays Response:', {
// //       status: res.status,
// //       dataCount: data.data?.length || 0
// //     });
    
// //     return NextResponse.json(data, { status: res.status });
// //   } catch (err: any) {
// //     console.error('❌ GET Holidays Error:', err);
// //     return NextResponse.json({ success: false, message: err.message }, { status: 500 });
// //   }
// // }

// // // POST: Add a holiday for current company (from cookies)
// // export async function POST(req: NextRequest) {
// //   const cookieStore = await cookies();
// //   const token = cookieStore.get("access_token")?.value;
// //   const company_id = cookieStore.get("company_id")?.value;

// //   if (!token) {
// //     return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
// //   }

// //   if (!company_id) {
// //     return NextResponse.json({ 
// //       success: false, 
// //       message: "Missing company information" 
// //     }, { status: 400 });
// //   }

// //   try {
// //     const body = await req.json();
    
// //     // Remove company_id from body if present to prevent conflicts
// //     const { company_id: bodyCompanyId, ...cleanBody } = body;
    
// //     if (bodyCompanyId && bodyCompanyId !== company_id) {
// //       console.log('⚠️ Warning: Body company_id differs from cookies. Using cookies company_id.');
// //     }

// //     console.log('🎯 Holiday POST Request Details:', {
// //       company_id_from_cookies: company_id,
// //       body_company_id: bodyCompanyId,
// //       url: `${process.env.API_URL}/add-holiday`,
// //       body: cleanBody
// //     });

// //     const res = await fetch(`${process.env.API_URL}/add-holiday`, {
// //       method: "POST",
// //       headers: {
// //         Authorization: `Bearer ${token}`,
// //         "Content-Type": "application/json",
// //         Accept: "application/json",
// //       },
// //       body: JSON.stringify({
// //         ...cleanBody,
// //         company_id: company_id, // Always use company_id from cookies
// //       }),
// //     });

// //     const data = await res.json();
    
// //     console.log('📡 Backend POST Response:', {
// //       status: res.status,
// //       statusText: res.statusText,
// //       data: data
// //     });

// //     return NextResponse.json(data, { status: res.status });

// //   } catch (err: any) {
// //     console.error('❌ Holiday POST Error:', err);
// //     return NextResponse.json({ 
// //       success: false, 
// //       message: `Network error: ${err.message}` 
// //     }, { status: 500 });
// //   }
// // }

// // // PUT: Update a holiday for current company (from cookies)
// // export async function PUT(req: NextRequest) {
// //   const cookieStore = await cookies();
// //   const token = cookieStore.get("access_token")?.value;
// //   const company_id = cookieStore.get("company_id")?.value;

// //   if (!token) {
// //     return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
// //   }

// //   if (!company_id) {
// //     return NextResponse.json({ 
// //       success: false, 
// //       message: "Missing company information" 
// //     }, { status: 400 });
// //   }

// //   try {
// //     const body = await req.json();

// //     console.log('🔄 Holiday PUT Request Details:', {
// //       company_id,
// //       body: body
// //     });

// //     const res = await fetch(`${process.env.API_URL}/update-holiday`, {
// //       method: "PUT",
// //       headers: {
// //         Authorization: `Bearer ${token}`,
// //         "Content-Type": "application/json",
// //         Accept: "application/json",
// //         "X-Company-ID": company_id,
// //       },
// //       body: JSON.stringify(body),
// //     });

// //     const data = await res.json();
    
// //     console.log('📡 Backend PUT Response:', {
// //       status: res.status,
// //       data: data
// //     });
    
// //     return NextResponse.json(data, { status: res.status });
// //   } catch (err: any) {
// //     console.error('❌ Holiday PUT Error:', err);
// //     return NextResponse.json({ success: false, message: err.message }, { status: 500 });
// //   }
// // }

// // // DELETE: Remove a holiday for current company (from cookies)
// // export async function DELETE(req: NextRequest) {
// //   const cookieStore = await cookies();
// //   const token = cookieStore.get("access_token")?.value;
// //   const company_id = cookieStore.get("company_id")?.value;

// //   if (!token) {
// //     return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
// //   }

// //   if (!company_id) {
// //     return NextResponse.json({ 
// //       success: false, 
// //       message: "Missing company information" 
// //     }, { status: 400 });
// //   }

// //   try {
// //     const body = await req.json();

// //     console.log('🗑️ Holiday DELETE Request Details:', {
// //       company_id,
// //       body: body
// //     });

// //     const res = await fetch(`${process.env.API_URL}/holiday`, {
// //       method: "DELETE",
// //       headers: {
// //         Authorization: `Bearer ${token}`,
// //         "Content-Type": "application/json",
// //         Accept: "application/json",
// //         "X-Company-ID": company_id,
// //       },
// //       body: JSON.stringify(body),
// //     });

// //     const data = await res.json();
    
// //     console.log('📡 Backend DELETE Response:', {
// //       status: res.status,
// //       data: data
// //     });
    
// //     return NextResponse.json(data, { status: res.status });
// //   } catch (err: any) {
// //     console.error('❌ Holiday DELETE Error:', err);
// //     return NextResponse.json({ success: false, message: err.message }, { status: 500 });
// //   }
// // }

// // app/api/settings/holiday/route.ts
// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";

// // GET: Fetch holidays for current company
// export async function GET() {
//   try {
//     const cookieStore = await cookies();
//     const token = cookieStore.get("access_token")?.value;
//     const company_id = cookieStore.get("company_id")?.value;

//     if (!token || !company_id) {
//       return NextResponse.json(
//         { 
//           success: false, 
//           message: "Missing required parameters",
//           details: {
//             token: !!token,
//             company_id: !!company_id
//           }
//         },
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

//     const backendUrl = `${apiUrl}/holiday`;
    
//     console.log('📅 GET Holidays Request:', {
//       backendUrl,
//       company_id
//     });

//     const response = await fetch(backendUrl, {
//       method: "GET",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         Accept: "application/json",
//         "X-Company-ID": company_id,
//       },
//     });

//     console.log('📡 GET Holidays Backend Response:', {
//       status: response.status,
//       statusText: response.statusText
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error('❌ GET Holidays Backend request failed:', {
//         status: response.status,
//         statusText: response.statusText,
//         error: errorText
//       });
      
//       return NextResponse.json(
//         { 
//           success: false, 
//           message: "Backend request failed",
//           status: response.status
//         },
//         { status: response.status }
//       );
//     }

//     const data = await response.json();
    
//     console.log('✅ GET Holidays Success:', {
//       dataCount: data.data?.length || 0,
//       success: data.success
//     });
    
//     return NextResponse.json(data, { status: response.status });
    
//   } catch (err: any) {
//     console.error("❌ GET Holidays Error:", err);
//     return NextResponse.json(
//       { 
//         success: false, 
//         message: "Internal server error",
//         error: err.message 
//       },
//       { status: 500 }
//     );
//   }
// }

// // POST: Add a holiday for current company
// export async function POST(req: Request) {
//   try {
//     const cookieStore = await cookies();
//     const token = cookieStore.get("access_token")?.value;
//     const company_id = cookieStore.get("company_id")?.value;

//     if (!token || !company_id) {
//       return NextResponse.json(
//         { 
//           success: false, 
//           message: "Missing required parameters",
//           details: {
//             token: !!token,
//             company_id: !!company_id
//           }
//         },
//         { status: 400 }
//       );
//     }

//     const body = await req.json();
//     const { name, date, type } = body;

//     if (!name || !date || !type) {
//       return NextResponse.json(
//         { 
//           success: false, 
//           message: "Missing required fields",
//           details: {
//             name: !!name,
//             date: !!date,
//             type: !!type
//           }
//         },
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

//     const backendUrl = `${apiUrl}/add-holiday`;
    
//     console.log('🎯 POST Holiday Request:', {
//       backendUrl,
//       company_id,
//       body: { name, date, type }
//     });

//     const response = await fetch(backendUrl, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//         Accept: "application/json",
//       },
//       body: JSON.stringify({
//         name,
//         date,
//         type,
//         company_id,
//       }),
//     });

//     console.log('📡 POST Holiday Backend Response:', {
//       status: response.status,
//       statusText: response.statusText
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error('❌ POST Holiday Backend request failed:', {
//         status: response.status,
//         statusText: response.statusText,
//         error: errorText
//       });
      
//       return NextResponse.json(
//         { 
//           success: false, 
//           message: "Backend request failed",
//           status: response.status
//         },
//         { status: response.status }
//       );
//     }

//     const data = await response.json();
    
//     console.log('✅ POST Holiday Success:', {
//       success: data.success,
//       message: data.message
//     });

//     return NextResponse.json(data, { status: response.status });

//   } catch (err: any) {
//     console.error("❌ POST Holiday Error:", err);
//     return NextResponse.json(
//       { 
//         success: false, 
//         message: "Internal server error",
//         error: err.message 
//       },
//       { status: 500 }
//     );
//   }
// }

// // PUT: Update a holiday for current company
// export async function PUT(req: Request) {
//   try {
//     const cookieStore = await cookies();
//     const token = cookieStore.get("access_token")?.value;
//     const company_id = cookieStore.get("company_id")?.value;

//     if (!token || !company_id) {
//       return NextResponse.json(
//         { 
//           success: false, 
//           message: "Missing required parameters",
//           details: {
//             token: !!token,
//             company_id: !!company_id
//           }
//         },
//         { status: 400 }
//       );
//     }

//     const body = await req.json();
//     const { id, name, date, type } = body;

//     if (!id || !name || !date || !type) {
//       return NextResponse.json(
//         { 
//           success: false, 
//           message: "Missing required fields",
//           details: {
//             id: !!id,
//             name: !!name,
//             date: !!date,
//             type: !!type
//           }
//         },
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

//     const backendUrl = `${apiUrl}/update-holiday`;
    
//     console.log('🔄 PUT Holiday Request:', {
//       backendUrl,
//       company_id,
//       body: { id, name, date, type }
//     });

//     const response = await fetch(backendUrl, {
//       method: "PUT",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//         Accept: "application/json",
//         "X-Company-ID": company_id,
//       },
//       body: JSON.stringify({ id, name, date, type }),
//     });

//     console.log('📡 PUT Holiday Backend Response:', {
//       status: response.status,
//       statusText: response.statusText
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error('❌ PUT Holiday Backend request failed:', {
//         status: response.status,
//         statusText: response.statusText,
//         error: errorText
//       });
      
//       return NextResponse.json(
//         { 
//           success: false, 
//           message: "Backend request failed",
//           status: response.status
//         },
//         { status: response.status }
//       );
//     }

//     const data = await response.json();
    
//     console.log('✅ PUT Holiday Success:', {
//       success: data.success,
//       message: data.message
//     });
    
//     return NextResponse.json(data, { status: response.status });
    
//   } catch (err: any) {
//     console.error("❌ PUT Holiday Error:", err);
//     return NextResponse.json(
//       { 
//         success: false, 
//         message: "Internal server error",
//         error: err.message 
//       },
//       { status: 500 }
//     );
//   }
// }

// // DELETE: Remove a holiday for current company
// export async function DELETE(req: Request) {
//   try {
//     const cookieStore = await cookies();
//     const token = cookieStore.get("access_token")?.value;
//     const company_id = cookieStore.get("company_id")?.value;

//     if (!token || !company_id) {
//       return NextResponse.json(
//         { 
//           success: false, 
//           message: "Missing required parameters",
//           details: {
//             token: !!token,
//             company_id: !!company_id
//           }
//         },
//         { status: 400 }
//       );
//     }

//     const body = await req.json();
//     const { id } = body;

//     if (!id) {
//       return NextResponse.json(
//         { success: false, message: "Missing holiday ID" },
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

//     const backendUrl = `${apiUrl}/holiday`;
    
//     console.log('🗑️ DELETE Holiday Request:', {
//       backendUrl,
//       company_id,
//       body: { id }
//     });

//     const response = await fetch(backendUrl, {
//       method: "DELETE",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//         Accept: "application/json",
//         "X-Company-ID": company_id,
//       },
//       body: JSON.stringify({ id }),
//     });

//     console.log('📡 DELETE Holiday Backend Response:', {
//       status: response.status,
//       statusText: response.statusText
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error('❌ DELETE Holiday Backend request failed:', {
//         status: response.status,
//         statusText: response.statusText,
//         error: errorText
//       });
      
//       return NextResponse.json(
//         { 
//           success: false, 
//           message: "Backend request failed",
//           status: response.status
//         },
//         { status: response.status }
//       );
//     }

//     const data = await response.json();
    
//     console.log('✅ DELETE Holiday Success:', {
//       success: data.success,
//       message: data.message
//     });
    
//     return NextResponse.json(data, { status: response.status });
    
//   } catch (err: any) {
//     console.error("❌ DELETE Holiday Error:", err);
//     return NextResponse.json(
//       { 
//         success: false, 
//         message: "Internal server error",
//         error: err.message 
//       },
//       { status: 500 }
//     );
//   }
// }

// app/api/settings/holiday/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET: Fetch holidays for current company
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const company_id = cookieStore.get("company_id")?.value;

    if (!token || !company_id) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Missing required parameters",
          details: {
            token: !!token,
            company_id: !!company_id
          }
        },
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

    const backendUrl = `${apiUrl}/holiday`;
    
    console.log('📅 GET Holidays Request:', {
      backendUrl,
      company_id
    });

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "X-Company-ID": company_id,
      },
    });

    console.log('📡 GET Holidays Backend Response:', {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ GET Holidays Backend request failed:', {
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

    const data = await response.json();
    
    console.log('✅ GET Holidays Success:', {
      dataCount: data.data?.length || 0,
      success: data.success
    });
    
    return NextResponse.json(data, { status: response.status });
    
  } catch (err: any) {
    console.error("❌ GET Holidays Error:", err);
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

// POST: Add a holiday for current company
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const company_id = cookieStore.get("company_id")?.value;

    if (!token || !company_id) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Missing required parameters",
          details: {
            token: !!token,
            company_id: !!company_id
          }
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { 
      holiday, // This is the correct field name for backend
      date, 
      end_date, 
      is_recurring, 
      is_full_holiday, 
      is_global, 
      role_ids,
      is_multi_day 
    } = body;

    // Validate required fields
    if (!holiday || !date) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Missing required fields",
          details: {
            holiday: !!holiday,
            date: !!date
          }
        },
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

    const backendUrl = `${apiUrl}/add-holiday`;
    
    console.log('🎯 POST Holiday Request:', {
      backendUrl,
      company_id,
      body: { holiday, date, end_date, is_recurring, is_full_holiday, is_global, role_ids }
    });

    // Prepare the data for backend - use the same field names as backend expects
    const backendData = {
      holiday: holiday, // Use 'holiday' directly (not 'name')
      date,
      end_date: end_date || null,
      is_recurring: is_recurring || false,
      is_full_holiday: is_full_holiday !== undefined ? is_full_holiday : true,
      is_global: is_global || false,
      role_ids: role_ids || [],
      company_id,
    };

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(backendData),
    });

    console.log('📡 POST Holiday Backend Response:', {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ POST Holiday Backend request failed:', {
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

    const data = await response.json();
    
    console.log('✅ POST Holiday Success:', {
      success: data.success,
      message: data.message
    });

    return NextResponse.json(data, { status: response.status });

  } catch (err: any) {
    console.error("❌ POST Holiday Error:", err);
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

// PUT: Update a holiday for current company
export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const company_id = cookieStore.get("company_id")?.value;

    if (!token || !company_id) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Missing required parameters",
          details: {
            token: !!token,
            company_id: !!company_id
          }
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { 
      id, 
      holiday, // Use 'holiday' directly (not 'name')
      date, 
      end_date, 
      is_recurring, 
      is_full_holiday, 
      is_global, 
      role_ids 
    } = body;

    // Validate required fields
    if (!id || !holiday || !date) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Missing required fields",
          details: {
            id: !!id,
            holiday: !!holiday,
            date: !!date
          }
        },
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

    const backendUrl = `${apiUrl}/update-holiday`;
    
    console.log('🔄 PUT Holiday Request:', {
      backendUrl,
      company_id,
      body: { id, holiday, date, end_date, is_recurring, is_full_holiday, is_global, role_ids }
    });

    // Prepare the data for backend - use the same field names as backend expects
    const backendData = {
      id,
      holiday: holiday, // Use 'holiday' directly (not 'name')
      date,
      end_date: end_date || null,
      is_recurring: is_recurring || false,
      is_full_holiday: is_full_holiday !== undefined ? is_full_holiday : true,
      is_global: is_global || false,
      role_ids: role_ids || [],
    };

    const response = await fetch(backendUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Company-ID": company_id,
      },
      body: JSON.stringify(backendData),
    });

    console.log('📡 PUT Holiday Backend Response:', {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ PUT Holiday Backend request failed:', {
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

    const data = await response.json();
    
    console.log('✅ PUT Holiday Success:', {
      success: data.success,
      message: data.message
    });
    
    return NextResponse.json(data, { status: response.status });
    
  } catch (err: any) {
    console.error("❌ PUT Holiday Error:", err);
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

// DELETE: Remove a holiday for current company
export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const company_id = cookieStore.get("company_id")?.value;

    if (!token || !company_id) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Missing required parameters",
          details: {
            token: !!token,
            company_id: !!company_id
          }
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing holiday ID" },
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

    const backendUrl = `${apiUrl}/holiday`;
    
    console.log('🗑️ DELETE Holiday Request:', {
      backendUrl,
      company_id,
      body: { id }
    });

    const response = await fetch(backendUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Company-ID": company_id,
      },
      body: JSON.stringify({ id }),
    });

    console.log('📡 DELETE Holiday Backend Response:', {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ DELETE Holiday Backend request failed:', {
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

    const data = await response.json();
    
    console.log('✅ DELETE Holiday Success:', {
      success: data.success,
      message: data.message
    });
    
    return NextResponse.json(data, { status: response.status });
    
  } catch (err: any) {
    console.error("❌ DELETE Holiday Error:", err);
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