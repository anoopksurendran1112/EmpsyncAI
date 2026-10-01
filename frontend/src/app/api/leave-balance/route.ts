import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const companyId = searchParams.get("company_id");
    const userId = searchParams.get("user_id");
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    const cookieStore = await cookies();
    const accessToken =
      request.cookies.get("access_token")?.value ||
      cookieStore.get("access_token")?.value;
    const cookieCompanyId = cookieStore.get("company_id")?.value;
    const finalCompanyId = companyId || cookieCompanyId;

    const params = new URLSearchParams();

    if (finalCompanyId) params.append("company_id", finalCompanyId);
    if (userId) params.append("user_id", userId);
    if (year) params.append("year", year);
    if (month) params.append("month", month);

    const headers: HeadersInit = {
      Accept: "application/json",
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    if (finalCompanyId) {
      headers["X-Company-ID"] = finalCompanyId;
    }

    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
    }

    const apiBase = (
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8000/api"
    ).replace(/\/+$/, "");

    const endpoint = apiBase.endsWith("/api")
      ? `${apiBase}/leave-balance`
      : `${apiBase}/api/leave-balance`;

    const queryString = params.toString();
    const requestUrl = queryString ? `${endpoint}?${queryString}` : endpoint;

    const response = await fetch(requestUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Non-JSON response from backend:", text);
      return NextResponse.json(
        {
          success: false,
          message: text || "Invalid response from backend",
        },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error: any) {
    console.error("Leave balance API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to fetch leave balance",
      },
      { status: 500 }
    );
  }
}