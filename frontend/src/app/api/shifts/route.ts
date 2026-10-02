import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const configuredApiUrl = (process.env.API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
const apiBaseUrl = configuredApiUrl.endsWith("/api") ? configuredApiUrl : `${configuredApiUrl}/api`;
const backendUrl = `${apiBaseUrl}/company-shifts`;

async function readResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      message: `Shift service returned a non-JSON response (${response.status})`,
      details: text.slice(0, 200),
    };
  }
}

async function proxyRequest(request: Request, method: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const companyId = cookieStore.get("company_id")?.value;

  if (!token || !companyId) {
    return NextResponse.json(
      { success: false, message: "Authentication or company information is missing" },
      { status: 401 },
    );
  }

  const body = method === "GET" || method === "DELETE" ? undefined : {
    ...(await request.json()),
    company_id: companyId,
  };
  const url = method === "GET" ? `${backendUrl}?company_id=${companyId}` : backendUrl;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
    });
    const data = await readResponse(response);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Shift API proxy error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to reach the shift service" },
      { status: 502 },
    );
  }
}

export async function GET(request: Request) {
  return proxyRequest(request, "GET");
}

export async function POST(request: Request) {
  return proxyRequest(request, "POST");
}

export async function PUT(request: Request) {
  return proxyRequest(request, "PUT");
}

export async function DELETE(request: Request) {
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
    const body = await request.json();
    const response = await fetch(backendUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...body, company_id: companyId }),
      cache: "no-store",
    });
    const data = await readResponse(response);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Shift delete proxy error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to reach the shift service" },
      { status: 502 },
    );
  }
}
