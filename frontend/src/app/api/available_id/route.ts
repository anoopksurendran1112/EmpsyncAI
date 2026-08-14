import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Pass along any query parameters (like company_id) to the backend
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();

    const apiUrl = process.env.API_URL || "http://127.0.0.1:8000/api";
    const cleanApiUrl = apiUrl.replace(/\/+$/, '');
    
    // Calls the backend endpoint /available_id/?...
    const fullUrl = `${cleanApiUrl}/available_id/${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { success: false, message: `Backend error: ${response.status}`, details: errorText }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Error fetching available_id:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
