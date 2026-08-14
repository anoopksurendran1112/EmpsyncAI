import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { uuid: string } }
) {
  try {
    const { uuid } = params;
    
    const apiUrl = process.env.API_URL || "http://127.0.0.1:8000/api";
    const cleanApiUrl = apiUrl.replace(/\/+$/, '');
    
    // Calls the backend endpoint /companies/<uuid>/
    const fullUrl = `${cleanApiUrl}/companies/${uuid}/`;
    
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
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
    
    // If the backend doesn't already wrap in success, just return the data directly
    // since the frontend expects `data.id`, `data.company_name` directly.
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Error fetching company by uuid:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
