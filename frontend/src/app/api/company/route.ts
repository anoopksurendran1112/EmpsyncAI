import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * GET /api/company
 * Fetches all companies or specific company details.
 */
export async function GET(req: Request) {
  try {
    console.log("🔍 Fetching companies");

    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const company_id = cookieStore.get("company_id")?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const apiUrl = process.env.API_URL;
    const response = await fetch(`${apiUrl}/api/company`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(company_id && { "X-Company-ID": company_id.toString() }),
      },
      cache: "no-store",
    });

    console.log("🔍 Backend response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Django API GET error:", errorText);
      
      return NextResponse.json(
        { 
          success: false, 
          message: `Backend error: ${response.status}`,
          details: errorText
        }, 
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log("🔍 Backend response data:", result);
    
    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (err) {
    console.error("Company GET error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/company
 * Updates company details.
 * Handles both JSON data and file uploads for company_img.
 */
export async function PUT(req: Request) {
  try {
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

    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      return NextResponse.json({ success: false, message: "API_URL not set" }, { status: 500 });
    }

    // Check if the request is multipart/form-data (file upload) or JSON
    const contentType = req.headers.get("content-type") || "";

    let body: FormData | string;
    let headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      "X-Company-ID": company_id.toString(),
    };

    if (contentType.includes("multipart/form-data")) {
      // Handle file upload with FormData
      body = await req.formData();
      // Don't set Content-Type for FormData - browser will set it with boundary
    } else {
      // Handle JSON data
      headers["Content-Type"] = "application/json";
      
      // ✅ Parse the request body
      const text = await req.text();
      if (!text) {
        return NextResponse.json({ success: false, message: "Empty request body" }, { status: 400 });
      }

      let jsonBody;
      try {
        jsonBody = JSON.parse(text);
      } catch {
        return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
      }

      // ✅ Ensure companyId is included in the request
      const requestBody = {
        ...jsonBody,
        companyId: jsonBody.companyId || company_id, // Use provided companyId or fallback to cookie
      };

      console.log("Sending data to backend:", requestBody);
      body = JSON.stringify(requestBody);
    }

    // ✅ Send PUT request to backend
    const response = await fetch(`${apiUrl}/api/company`, {
      method: "PUT",
      headers,
      body,
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
          errors: errorData.errors || errorData,
          status: response.status
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log("✅ Company update successful:", result);
    
    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (err) {
    console.error("Company PUT error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}