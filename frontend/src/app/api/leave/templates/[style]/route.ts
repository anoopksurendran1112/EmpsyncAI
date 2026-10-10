// app/api/leave/templates/[style]/route.ts
// Proxy: GET -> Django /api/leave-template/<style>
// Generates the company-tailored xlsx template (leave-type dropdowns match the
// company's actual leave types). style ∈ { "dates", "balance" }.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const FILENAMES: Record<string, string> = {
  dates: "bulk_past_leaves_template.xlsx",
  balance: "bulk_balance_template.xlsx",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ style: string }> }
) {
  try {
    const { style } = await params;
    if (style !== "dates" && style !== "balance") {
      return NextResponse.json(
        { success: false, message: "Unknown template type." },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const companyId = cookieStore.get("company_id")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const res = await fetch(`${process.env.API_URL}/leave-template/${style}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Company-ID": companyId || "",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      let message = "Failed to download template.";
      try {
        const body = JSON.parse(text);
        if (body?.message) message = body.message;
      } catch {
        // keep the default message
      }
      return NextResponse.json({ success: false, message }, { status: res.status });
    }

    const buffer = await res.arrayBuffer();
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${FILENAMES[style]}"`,
      },
    });
  } catch (err) {
    console.error("Template download error", err);
    return NextResponse.json(
      { success: false, message: "Failed to download template." },
      { status: 500 }
    );
  }
}