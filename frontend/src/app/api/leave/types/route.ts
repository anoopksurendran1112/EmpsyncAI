/*// app/api/leave/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// ✅ GET /api/leave
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const res = await fetch(`${process.env.API_URL}/leave-types`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "X-Company-ID": "7", // matches Thunder Client
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Error proxying GET /leave-types:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch leave types" },
      { status: 500 }
    );
  }
}

// ✅ POST /api/leave
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const res = await fetch(`${process.env.API_URL}/leave-types`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Company-ID": "7",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Error proxying POST /leave-types:", err);
    return NextResponse.json(
      { success: false, message: "Failed to create leave type" },
      { status: 500 }
    );
  }
}

// ✅ PUT /api/leave
export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const res = await fetch(`${process.env.API_URL}/leave-types`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Company-ID": "7",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Error proxying PUT /leave-types:", err);
    return NextResponse.json(
      { success: false, message: "Failed to update leave type" },
      { status: 500 }
    );
  }
}

// ✅ DELETE /api/leave
export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const res = await fetch(`${process.env.API_URL}/leave-types`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Company-ID": "7",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Error proxying DELETE /leave-types:", err);
    return NextResponse.json(
      { success: false, message: "Failed to delete leave type" },
      { status: 500 }
    );
  }
}*/
// app/api/leave/types/route.ts  
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET /api/leave/types
export async function GET() {
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

    const res = await fetch(`${process.env.API_URL}/leave-types`, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "X-Company-ID": companyId || "",   // ✅ dynamic companyId
  },
});

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(errorData, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Error fetching leave types:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch leave types" },
      { status: 500 }
    );
  }
}

// POST /api/leave/types
// POST /api/leave/types
export async function POST(req: Request) {
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

    // ✅ Ensure required fields are passed
    const leaveTypePayload = {
      leave_type: body.leave_type,
      short_name: body.short_name,
      monthly_limit: body.monthly_limit || 0,
      yearly_limit: body.yearly_limit || 0,
      initial_credit: body.initial_credit || 0,
      use_credit: body.use_credit || false,
    };

    const res = await fetch(`${process.env.API_URL}/leave-types`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Company-ID": companyId || "",
      },
      body: JSON.stringify(leaveTypePayload),
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(errorData, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Error creating leave type:", err);
    return NextResponse.json(
      { success: false, message: "Failed to create leave type" },
      { status: 500 }
    );
  }
}

// PUT /api/leave/types
export async function PUT(req: Request) {
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

    const res = await fetch(`${process.env.API_URL}/leave-types`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Company-ID": companyId || "",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(errorData, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Error updating leave type:", err);
    return NextResponse.json(
      { success: false, message: "Failed to update leave type" },
      { status: 500 }
    );
  }
}

// DELETE /api/leave/types
export async function DELETE(req: Request) {
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

    const res = await fetch(`${process.env.API_URL}/leave-types`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Company-ID": companyId || "",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(errorData, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Error deleting leave type:", err);
    return NextResponse.json(
      { success: false, message: "Failed to delete leave type" },
      { status: 500 }
    );
  }
}
