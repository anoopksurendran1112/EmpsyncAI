//frontend/src/api/employee-profile/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// ✅ CREATE PROFILE (POST)
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies(); // ✅ FIXED
    const token = cookieStore.get("access_token")?.value;

    const body = await req.json();

    const apiUrl = process.env.API_URL;

    const res = await fetch(`${apiUrl}/employee-profile/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Profile POST error:", data);
      return NextResponse.json(
        {
          error: "Failed to create employee profile",
          details: data,
        },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ✅ GET PROFILE
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies(); // ✅ FIXED
    const token = cookieStore.get("access_token")?.value;

    const { searchParams } = new URL(req.url);
    const employee_id = searchParams.get("employee_id");

    if (!employee_id) {
      return NextResponse.json(
        { error: "employee_id is required" },
        { status: 400 }
      );
    }

    const apiUrl = process.env.API_URL;

    const res = await fetch(
      `${apiUrl}/employee-profile/?employee_id=${employee_id}`,
      {
        method: "GET",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        cache: "no-store",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch profile", details: data },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ✅ UPDATE PROFILE (PUT)
export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies(); // ✅ FIXED
    const token = cookieStore.get("access_token")?.value;

    const body = await req.json();

    const apiUrl = process.env.API_URL;

    const res = await fetch(`${apiUrl}/employee-profile/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to update profile", details: data },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("PUT error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ✅ DELETE PROFILE
export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies(); // ✅ FIXED
    const token = cookieStore.get("access_token")?.value;

    const { searchParams } = new URL(req.url);
    const employee_id = searchParams.get("employee_id");

    if (!employee_id) {
      return NextResponse.json(
        { error: "employee_id is required" },
        { status: 400 }
      );
    }

    const apiUrl = process.env.API_URL;

    const res = await fetch(
      `${apiUrl}/employee-profile/?employee_id=${employee_id}`,
      {
        method: "DELETE",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    if (!res.ok) {
      const data = await res.json();
      return NextResponse.json(
        { error: "Failed to delete profile", details: data },
        { status: res.status }
      );
    }

    return NextResponse.json({
      message: "Profile deleted successfully",
    });
  } catch (err) {
    console.error("DELETE error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}