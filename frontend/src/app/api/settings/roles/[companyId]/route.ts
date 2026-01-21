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
    const { companyId } = params;
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Extract role ID from request body (PUT needs role ID, not company ID)
    const roleId = body.id;
    
    if (!roleId) {
      return NextResponse.json(
        { error: "Role ID is required in request body for PUT" },
        { status: 400 }
      );
    }

    console.log(`PUT Request - Company ID from URL: ${companyId}, Role ID from body: ${roleId}`);

    // IMPORTANT: PUT uses role ID in URL, not company ID
    const res = await fetch(`${BASE_URL}/role/${roleId}/`, { // Use roleId with trailing slash
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    // First get response as text to debug
    const responseText = await res.text();
    
    // Check if response is JSON
    if (res.headers.get('content-type')?.includes('application/json')) {
      try {
        const data = JSON.parse(responseText);
        
        if (!res.ok) {
          return NextResponse.json(
            { error: data.message || `Failed to update role (${res.status})` },
            { status: res.status }
          );
        }
        
        return NextResponse.json(data);
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
      }
    }
    
    // If we get here, response wasn't valid JSON
    console.error("Non-JSON response from PUT:", responseText.substring(0, 500));
    
    // Check if it's an HTML error page
    if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
      return NextResponse.json(
        { 
          error: "Backend returned HTML error page. Check: 1) URL is correct, 2) Role ID exists, 3) Authentication is valid",
          hint: "PUT endpoint expects /role/{roleId}/ with role ID in URL, not company ID"
        },
        { status: 502 }
      );
    }
    
    return NextResponse.json(
      { error: `Unexpected response: ${responseText.substring(0, 200)}` },
      { status: 500 }
    );
    
  } catch (err: any) {
    console.error("Error updating role:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
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