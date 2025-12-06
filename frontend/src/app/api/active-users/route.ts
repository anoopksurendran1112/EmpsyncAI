// app/api/active_users/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { company_id, page = 1, limit = 50, date } = body;

    if (!company_id) {
      return NextResponse.json({ error: "Missing company_id" }, { status: 400 });
    }

    const apiUrl = process.env.API_URL;
    const cacheKey = `active-users-${company_id}-${page}-${limit}-${date}`;

    // ✅ Return cached data if valid
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log("✅ Using cached active users");
      return NextResponse.json(cached.data);
    }

    console.log("📡 Fetching active users from backend...");

    const url = `${apiUrl}/api/admin/active-users/${page}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        company_id, 
        limit,
        date: date || new Date().toISOString().split('T')[0]
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`❌ Failed to fetch active users: ${res.status}`);
      return NextResponse.json(
        { error: `Failed to fetch active users (${res.status})` },
        { status: res.status }
      );
    }

    const data = await res.json();

    // 🧠 Cache result for future requests
    cache.set(cacheKey, { data, timestamp: Date.now() });

    console.log(`✅ Fetched ${data?.data?.length || 0} active users`);
    return NextResponse.json(data);

  } catch (err) {
    console.error("❌ Active Users API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}