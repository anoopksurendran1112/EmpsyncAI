/*// app/api/auth/user-companies/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
export async function GET() {
  try {

    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Call the external API with Bearer token
    /*const res = await fetch(`${process.env.API_URL}/user-companies`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
        const res = await fetch(`${process.env.API_URL}/user-companies`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    console.log("👉 Fetching:", `${process.env.API_URL}/user-companies`);


    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Error proxying /user-companies:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch user companies" },
      { status: 500 }
    );
  }
}*/

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const apiUrl = `${process.env.API_URL}/user-companies`;
    console.log("👉 Fetching:", apiUrl);

    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const responseData = await res.json();

    if (!res.ok) {
      console.error("Error fetching user companies:", responseData);
      return NextResponse.json(responseData, { status: res.status });
    }

    // Normalize the response to always return an array of companies
    const companiesArray = Array.isArray(responseData?.data)
      ? responseData.data
      : Array.isArray(responseData?.companies)
      ? responseData.companies
      : [];

    // ✅ FIXED: Include company_img and mode in the normalized data
    const normalizedCompanies = companiesArray.map((c: any) => ({
      id: c.id?.toString() || c.company_id?.toString(),
      name: c.name || c.company_name || "Unnamed Company",
      logo: c.company_img || c.logo || null,
      // mode: c.mode || "single", // ✅ Add company mode (single/multi) - defaults to "single"
    }));

    console.log("✅ Normalized companies with logos and modes:", normalizedCompanies);

    return NextResponse.json({ success: true, data: normalizedCompanies }, { status: 200 });

  } catch (err) {
    console.error("Error proxying /user-companies:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch user companies" },
      { status: 500 }
    );
  }
}