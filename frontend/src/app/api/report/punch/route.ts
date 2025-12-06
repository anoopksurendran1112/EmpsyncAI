// app/api/report/punch/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Helper: format to YYYY-MM-DD
function formatToIsoDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) throw new Error(`Invalid date: ${dateStr}`);
  return d.toISOString().split("T")[0];
}

async function callDjangoPunchAPI(payload: Record<string, any>, token: string) {
  const res = await fetch(`${process.env.API_URL}/punchreport`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    console.error("Invalid JSON from backend:", text);
    throw new Error("Invalid response from backend");
  }

  return { data, status: res.status };
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { from_date, to_date, user_id, company_id } = body; // 👈 Get company_id from request body

    if (!from_date || !to_date || !company_id) { // 👈 Validate company_id
      return NextResponse.json({ 
        success: false, 
        message: "Missing required fields: from_date, to_date, and company_id are required" 
      }, { status: 400 });
    }

    const payload: Record<string, any> = {
      company_id: company_id,  // 👈 Use company_id from request body, not cookie
      from_date: formatToIsoDate(from_date),
      to_date: formatToIsoDate(to_date),
    };

    if (user_id) payload.user_id = user_id;

    // ✅ Debug log to verify which company_id is being used
    console.log("Fetching punch report for company_id:", company_id);

    const { data, status } = await callDjangoPunchAPI(payload, token);
    
    // ✅ Debug log the response
    console.log("Backend response status:", status);
    
    return NextResponse.json(data, { status });
  } catch (err: any) {
    console.error("Error in /report/punch:", err);
    return NextResponse.json({ success: false, message: err.message || "Server Error" }, { status: 500 });
  }
}