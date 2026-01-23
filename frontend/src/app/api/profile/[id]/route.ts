import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * GET /api/profile/[id]
 * Fetches profile details for a specific employee.
 */
// app/api/profile/[id]/route.ts

// Update the GET function in your API route:

export async function GET(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log("🔍 Fetching employee with ID:", id);

    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const company_id = cookieStore.get("company_id")?.value;

    if (!token || !company_id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const apiUrl = process.env.API_URL;
    
    // Add cache busting parameter
    const cacheBuster = `?_t=${Date.now()}`;
    
    const response = await fetch(`${apiUrl}/profile/${id}${cacheBuster}`, {
      method: "GET",
      headers: {
        "X-Company-ID": company_id.toString(),
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
      cache: "no-store",
    });

    console.log("🔍 Backend response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Django API GET error:", errorText);
      
      if (response.status === 404) {
        return NextResponse.json(
          { 
            success: false, 
            message: "Employee not found",
            employeeId: id
          }, 
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { success: false, message: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log("🔍 Backend response data:", result);
    
    // Return with headers to prevent caching at Next.js level
    return NextResponse.json({ 
      success: true, 
      data: result,
      fromCache: false // Explicitly indicate this is fresh data
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (err) {
    console.error("Profile GET error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile/[id]
 * Updates profile details for a specific employee.
 * Removes prof_img field to avoid backend file validation errors.
 */
// export async function PUT(
//   req: Request, 
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const { id } = await params;
    
//     const cookieStore = await cookies();
//     const token =
//       cookieStore.get("access_token")?.value ||
//       req.headers.get("authorization")?.replace("Bearer ", "");
//     const company_id =
//       cookieStore.get("company_id")?.value ||
//       req.headers.get("x-company-id");

//     if (!token) {
//       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
//     }

//     if (!company_id) {
//       return NextResponse.json({ success: false, message: "Missing company_id" }, { status: 400 });
//     }

//     const employeeId = id;
//     if (!employeeId) {
//       return NextResponse.json({ success: false, message: "Missing employee ID" }, { status: 400 });
//     }

//     const apiUrl = process.env.API_URL;
//     if (!apiUrl) {
//       return NextResponse.json({ success: false, message: "API_URL not set" }, { status: 500 });
//     }

//     // ✅ Parse the request body
//     const text = await req.text();
//     if (!text) {
//       return NextResponse.json({ success: false, message: "Empty request body" }, { status: 400 });
//     }

//     let body;
//     try {
//       body = JSON.parse(text);
//     } catch {
//       return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
//     }

//     // ✅ CRITICAL FIX: Remove prof_img field entirely to avoid backend file validation
//     // Since your backend expects prof_img only as a file upload in request.FILES
//     // but we're sending JSON, we need to remove it to prevent the 400 error
//     const { prof_img, ...bodyWithoutProfImg } = body;
    
//     console.log("Sending data to backend (prof_img removed):", {
//       ...bodyWithoutProfImg,
//       is_active: bodyWithoutProfImg.is_active // This will now include the is_active field
//     });

//     // ✅ Send PUT request to backend without prof_img
//     const response = await fetch(`${apiUrl}/profile/${employeeId}`, {
//       method: "PUT",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//         "X-Company-ID": company_id.toString(),
//       },
//       body: JSON.stringify(bodyWithoutProfImg),
//       cache: "no-store",
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error("Django API PUT error:", errorText);
      
//       // Try to parse error as JSON
//       let errorData;
//       try {
//         errorData = JSON.parse(errorText);
//       } catch {
//         errorData = { message: errorText };
//       }
      
//       return NextResponse.json(
//         { 
//           success: false, 
//           message: `Backend error: ${response.status}`,
//           errors: errorData.errors || errorData
//         },
//         { status: response.status }
//       );
//     }

//     const result = await response.json();
//     return NextResponse.json({ success: true, data: result }, { status: 200 });
//   } catch (err) {
//     console.error("Profile PUT error:", err);
//     return NextResponse.json(
//       { success: false, message: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

export async function PUT(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const cookieStore = await cookies();
    const token =
      cookieStore.get("access_token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");
    const company_id =
      cookieStore.get("company_id")?.value ||
      req.headers.get("x-company-id");

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    if (!company_id) {
      return NextResponse.json({ success: false, message: "Missing company_id" }, { status: 400 });
    }

    const employeeId = id;
    if (!employeeId) {
      return NextResponse.json({ success: false, message: "Missing employee ID" }, { status: 400 });
    }

    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      return NextResponse.json({ success: false, message: "API_URL not set" }, { status: 500 });
    }

    // Parse request body
    const text = await req.text();
    if (!text) {
      return NextResponse.json({ success: false, message: "Empty request body" }, { status: 400 });
    }

    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
    }

    // Remove prof_img
    const { prof_img, ...bodyWithoutProfImg } = body;
    
    console.log("📤 Original request from frontend:", bodyWithoutProfImg);

    // ⚠️ SIMPLIFIED APPROACH: Since your Axios test works directly,
    // let's just forward the request exactly as we receive it
    
    // But first, let's get current data to compare
    const getResponse = await fetch(`${apiUrl}/profile/${employeeId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Company-ID": company_id.toString(),
      },
      cache: "no-store",
    });

    let finalPayload = { ...bodyWithoutProfImg };
    
    if (getResponse.ok) {
      const currentData = await getResponse.json();
      console.log("📋 Current employee data from backend:", currentData.data);
      
      // Filter out fields that haven't changed
      const changedFields: Record<string, any> = {};
      Object.keys(bodyWithoutProfImg).forEach(key => {
        const currentValue = currentData.data?.[key];
        const newValue = bodyWithoutProfImg[key];
        
        // Compare values (handle null/undefined)
        const currentVal = currentValue !== null && currentValue !== undefined ? String(currentValue) : null;
        const newVal = newValue !== null && newValue !== undefined ? String(newValue) : null;
        
        if (currentVal !== newVal) {
          changedFields[key] = newValue;
        }
      });
      
      console.log("🔄 Fields that actually changed:", changedFields);
      
      if (Object.keys(changedFields).length > 0) {
        finalPayload = changedFields;
      } else {
        console.log("⚠️ No actual changes detected");
        return NextResponse.json({ 
          success: true, 
          data: currentData.data,
          message: "No changes detected" 
        }, { status: 200 });
      }
    } else {
      // If we can't get current data, just use the original payload
      console.log("⚠️ Could not fetch current data, using original payload");
    }

    // Remove messaging fields as a precaution
    delete finalPayload.is_sms;
    delete finalPayload.is_whatsapp;
    
    console.log("📤 Final payload to Django:", finalPayload);
    
    // Check if we have any fields to update
    if (Object.keys(finalPayload).length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "No changes to update",
        data: {} 
      }, { status: 200 });
    }

    // Forward the request to Django - similar to your Axios test
    const response = await fetch(`${apiUrl}/profile/${employeeId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-Company-ID": company_id.toString(),
        // Optionally add cookie if available
        ...(cookieStore.get("refresh_token")?.value && {
          "Cookie": `refresh_token=${cookieStore.get("refresh_token")?.value}`
        })
      },
      body: JSON.stringify(finalPayload),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Django backend error:", errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: `Backend error: ${response.status}`,
          errors: errorData.errors || errorData,
          backendMessage: errorData.message
        },
        { status: response.status }
      );
    }

// In the PUT function, after successful update:
      const result = await response.json();

      // Add cache invalidation headers
      const headers = {
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      };

      return NextResponse.json({ 
        success: true, 
        data: result.data || result,
        message: result.message || "Profile updated successfully"
      }, { 
        status: 200,
        headers: headers
      });
  } catch (err) {
    console.error("Profile PUT error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error", error: String(err) },
      { status: 500 }
    );
  }
}