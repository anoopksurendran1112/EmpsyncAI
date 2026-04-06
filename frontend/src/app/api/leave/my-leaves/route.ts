import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("company_id");
    
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const cookieCompanyId = cookieStore.get("company_id")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const finalCompanyId = companyId || cookieCompanyId;
    
    if (!finalCompanyId) {
      return NextResponse.json(
        { success: false, message: "Company ID not found" },
        { status: 400 }
      );
    }

    const apiUrl = `${process.env.API_URL}/my-leaves?company_id=${finalCompanyId}`;
    
    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "X-Company-ID": finalCompanyId,
      },
    });
    
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("❌ Error proxying my-leaves:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch my leave requests" },
      { status: 500 }
    );
  }
}
