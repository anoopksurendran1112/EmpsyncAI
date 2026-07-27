import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const buildProxyHeaders = async (): Promise<HeadersInit> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const headers: HeadersInit = {
    Accept: "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export async function GET(req: Request) {
  try {
    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      return NextResponse.json({ success: false, message: "API_URL is not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("company_id");
    if (!companyId) {
      return NextResponse.json({ success: false, message: "company_id query parameter is required" }, { status: 400 });
    }

    const headers = await buildProxyHeaders();
    const response = await fetch(`${apiUrl}/employee-draft/?company_id=${encodeURIComponent(companyId)}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error("employee-draft GET proxy error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      return NextResponse.json({ success: false, message: "API_URL is not configured" }, { status: 500 });
    }

    const body = await req.json();
    const headers = await buildProxyHeaders();
    const requestHeaders = new Headers(headers);
    requestHeaders.set("Content-Type", "application/json");

    const res = await fetch(`${apiUrl}/employee-draft/`, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("employee-draft POST proxy error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      return NextResponse.json({ success: false, message: "API_URL is not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("company_id");
    
    const headers = await buildProxyHeaders();
    const requestHeaders = new Headers(headers);

    let url = `${apiUrl}/employee-draft/`;
    if (companyId) {
      url += `?company_id=${encodeURIComponent(companyId)}`;
    }

    const res = await fetch(url, {
      method: "DELETE",
      headers: requestHeaders,
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("employee-draft DELETE proxy error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
