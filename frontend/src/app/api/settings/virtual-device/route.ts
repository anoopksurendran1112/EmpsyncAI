// src/app/api/virtual-device/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// ✅ GET virtual devices
export async function GET(req: Request) {
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

    const url = new URL(req.url);
    const page = url.searchParams.get("page") || "1";

    const apiUrl = `${process.env.API_URL}/get-virtual-devices?page=${page}`;

    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(companyId ? { "X-Company-ID": companyId } : {}),
      },
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { success: false, message: text || "Unexpected error from backend" },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Error fetching virtual devices:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch virtual devices" },
      { status: 500 }
    );
  }
}

// ✅ PUT virtual device (toggle is_active)
export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const companyId = cookieStore.get("company_id")?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.device_id) {
      return NextResponse.json({ success: false, message: "device_id is required" }, { status: 400 });
    }

    const apiUrl = `${process.env.API_URL}/update-virtual-device`;

    const payload = companyId ? { ...body, company_id: companyId } : body;

    const res = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(companyId ? { "X-Company-ID": companyId } : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Error updating virtual device:", err);
    return NextResponse.json({ success: false, message: "Failed to update virtual device" }, { status: 500 });
  }
}

// ✅ DELETE virtual device
export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const companyId = cookieStore.get("company_id")?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ success: false, message: "id is required" }, { status: 400 });
    }

    const apiUrl = `${process.env.API_URL}/delete-virtual-device/${id}`;

    const res = await fetch(apiUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(companyId ? { "X-Company-ID": companyId } : {}),
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Error deleting virtual device:", err);
    return NextResponse.json({ success: false, message: "Failed to delete virtual device" }, { status: 500 });
  }
}
