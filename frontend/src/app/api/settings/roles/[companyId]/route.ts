/*import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(
  req: Request,
  { params }: { params: { companyId: string } }
) {
  const { companyId } = await  params;

  // 🔐 grab token from cookies
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(
      `${process.env.API_URL}/role/${companyId}`, // hit backend
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // use cookie token
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch Roles");
    }

    const data = await res.json();
const rolesArray = data.data || data || [];
return NextResponse.json(rolesArray);

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}*/

// src/app/api/settings/roles/[companyId]/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE_URL = process.env.API_URL;

// ====================== GET ======================
export async function GET(
  req: Request,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = await params; // ✅ Await params
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(`${BASE_URL}/role/${companyId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to fetch roles" },
        { status: res.status }
      );
    }

    return NextResponse.json(data.data || data);
  } catch (err: any) {
    console.error("Error fetching roles:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ====================== PUT ======================
export async function PUT(
  req: Request,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = await params; // ✅ Await params
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const res = await fetch(`${BASE_URL}/role/${companyId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to update role" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Error updating role:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ====================== DELETE ======================
export async function DELETE(
  req: Request,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = await params; // ✅ Await params
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Log for debugging
    console.log("DELETE request body:", body);
    console.log("Company ID from params:", companyId);

    const res = await fetch(`${BASE_URL}/role/${companyId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: body.id,
        company_id: companyId // Use the companyId from params
      }),
    });

    // Check if response is JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error("Non-JSON response from backend:", text.slice(0, 500));
      throw new Error("Backend returned non-JSON response");
    }

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || `Failed to delete role: ${res.status}` },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Error deleting role:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" }, 
      { status: 500 }
    );
  }
}