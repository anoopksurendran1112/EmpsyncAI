import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const contentType = req.headers.get("content-type") || "";

    const apiUrl = process.env.API_URL;
    const fetchUrl = `${apiUrl}/employee-with-profile/`;

    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    // 🔥 FIX 1: Explicitly tell Django to send error details in JSON format
    headers["Accept"] = "application/json";

    if (contentType.includes("multipart/form-data")) {
      const incomingForm = await req.formData();
      const djangoForm = new FormData();

      for (const [key, value] of incomingForm.entries()) {
        if (value instanceof File) {
          djangoForm.append(key, value);
        } else if (value !== undefined && value !== null) {
          djangoForm.append(key, String(value));
        }
      }

      const res = await fetch(fetchUrl, {
        method: "POST",
        headers,
        body: djangoForm,
      });

      // 🔥 FIX 2: Safe-guard against HTML error pages
      const responseContentType = res.headers.get("content-type") || "";
      if (!responseContentType.includes("application/json")) {
        const errorHtml = await res.text();
        console.error("--- DJANGO HARD CRASH HTML START ---");
        console.error(errorHtml); // This will print the raw Django traceback right in your Next.js terminal!
        console.error("--- DJANGO HARD CRASH HTML END ---");
        return NextResponse.json(
          { success: false, error: `Backend returned HTML status ${res.status}. Check your Django console.` },
          { status: res.status }
        );
      }

      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    const body = await req.json();
    headers["Content-Type"] = "application/json";

    const res = await fetch(fetchUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    // Safe-guard for JSON body branch
    const responseContentType = res.headers.get("content-type") || "";
    if (!responseContentType.includes("application/json")) {
      const errorHtml = await res.text();
      return NextResponse.json(
        { success: false, error: `Backend returned HTML status ${res.status}.` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("employee-with-profile proxy error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}