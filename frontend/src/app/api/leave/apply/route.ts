
/*// app/api/leave/apply/route.ts
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

    const body = await req.json();

    // ✅ Adjust to match Django API expectations
    const res = await fetch(`${process.env.API_URL}/apply-leave`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Company-ID": companyId || "7", 
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        from_date: body.from_date,
        to_date: body.to_date,
        leave_id: body.leave_id,
        leave_choice: body.leave_choice,
      }),
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Error in /apply-leave:", err);
    return NextResponse.json(
      { success: false, message: "Failed to apply leave" },
      { status: 500 }
    );
  }
}*/
// app/api/leave/apply/route.ts
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

    const body = await req.json();
const res = await fetch(`${process.env.API_URL}/apply-leave`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "X-Company-ID": companyId || "",   // ✅ dynamic companyId
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: JSON.stringify({
    from_date: body.from_date,
    to_date: body.to_date,
    leave_id: body.leave_id,
    leave_choice: body.leave_choice === "half_day" || body.leave_choice === "H" ? "H" : "F",
    custom_reason: body.custom_reason || "",
    company_id: companyId || "",       // ✅ dynamic companyId
  }),
});

    let data;
    const text = await res.text(); // Read raw response first
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
    console.error("Error in /apply-leave:", err);
    return NextResponse.json(
      { success: false, message: "Failed to apply leave" },
      { status: 500 }
    );
  }
}

