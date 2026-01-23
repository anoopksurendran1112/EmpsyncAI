import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } =await  params;

  // 🔐 grab token from cookies
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(
      `https://empsyncai.kochi.digital/api/group/${id}`, // hit backend
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // use cookie token
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch groups");
    }

    const data = await res.json();
    console.log("data", data.data);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("🚀 PUT handler triggered");

  try {
    const { id } = await params;
    
    if (!id) {
      console.warn("⚠️ Missing company ID in URL");
      return NextResponse.json(
        { success: false, message: "Company ID is required in URL" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      console.warn("⚠️ Unauthorized: No token found");
      return NextResponse.json(
        { success: false, message: "Unauthorized: No access token found" },
        { status: 401 }
      );
    }

    // Parse request body
    let body: any;
    try {
      body = await req.json();
      console.log("👉 PUT Request body parsed:", body);
    } catch (err) {
      console.warn("⚠️ Invalid JSON in request body:", err);
      return NextResponse.json(
        { success: false, message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate required fields
    const { new_group, short_name, groupId } = body;
    
    if (!groupId) {
      console.warn("⚠️ Missing group ID in request body");
      return NextResponse.json(
        { success: false, message: "Group ID is required" },
        { status: 400 }
      );
    }

    if (!new_group) {
      console.warn("⚠️ Missing new_group in request body");
      return NextResponse.json(
        { success: false, message: "new_group is required" },
        { status: 400 }
      );
    }

    // Prepare data for backend (matching Django backend expectations)
    const putData = {
      id: groupId,
      new_group: new_group,
      short_name: short_name || "" // Handle optional short_name
    };

    const requestUrl = `https://empsyncai.kochi.digital/api/group/${id}`;
    console.log("🌍 Sending PUT request to:", requestUrl);
    console.log("📦 PUT data:", putData);

    const res = await fetch(requestUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(putData),
    });

    console.log("📡 Backend response status:", res.status);

    let responseData: any;
    try {
      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        responseData = await res.json();
        console.log("✅ Parsed JSON response:", responseData);
      } else {
        const text = await res.text();
        console.log("⚠️ Non-JSON response received:", text.slice(0, 200));
        responseData = { message: text };
      }
    } catch (parseErr) {
      console.error("❌ Failed to parse response as JSON:", parseErr);
      responseData = { message: "Invalid response format" };
    }

    if (!res.ok) {
      console.error("❌ PUT request failed:", responseData);
      return NextResponse.json(
        { success: false, error: responseData },
        { status: res.status }
      );
    }

    console.log("✅ PUT request successful:", responseData);
    return NextResponse.json(responseData, { status: res.status });
  } catch (error) {
    console.error("💥 Uncaught Error in PUT handler:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}


export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("🚀 DELETE handler triggered");

  try {
    console.log("👉 Params received:", params);
    const { id } = await params;

    if (!id) {
      console.warn("⚠️ Missing group ID");
      return NextResponse.json(
        { success: false, message: "Group ID is required" },
        { status: 400 }
      );
    }

    console.log("✅ Group ID:", id);

    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    console.log("👉 Access token from cookies:", token ? "[FOUND]" : "[MISSING]");

    if (!token) {
      console.warn("⚠️ Unauthorized: No token found");
      return NextResponse.json(
        { success: false, message: "Unauthorized: No access token found" },
        { status: 401 }
      );
    }

    let body = {};
    try {
      body = await req.json();
      console.log("👉 Request body parsed:", body);
    } catch (err) {
      console.warn("⚠️ No body provided or invalid JSON:", err);
    }

    const requestUrl = `https://empsyncai.kochi.digital/api/group/${id}`;
    console.log("🌍 Sending DELETE request to:", requestUrl);

    const res = await fetch(requestUrl, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: Object.keys(body).length ? JSON.stringify(body) : undefined,
    });

    console.log("📡 Backend response status:", res.status);
    console.log("📡 Backend response headers:", Object.fromEntries(res.headers));

    let data: any;
    try {
      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        data = await res.json();
        console.log("✅ Parsed JSON response:", data);
      } else {
        const text = await res.text();
        console.log("⚠️ Non-JSON response received:", text.slice(0, 200)); // first 200 chars
        data = { message: text };
      }
    } catch (parseErr) {
      console.error("❌ Failed to parse response as JSON:", parseErr);
      data = { message: "Invalid response format" };
    }

    if (!res.ok) {
      console.error("❌ DELETE failed:", data);
      return NextResponse.json(
        { success: false, error: data },
        { status: res.status }
      );
    }

    console.log("✅ DELETE successful:", data);
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("💥 Uncaught Error in DELETE handler:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
