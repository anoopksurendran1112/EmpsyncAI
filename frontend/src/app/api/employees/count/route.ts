// app/api/employees/count/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const company_id = body.company_id || cookieStore.get("company_id")?.value;

    if (!company_id) {
      return NextResponse.json({ error: "Missing company_id" }, { status: 400 });
    }

    const apiUrl = process.env.API_URL;
    const fetchUrl = `${apiUrl}/admin/users/1`;
    
    const res = await fetch(fetchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ company_id, limit: 1 }),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch employee count: ${res.status}` },
        { status: res.status }
      );
    }

    const responseData = await res.json();
    
    // FIX: Use responseData.total instead of responseData.total_count
    const totalEmployees = responseData.total; // This is the key fix!
    
    console.log("🔢 Count API - total field:", responseData.total); // Should log 13
    console.log("🔢 Count API - Final count:", totalEmployees); // Should log 13

    return NextResponse.json({
      totalEmployees: totalEmployees, // This will be 13
      company_id: company_id
    });
  } catch (err) {
    console.error("Employee count API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

