/*import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const company_id = body.company_id || cookieStore.get("company_id")?.value;
    if (!company_id) {
      return NextResponse.json({ error: "Missing company_id" }, { status: 400 });
    }

    const page = body.page || 1; // ✅ support pagination
    const apiUrl = process.env.API_URL;
    const res = await fetch(`${apiUrl}/punch/${page}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Company-ID": company_id.toString(),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Punch API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}*/


import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const company_id = body.company_id || cookieStore.get("company_id")?.value;

    if (!company_id) {
      return NextResponse.json({ error: "Missing company_id" }, { status: 400 });
    }

    // ✅ Required by Django
    const biometric_id = body.biometric_id;
    const start_date = body.start_date;
    const end_date = body.end_date;

    if (!biometric_id || !start_date || !end_date) {
      return NextResponse.json(
        { error: "Missing required fields (biometric_id, start_date, end_date)" },
        { status: 400 }
      );
    }

    const page = body.page || 1;
    const apiUrl = process.env.API_URL;

    const res = await fetch(`${apiUrl}/punch/${page}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        biometric_id,
        company_id,
        start_date,
        end_date,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Django API error ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Punch API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
