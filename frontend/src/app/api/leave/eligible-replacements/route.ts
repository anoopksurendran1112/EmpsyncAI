import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const cookieStore = await cookies();

        const token = cookieStore.get("access_token")?.value;
        const companyId = cookieStore.get("company_id")?.value;

        if (!token || !companyId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const res = await fetch(
            `${process.env.API_URL}/eligible-replacements?company_id=${companyId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "X-Company-ID": companyId,
                    Accept: "application/json",
                },
            }
        );

        const data = await res.json();

        return NextResponse.json(data, { status: res.status });

    } catch (err) {
        console.error(err);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to load replacement employees",
            },
            { status: 500 }
        );
    }
}