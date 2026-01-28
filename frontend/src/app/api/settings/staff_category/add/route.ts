import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    // 🔹 Check token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔹 Parse body
    const body = await req.json();

    // 🔹 Validate required fields
    if (!body.company_id) {
      return NextResponse.json(
        { error: "company_id is required" },
        { status: 400 }
      );
    }

    if (!body.category_name && !body.name) {
      return NextResponse.json(
        { error: "category_name is required" },
        { status: 400 }
      );
    }

    // Build payload according to API spec
    const requestBody = {
      company_id: body.company_id,
      category_name: body.category_name || body.name,
    };

    // console.log("POST Staff Category Request URL:", `${process.env.API_URL}/staff-category/`);
    // console.log("POST Staff Category Request Body:", requestBody);

    // 🔹 Forward to backend - POST /api/staff-category/
    const res = await fetch(`${process.env.API_URL}/staff-category/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    // console.log("POST Staff Category Response Status:", res.status);
    
    // 🔹 Handle response
    const responseText = await res.text();
    
    try {
      const data = JSON.parse(responseText);
      
      if (!res.ok) {
        return NextResponse.json(
          { 
            error: data.message || data.error || "Failed to add staff category",
            details: data.errors,
            status: res.status
          },
          { status: res.status }
        );
      }
      
      // Success response
      return NextResponse.json(data, { status: 201 });
      
    } catch (jsonError) {
      console.error("JSON Parse Error:", jsonError);
      
      if (res.ok) {
        return NextResponse.json(
          { message: "Staff category added successfully" },
          { status: 201 }
        );
      }
      
      return NextResponse.json(
        { 
          error: `Backend returned non-JSON response: ${responseText.substring(0, 200)}`,
          status: res.status
        },
        { status: 502 }
      );
    }
    
  } catch (err: any) {
    console.error("Add Staff Category API Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}