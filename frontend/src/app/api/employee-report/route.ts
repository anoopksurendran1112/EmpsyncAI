import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { company_id, report_type, start_date, end_date, employee } = body;

    if (report_type === "punch") {
      if (!company_id || !start_date || !end_date) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }
    } else if (report_type === "employee") {
      if (!company_id || !employee) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Invalid report_type" },
        { status: 400 }
      );
    }

    // ✅ Build URL correctly – API_URL already contains "/api"
    const djangoUrl = `${process.env.API_URL}/employee-report`;

    const djangoRes = await fetch(djangoUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await djangoRes.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Invalid JSON from Django. URL:", djangoUrl);
      console.error("Response status:", djangoRes.status);
      console.error("Response body (first 500 chars):", text.substring(0, 500));
      return NextResponse.json(
        { success: false, message: "Backend returned invalid response. Check API_URL and authentication." },
        { status: 502 }
      );
    }

    return NextResponse.json(data, { status: djangoRes.status });
  } catch (err: any) {
    console.error("Error in /api/employee-report:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server Error" },
      { status: 500 }
    );
  }
}