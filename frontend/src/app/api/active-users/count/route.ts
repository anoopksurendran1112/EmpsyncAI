// app/api/active-users/count/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const company_id = body.company_id;

    if (!company_id) {
      return NextResponse.json({ error: "Missing company_id" }, { status: 400 });
    }

    const apiUrl = process.env.API_URL;
    
    if (!apiUrl) {
      return NextResponse.json({
        success: true,
        total: 0,
        male_count: 0,
        female_count: 0,
        others_count: 0,
        message: "API configuration missing",
        fallback: true
      });
    }

    // Try the endpoint pattern similar to your employees API
    const fetchUrl = `${apiUrl}/admin/active-users/1`;
    
    console.log(`🔍 Fetching active users from: ${fetchUrl}`);
    
    const res = await fetch(fetchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        company_id: parseInt(company_id),
        date: body.date || new Date().toISOString().split('T')[0],
        limit: 100 // Add limit if needed
      }),
    });

    if (res.ok) {
      const responseData = await res.json();
      console.log("✅ Active users count API success:", responseData);
      
      // Handle different response structures
      return NextResponse.json({
        success: true,
        total: responseData.total || responseData.data?.total || responseData.count || 0,
        male_count: responseData.male_count || responseData.data?.male_count || 0,
        female_count: responseData.female_count || responseData.data?.female_count || 0,
        others_count: responseData.others_count || responseData.data?.others_count || 0,
        message: "Active users count fetched successfully"
      });
    } else {
      console.log(`❌ Backend API failed with status: ${res.status}`);
      
      // Don't throw error, return fallback data instead
      return NextResponse.json({
        success: true,
        total: 0,
        male_count: 0,
        female_count: 0,
        others_count: 0,
        message: `Backend unavailable (${res.status}), using fallback`,
        fallback: true
      });
    }

  } catch (err) {
    console.error("Active users count API error:", err);
    
    return NextResponse.json({
      success: true,
      total: 0,
      male_count: 0,
      female_count: 0,
      others_count: 0,
      message: "Error occurred, using fallback",
      fallback: true
    });
  }
}