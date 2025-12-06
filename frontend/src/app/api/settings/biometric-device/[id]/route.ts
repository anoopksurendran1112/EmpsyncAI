import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// ✅ Update biometric device
export async function PUT(req: Request, context: any) {
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

    const body = await req.json();
    const { id } = context.params;

    const apiUrl = `${process.env.API_URL}/biometric-device/${id}`;

    // ✅ Only attach company if available
    const payload = companyId ? { ...body, company: companyId } : body;

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
    console.error("Error updating device:", err);
    return NextResponse.json(
      { success: false, message: "Failed to update device" },
      { status: 500 }
    );
  }
}

// ✅ Delete biometric device
export async function DELETE(req: Request, context: any) {
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

    const { id } = context.params;
    const apiUrl = `${process.env.API_URL}/biometric-device/${id}`;

    const res = await fetch(apiUrl, {
      method: "DELETE",
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
    console.error("Error deleting device:", err);
    return NextResponse.json(
      { success: false, message: "Failed to delete device" },
      { status: 500 }
    );
  }
}
