import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// ✅ Add biometric device
export async function POST(req: Request) {
  try {
    // ✅ Await cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const companyId = cookieStore.get("company_id")?.value || "7";

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    // ✅ Ensure company_id is included as per backend requirement
    const payload = { ...body, company_id: companyId };

    const apiUrl = `${process.env.API_URL}/add-biometric-device`;

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Company-ID": companyId, // keeps header consistent
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Non-JSON response from backend:", text);
      return NextResponse.json(
        { success: false, message: text || "Unexpected error from backend" },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Error creating biometric device:", err);
    return NextResponse.json(
      { success: false, message: "Failed to create device" },
      { status: 500 }
    );
  }
}
