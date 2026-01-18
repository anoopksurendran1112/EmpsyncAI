// // src/app/api/leave/requests/route.ts
// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";

// export async function GET() {
//   try {
//     const cookieStore = await cookies();
//     const token = cookieStore.get("access_token")?.value;
//     const companyId = cookieStore.get("company_id")?.value;

//     if (!token) {
//       return NextResponse.json(
//         { success: false, message: "Unauthorized" },
//         { status: 401 }
//       );
//     }

//     // Call the external API with Bearer token
//     const res = await fetch(`${process.env.API_URL}/admin/leave-request/1`, {
//   method: "GET",
//   headers: {
//     Authorization: `Bearer ${token}`,
//     Accept: "application/json",
//     "X-Company-ID": companyId || "",   // ✅ dynamic companyId
//   },
// });
//     const data = await res.json();

//     if (!res.ok) {
//       return NextResponse.json(data, { status: res.status });
//     }

//     return NextResponse.json(data, { status: 200 });
//   } catch (err) {
//     console.error("Error proxying /admin/leave-request/1:", err);
//     return NextResponse.json(
//       { success: false, message: "Failed to fetch leave requests" },
//       { status: 500 }
//     );
//   }
// }

// src/app/api/leave/requests/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1"; // Get page from query params, default to 1
    const companyId = searchParams.get("company_id"); // Get company_id from query params
    
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const cookieCompanyId = cookieStore.get("company_id")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Use companyId from query params first, fall back to cookie
    const finalCompanyId = companyId || cookieCompanyId;
    
    if (!finalCompanyId) {
      return NextResponse.json(
        { success: false, message: "Company ID not found" },
        { status: 400 }
      );
    }

    // Log for debugging
    console.log(`📊 Fetching leave requests - Page: ${page}, Company ID: ${finalCompanyId}`);

    // Call the external API with the page parameter
    const apiUrl = `${process.env.API_URL}/admin/leave-request/${page}`;
    console.log(`API URL: ${apiUrl}`);
    
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
      console.error(`❌ External API error: ${res.status}`, data);
      return NextResponse.json(data, { status: res.status });
    }

    // Log the response structure for debugging
    console.log(`✅ Page ${page} response:`, {
      success: data.success,
      total: data.total,
      page: data.page,
      total_page: data.total_page,
      dataLength: data.data?.length || 0
    });

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("❌ Error proxying leave requests:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch leave requests" },
      { status: 500 }
    );
  }
}