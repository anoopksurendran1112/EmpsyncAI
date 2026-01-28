import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE_URL = process.env.API_URL;

// ====================== GET (List all staff types) ======================
export async function GET(
  req: Request,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build URL: /api/staff-type/?company_id=7
    const url = new URL(`${BASE_URL}/staff-type/`);
    url.searchParams.append("company_id", companyId);

    // console.log("GET Request URL:", url.toString());

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    // console.log("GET Response Status:", res.status);

    // Handle response
    const contentType = res.headers.get('content-type');
    const responseText = await res.text();

    if (!contentType || !contentType.includes('application/json')) {
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
        return NextResponse.json(
          { 
            error: "Backend returned HTML error page",
            hint: `Check if endpoint exists: ${url.toString()}`,
            status: res.status
          },
          { status: 502 }
        );
      }
      return NextResponse.json(
        { error: "Backend returned non-JSON response", text: responseText.substring(0, 200) },
        { status: 502 }
      );
    }

    try {
      const data = JSON.parse(responseText);
      
      if (!res.ok) {
        return NextResponse.json(
          { error: data.message || `Failed to fetch staff types: ${res.status}` },
          { status: res.status }
        );
      }

      return NextResponse.json(data);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON response from backend", text: responseText.substring(0, 200) },
        { status: 502 }
      );
    }
  } catch (err: any) {
    console.error("Error fetching staff types:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// ====================== PUT (Update staff type) ======================
export async function PUT(
  req: Request,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Extract staff type ID from request body
    const typeId = body.id;
    
    if (!typeId) {
      return NextResponse.json(
        { error: "Staff type ID is required in request body for PUT" },
        { status: 400 }
      );
    }

    // Build request payload according to API spec
    const requestBody = {
      company_id: companyId,
      type_name: body.type_name || body.name, // Accept both type_name and name
    };

    // console.log(`PUT Request URL: ${BASE_URL}/staff-type/${typeId}`);
    // console.log(`PUT Request Body:`, requestBody);

    // PUT endpoint: /api/staff-type/<type_id>
    const res = await fetch(`${BASE_URL}/staff-type/${typeId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await res.text();
    // console.log(`PUT Response Status: ${res.status}`);
    
    // Check if response is JSON
    if (res.headers.get('content-type')?.includes('application/json')) {
      try {
        const data = JSON.parse(responseText);
        
        if (!res.ok) {
          return NextResponse.json(
            { 
              error: data.message || data.error || `Failed to update staff type (${res.status})`,
              details: data.errors
            },
            { status: res.status }
          );
        }
        
        return NextResponse.json(data);
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
      }
    }
    
    return NextResponse.json(
      { error: `Unexpected response: ${responseText.substring(0, 200)}` },
      { status: 500 }
    );
    
  } catch (err: any) {
    console.error("Error updating staff type:", err);
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
    const { companyId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract staff type ID from request body
    const body = await req.json();
    const typeId = body.id;

    if (!typeId) {
      return NextResponse.json(
        { error: "Staff type ID is required in request body for DELETE" },
        { status: 400 }
      );
    }

    // console.log(`DELETE Request URL: ${BASE_URL}/staff-type/${typeId}`);
    // console.log(`DELETE Request Body:`, { company_id: companyId });

    // DELETE endpoint: /api/staff-type/<type_id>
    const res = await fetch(`${BASE_URL}/staff-type/${typeId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ company_id: companyId }),
    });

    // console.log(`DELETE Response Status: ${res.status}`);

    // Handle response
    const responseText = await res.text();

    if (!res.ok) {
      try {
        const data = JSON.parse(responseText);
        return NextResponse.json(
          { error: data.message || `Failed to delete staff type: ${res.status}` },
          { status: res.status }
        );
      } catch {
        return NextResponse.json(
          { error: `Failed to delete staff type: ${res.status}` },
          { status: res.status }
        );
      }
    }

    return NextResponse.json(
      { message: "Staff type deleted successfully" },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error deleting staff type:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}