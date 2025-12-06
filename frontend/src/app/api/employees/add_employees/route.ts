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

    // Validate required fields (basic check, adjust as needed)
    if (!body.first_name || !body.last_name || !body.email || !body.password) {
      return NextResponse.json(
        { error: "Missing required employee fields" },
        { status: 400 }
      );
    }

    const apiUrl = process.env.API_URL;
    const fetchUrl = `${apiUrl}/signup`;

    const res = await fetch(fetchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Company-ID": body.company_id?.toString() || "", // Optional
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Failed to add employee:", res.status, errorText);
      return NextResponse.json(
        { error: "Failed to add employee", details: errorText },
        { status: res.status }
      );
    }

    const responseData = await res.json();
    return NextResponse.json(responseData);
  } catch (err) {
    console.error("Add Employee API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
