import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * GET /api/profile/[id]
 * Fetches profile details for a specific employee.
 */
// app/api/profile/[id]/route.ts

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
    const response = await fetch(`${apiUrl}/profile/${id}`, {
      method: "GET",
      headers: {
        "X-Company-ID": company_id.toString(),
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    console.log("🔍 Backend response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Django API GET error:", errorText);
      
      // If employee not found, return specific error
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
    
    return NextResponse.json({ success: true, data: result }, { status: 200 });
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

    // ✅ Parse the request body
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

    // ✅ CRITICAL FIX: Remove prof_img field entirely to avoid backend file validation
    // Since your backend expects prof_img only as a file upload in request.FILES
    // but we're sending JSON, we need to remove it to prevent the 400 error
    const { prof_img, ...bodyWithoutProfImg } = body;
    
    console.log("Sending data to backend (prof_img removed):", {
      ...bodyWithoutProfImg,
      is_active: bodyWithoutProfImg.is_active // This will now include the is_active field
    });

    // ✅ Send PUT request to backend without prof_img
    const response = await fetch(`${apiUrl}/profile/${employeeId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Company-ID": company_id.toString(),
      },
      body: JSON.stringify(bodyWithoutProfImg),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Django API PUT error:", errorText);
      
      // Try to parse error as JSON
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
          errors: errorData.errors || errorData
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (err) {
    console.error("Profile PUT error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}