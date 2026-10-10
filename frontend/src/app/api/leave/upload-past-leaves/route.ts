// app/api/leave/upload-past-leaves/route.ts
// Proxy: multipart file upload -> Django POST /api/upload-past-leaves
// Imports bulk past leave records (one row = one leave) directly into the Leave table.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const companyId = cookieStore.get("company_id")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Forward the raw multipart body (Do NOT set Content-Type manually —
    // fetch adds the multipart boundary automatically.)
    const formData = await req.formData();

    const res = await fetch(`${process.env.API_URL}/upload-past-leaves`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Company-ID": companyId || "",
      },
      body: formData,
    });

    const text = await res.text(); // Read raw response first
    let data;
    try {
      data = JSON.parse(text); // Try parsing as JSON
    } catch {
      console.error("Non-JSON response from Django:", text);
      return NextResponse.json(
        { success: false, message: text || "Unexpected error from backend" },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Error in /upload-past-leaves:", err);
    return NextResponse.json(
      { success: false, message: "Failed to upload past leave records" },
      { status: 500 }
    );
  }
}