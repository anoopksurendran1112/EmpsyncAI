import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ 
        success: false,
        message: "Unauthorized" 
      }, { status: 401 });
    }

    const body = await req.json();
    
    // Extract parameters from request body
    const company_id = body.company_id || cookieStore.get("company_id")?.value;
    const user_id = body.user_id; // Optional
    const date = body.date; // Optional

    if (!company_id) {
      return NextResponse.json({ 
        success: false,
        message: "Missing company_id" 
      }, { status: 400 });
    }

    const apiUrl = process.env.API_URL;

    // Call the Django backend fix-punch-status endpoint
    const res = await fetch(`${apiUrl}/punch/fix-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        company_id: parseInt(company_id),
        user_id: user_id ? parseInt(user_id) : null,
        date: date || null,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { 
          success: false,
          message: data.message || `API error ${res.status}`,
          fixed: 0
        },
        { status: res.status }
      );
    }

    // Return the result from Django backend
    return NextResponse.json({
      success: data.success || false,
      message: data.message || "Operation completed",
      fixed: data.fixed || 0,
      details: data.details || null
    });

  } catch (err) {
    console.error("Fix punches API error:", err);
    return NextResponse.json(
      { 
        success: false,
        message: "Internal server error",
        fixed: 0,
        error: err instanceof Error ? err.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}