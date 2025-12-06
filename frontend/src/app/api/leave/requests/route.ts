// src/app/api/leave/requests/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
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

    // Call the external API with Bearer token
    const res = await fetch(`${process.env.API_URL}/admin/leave-request/1`, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "X-Company-ID": companyId || "",   // ✅ dynamic companyId
  },
});
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Error proxying /admin/leave-request/1:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch leave requests" },
      { status: 500 }
    );
  }
}


/*// app/api/leave/requests/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Extract query params (e.g., ?page=1)
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") || "1";

    // Get company ID from cookies or headers
    const companyId = cookieStore.get("company_id")?.value;
    if (!companyId) {
      return NextResponse.json(
        { success: false, message: "Invalid company ID" },
        { status: 400 }
      );
    }

    // Call Django API
    const res = await fetch(
      `${process.env.API_URL}/leave/requests/${page}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "X-Company-ID": companyId,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Error fetching leave requests:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch leave requests" },
      { status: 500 }
    );
  }
}*/

