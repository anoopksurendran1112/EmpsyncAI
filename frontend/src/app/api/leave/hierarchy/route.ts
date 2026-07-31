// app/api/leave/hierarchy/route.ts
// Proxy to Django: GET/POST/PUT/DELETE /api/leave-flow-hierarchy
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// ─── helpers ────────────────────────────────────────────────────────────────

async function getAuthHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const companyId = cookieStore.get("company_id")?.value;
  return { token, companyId };
}

function unauthorized() {
  return NextResponse.json(
    { success: false, message: "Unauthorized" },
    { status: 401 }
  );
}

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { success: false, message: text || "Unexpected response from backend" };
  }
}

// ─── GET /api/leave/hierarchy ────────────────────────────────────────────────
// Fetches the saved LeaveFlowHierarchy for the current company.
export async function GET() {
  try {
    const { token, companyId } = await getAuthHeaders();
    if (!token) return unauthorized();

    const res = await fetch(`${process.env.API_URL}/leave-flow-hierarchy`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Company-ID": companyId || "",
        Accept: "application/json",
      },
    });

    const data = await parseJsonSafe(res);
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("[leave/hierarchy] GET error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to fetch leave hierarchy" },
      { status: 500 }
    );
  }
}

// ─── POST /api/leave/hierarchy ───────────────────────────────────────────────
// Creates a new LeaveFlowHierarchy record for the company.
export async function POST(req: Request) {
  try {
    const { token, companyId } = await getAuthHeaders();
    if (!token) return unauthorized();

    const body = await req.json();

    const res = await fetch(`${process.env.API_URL}/leave-flow-hierarchy`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Company-ID": companyId || "",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        company_id: body.company_id ?? companyId,
        flow_config: body.flow_config ?? [],
      }),
    });

    const data = await parseJsonSafe(res);
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("[leave/hierarchy] POST error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to create leave hierarchy" },
      { status: 500 }
    );
  }
}

// ─── PUT /api/leave/hierarchy ────────────────────────────────────────────────
// Updates the existing LeaveFlowHierarchy for the company.
export async function PUT(req: Request) {
  try {
    const { token, companyId } = await getAuthHeaders();
    if (!token) return unauthorized();

    const body = await req.json();

    const res = await fetch(`${process.env.API_URL}/leave-flow-hierarchy`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Company-ID": companyId || "",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        company_id: body.company_id ?? companyId,
        flow_config: body.flow_config ?? [],
      }),
    });

    const data = await parseJsonSafe(res);
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("[leave/hierarchy] PUT error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to update leave hierarchy" },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/leave/hierarchy ─────────────────────────────────────────────
// Deletes the LeaveFlowHierarchy for the company.
export async function DELETE(req: Request) {
  try {
    const { token, companyId } = await getAuthHeaders();
    if (!token) return unauthorized();

    const body = await req.json().catch(() => ({}));

    const res = await fetch(`${process.env.API_URL}/leave-flow-hierarchy`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Company-ID": companyId || "",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        company_id: body.company_id ?? companyId,
      }),
    });

    const data = await parseJsonSafe(res);
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("[leave/hierarchy] DELETE error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to delete leave hierarchy" },
      { status: 500 }
    );
  }
}
