import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const configuredApiUrl = (process.env.API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
const apiBaseUrl = configuredApiUrl.endsWith("/api") ? configuredApiUrl : `${configuredApiUrl}/api`;
const backendUrl = `${apiBaseUrl}/salary/employees`;

async function readResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      message: `Salary service returned a non-JSON response (${response.status})`,
      details: text.slice(0, 200),
    };
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const companyId = cookieStore.get("company_id")?.value;

  if (!token || !companyId) {
    return NextResponse.json(
      { success: false, message: "Authentication or company information is missing" },
      { status: 401 },
    );
  }

  try {
    const response = await fetch(`${backendUrl}?company_id=${companyId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    const data = await readResponse(response);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Salary employees proxy error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to reach the salary service" },
      { status: 502 },
    );
  }
}
