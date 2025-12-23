import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/* =========================
   GET: Fetch users by company
   ========================= */
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const companyId = cookieStore.get("company_id")?.value;

    if (!token || !companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized or company ID missing" },
        { status: 401 }
      );
    }

    const res = await fetch(
      `${process.env.API_URL}/add-leave`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Company-ID": companyId,
          Accept: "application/json",
        },
      }
    );

    const text = await res.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid response from backend" },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: res.status });

  } catch (error) {
    console.error("GET add-past-leave error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

/* =========================
   POST: Add past leave
   ========================= */
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const companyId = cookieStore.get("company_id")?.value;

    if (!token || !companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Required fields as per Django
    const requiredFields = [
      "user_id",
      "leave_id",
      "from_date",
      "to_date",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, message: `Missing field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Map leave_choice to Django logic
    let leaveChoice = body.leave_choice;
    if (leaveChoice === "H" || leaveChoice === "half_day") {
      leaveChoice = "half_day";
    } else {
      leaveChoice = "full_day";
    }

    const res = await fetch(
      `${process.env.API_URL}/add-leave`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          user_id: body.user_id,
          leave_id: body.leave_id,
          from_date: body.from_date,
          to_date: body.to_date,
          leave_choice: leaveChoice,
          custom_reason: body.custom_reason || "",
          status: body.status || "A", // Approved default
          company_id: companyId,
        }),
      }
    );

    const text = await res.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid response from backend" },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: res.status });

  } catch (error) {
    console.error("POST add-past-leave error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add leave record" },
      { status: 500 }
    );
  }
}
