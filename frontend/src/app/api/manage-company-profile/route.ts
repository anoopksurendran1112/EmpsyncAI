import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const getApiUrl = () => {
  const apiUrl = process.env.API_URL || "http://127.0.0.1:8000/api";
  return apiUrl.replace(/\/+$/, ""); // remove trailing slash if any
};

// Helper to forward request to Django
async function forwardRequest(
  req: NextRequest,
  method: string,
  body?: any
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiUrl = getApiUrl();
    // Preserve the full path including query string
    const url = new URL(req.url);
    const pathWithQuery = url.pathname + url.search;
    
    const djangoUrl = `${apiUrl}/manage-company-profile/${url.search}`;

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
      cache: "no-store",
    };

    if (body && (method === "POST" || method === "PUT" || method === "DELETE")) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(djangoUrl, fetchOptions);

    const responseData = await response.json().catch(() => null);
    return NextResponse.json(responseData, { status: response.status });
  } catch (err) {
    console.error(`Error forwarding ${method} request:`, err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return forwardRequest(req, "GET");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return forwardRequest(req, "POST", body);
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return forwardRequest(req, "PUT", body);
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return forwardRequest(req, "DELETE", body);
}