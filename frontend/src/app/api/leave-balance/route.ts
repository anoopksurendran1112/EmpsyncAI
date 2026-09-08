import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const companyId = searchParams.get("company_id");
    const userId = searchParams.get("user_id");
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    const params = new URLSearchParams();

    if (companyId) params.append("company_id", companyId);
    if (userId) params.append("user_id", userId);
    if (year) params.append("year", year);
    if (month) params.append("month", month);

    const accessToken = request.cookies.get("access_token")?.value;

    const headers: HeadersInit = {};

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const response = await fetch(
      `${BACKEND_URL}/api/leave-balance?${params.toString()}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Leave balance API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch leave balance",
      },
      { status: 500 }
    );
  }
}