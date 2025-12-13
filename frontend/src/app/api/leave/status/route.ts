import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function PUT(req: Request) {
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

    const body = await req.json();

    if (!body.id || !body.status) {
      return NextResponse.json(
        { success: false, message: "Missing leave id or status" },
        { status: 400 }
      );
    }

    console.log("Updating leave status:", body);

    const res = await fetch(`${process.env.API_URL}/leave/update-leave`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Company-ID": companyId || "", // Added
      },
      body: JSON.stringify(body),
    });

    let data;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Non-JSON response from Django:", text);
      return NextResponse.json(
        { success: false, message: text || "Unexpected error from backend" },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("Error proxying /leave/update-leave:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to update leave status" },
      { status: 500 }
    );
  }
}
