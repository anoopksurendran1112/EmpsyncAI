/*import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(
  req: Request,
  context: { params: { page: string } }
) {
  try {
    // ✅ Await cookies before using
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const companyId = cookieStore.get("company_id")?.value || "7";

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // ✅ Await params
    const page = context.params?.page || "1";

    const apiUrl = `${process.env.API_URL}/get-biometric-device/${page}`;

    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Company-ID": companyId,
        Accept: "application/json",
      },
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { success: false, message: text || "Unexpected backend response" },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Error fetching devices:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch devices" },
      { status: 500 }
    );
  }
}*/
/*import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest, context: { params: { page: string } }) {
  try {
    const cookieStore = cookies(); // synchronous
    const token = cookieStore.get("access_token")?.value;
    const companyId = cookieStore.get("company_id")?.value || "7";

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const page = context.params.page || "1";
    const apiUrl = `${process.env.API_URL}/get-biometric-device/${page}`;

    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Company-ID": companyId,
        Accept: "application/json",
      },
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { success: false, message: text || "Unexpected backend response" },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Error fetching devices:", err);
    return NextResponse.json({ success: false, message: "Failed to fetch devices" }, { status: 500 });
  }
}*/
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ page: string }> } // ✅ Must be a Promise for Turbopack
) {
  try {
    // Get cookies
    const cookieStore = cookies();
    const token = cookieStore.get("access_token")?.value;
    const companyId = cookieStore.get("company_id")?.value || "7";

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Await the Promise to get page param
    const { page } = await context.params;

    // Fallback to page 1 if not provided
    const pageNumber = page || "1";
    const apiUrl = `${process.env.API_URL}/get-biometric-device/${pageNumber}`;

    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Company-ID": companyId,
        Accept: "application/json",
      },
    });

    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { success: false, message: text || "Unexpected backend response" },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Error fetching biometric devices:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch devices" },
      { status: 500 }
    );
  }
}

