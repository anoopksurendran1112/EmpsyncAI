import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    // get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No access token found" },
        { status: 401 }
      );
    }

    // forward body from client
    const body = await req.json();

    // send to external API
    const res = await fetch(
      "https://empsyncai.kochi.digital/api/admin/add-group",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // pass token to backend
        },
        body: JSON.stringify(body),
      }
    );

    // forward response from external API
    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Add Group Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
