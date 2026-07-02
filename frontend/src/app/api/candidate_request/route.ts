import { NextResponse } from "next/server";

const getBackendUrl = (path: string = "candidate_request/") => {
  const apiUrl = process.env.API_URL || "http://127.0.0.1:8000/api";
  return `${apiUrl.replace(/\/+$/, '')}/${path}`;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const response = await fetch(getBackendUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    return await handleResponse(response);
  } catch (err) {
    return handleError(err);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = `${getBackendUrl()}?${searchParams.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    return await handleResponse(response);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const response = await fetch(getBackendUrl(), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    return await handleResponse(response);
  } catch (err) {
    return handleError(err);
  }
}

async function handleResponse(response: Response) {
  const contentType = response.headers.get("content-type");
  let result;

  if (contentType && contentType.includes("application/json")) {
    result = await response.json();
  } else {
    const text = await response.text();
    return NextResponse.json(
      { message: "Backend returned a non-JSON response.", details: text },
      { status: response.status || 500 }
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      { message: result.message || result.errors || "Request failed", ...result },
      { status: response.status }
    );
  }

  return NextResponse.json(result, { status: 200 });
}

function handleError(err: any) {
  console.error("Proxy error:", err);
  return NextResponse.json(
    { message: "Internal server error" },
    { status: 500 }
  );
}