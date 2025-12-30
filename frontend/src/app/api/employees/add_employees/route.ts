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

//     // Validate required fields (basic check, adjust as needed)
//     if (!body.first_name || !body.last_name || !body.email || !body.password) {
//       return NextResponse.json(
//         { error: "Missing required employee fields" },
//         { status: 400 }
//       );
//     }

//     const apiUrl = process.env.API_URL;
//     const fetchUrl = `${apiUrl}/signup`;

//     const res = await fetch(fetchUrl, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//         "X-Company-ID": body.company_id?.toString() || "", // Optional
//       },
//       body: JSON.stringify(body),
//       cache: "no-store",
//     });

//     if (!res.ok) {
//       const errorText = await res.text();
//       console.error("Failed to add employee:", res.status, errorText);
//       return NextResponse.json(
//         { error: "Failed to add employee", details: errorText },
//         { status: res.status }
//       );
//     }

//     const responseData = await res.json();
//     return NextResponse.json(responseData);
//   } catch (err) {
//     console.error("Add Employee API error:", err);
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
    
    // Check if the request is FormData (has multipart/form-data content type)
    const contentType = req.headers.get("content-type") || "";
    
    let body: any = {};
    
    if (contentType.includes("multipart/form-data")) {
      // Handle FormData (for file uploads)
      const formData = await req.formData();
      
      // Convert FormData to object
      const formDataObj: Record<string, any> = {};
      for (const [key, value] of formData.entries()) {
        // Handle checkbox values
        if (key === 'is_whatsapp' || key === 'is_sms' || key === 'is_wfh') {
          formDataObj[key] = value === 'true' || value === '1';
        } else if (key === 'role_id' || key === 'company_id') {
          formDataObj[key] = value ? Number(value) : null;
        } else if (key !== 'prof_img') { // Exclude file from object conversion
          formDataObj[key] = value;
        }
      }
      
      body = formDataObj;
      
      // Handle file separately
      const file = formData.get('prof_img') as File | null;
      
      // Now forward the FormData to Django backend
      const apiUrl = process.env.API_URL;
      const fetchUrl = `${apiUrl}/signup`;
      
      // Create new FormData for Django
      const djangoFormData = new FormData();
      
      // Add all form fields to Django FormData
      Object.entries(body).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          djangoFormData.append(key, value.toString());
        }
      });
      
      // Add file if exists
      if (file) {
        djangoFormData.append('prof_img', file);
      }
      
      const headers: HeadersInit = {};
      
      // Add token if exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      // Add company ID header
      if (body.company_id) {
        headers["X-Company-ID"] = body.company_id.toString();
      }
      
      const res = await fetch(fetchUrl, {
        method: "POST",
        headers: headers,
        body: djangoFormData,
      });
      
      const responseData = await res.json();
      
      if (!res.ok) {
        console.error("Backend error:", res.status, responseData);
        return NextResponse.json(
          { 
            error: "Failed to add employee",
            details: responseData.message || responseData.errors,
            success: responseData.success || false
          },
          { status: res.status }
        );
      }
      
      return NextResponse.json(responseData);
      
    } else {
      // Handle JSON request (without file upload)
      body = await req.json();
      
      // Validate required fields for JSON request
      if (!body.first_name || !body.last_name || !body.email || !body.password || !body.company_id) {
        return NextResponse.json(
          { error: "Missing required employee fields" },
          { status: 400 }
        );
      }
      
      const apiUrl = process.env.API_URL;
      const fetchUrl = `${apiUrl}/signup`;
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      // Add token if exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      // Add company ID header
      if (body.company_id) {
        headers["X-Company-ID"] = body.company_id.toString();
      }
      
      const res = await fetch(fetchUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body),
        cache: "no-store",
      });
      
      const responseData = await res.json();
      
      if (!res.ok) {
        console.error("Backend error:", res.status, responseData);
        return NextResponse.json(
          { 
            error: "Failed to add employee",
            details: responseData.message || responseData.errors,
            success: responseData.success || false
          },
          { status: res.status }
        );
      }
      
      return NextResponse.json(responseData);
    }
    
  } catch (err) {
    console.error("Add Employee API error:", err);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: err instanceof Error ? err.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}