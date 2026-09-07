import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE_URL = process.env.API_URL;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!BASE_URL) {
      return NextResponse.json(
        { success: false, message: "API_URL not configured" },
        { status: 500 }
      );
    }

    const res = await fetch(`${BASE_URL}/company-head/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Company Head GET error:", error);

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!BASE_URL) {
      return NextResponse.json(
        { success: false, message: "API_URL not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const res = await fetch(`${BASE_URL}/company-head/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Company Head PUT error:", error);

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}