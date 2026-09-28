import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const baseUrl = (process.env.API_URL || "https://empsyncai.kochi.digital/api").replace(/\/+$/, "");
    const loginUrl = baseUrl.endsWith("/login") ? baseUrl : `${baseUrl}/login`;

    let res: Response;
    try {
      res = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        credentials: "include", 
      });
    } catch (fetchErr: any) {
      const isConnRefused =
        fetchErr?.cause?.code === "ECONNREFUSED" ||
        fetchErr?.code === "ECONNREFUSED" ||
        fetchErr?.message?.includes("fetch failed");

      if (isConnRefused && !loginUrl.includes("empsyncai.kochi.digital")) {
        res = await fetch("https://empsyncai.kochi.digital/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          credentials: "include", 
        });
      } else {
        throw fetchErr;
      }
    }

    // Safely parse JSON — backend may return HTML (e.g. Django 500 error page)
    let data: any = null;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        data = await res.json();
      } catch {
        data = null;
      }
    }

    if (!res.ok) {
      const errorMsg = data?.message || data?.detail || data?.error || `Login failed (HTTP ${res.status})`;
      return NextResponse.json({ error: errorMsg }, { status: res.status });
    }

    // Example: set httpOnly cookie for production
    const response = NextResponse.json(data);
    const token = data?.access_token || data?.token || data?.access;
    if (token) {
      response.cookies.set({
        name: "access_token",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 1 day
      });
    }

    const refreshToken = data?.refresh_token || data?.refresh;
    if (refreshToken) {
      response.cookies.set({
        name: "refresh_token",
        value: refreshToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    return response;
  } catch (err: any) {
    console.error("Login error:", err);
    const isConnRefused =
      err?.cause?.code === "ECONNREFUSED" ||
      err?.code === "ECONNREFUSED" ||
      err?.message?.includes("fetch failed");
    const errorMsg = isConnRefused
      ? "Unable to connect to backend server. Please ensure the Django backend is running."
      : (err?.message || "Internal server error");
    return NextResponse.json({ error: errorMsg }, { status: isConnRefused ? 503 : 500 });
  }
}
// import { NextResponse } from "next/server";

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();

//     // Call your Django backend login API
//     const res = await fetch(`${process.env.API_URL}/login`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(body),
//       credentials: "include",
//     });

//     const data = await res.json();

//     if (!res.ok) {
//       return NextResponse.json(
//         { error: data?.message || "Login failed" },
//         { status: res.status }
//       );
//     }

//     // ✅ Extract tokens from your backend response
//     const accessToken = data.access_token || data.token; // Adjust to your API key
//     const refreshToken = data.refresh || data.refresh_token;

//     // Check if both tokens are returned
//     if (!accessToken || !refreshToken) {
//       return NextResponse.json(
//         { error: "Missing access or refresh token in response" },
//         { status: 400 }
//       );
//     }

//     // ✅ Create a response
//     const response = NextResponse.json({
//       success: true,
//       message: "Login successful",
//     });

//     // ✅ Set Access Token (short expiry — 1 hour)
//     response.cookies.set("access_token", accessToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//       path: "/",
//       maxAge: 60 * 60, // 1 hour
//     });

//     // ✅ Set Refresh Token (long expiry — 7 days)
//     response.cookies.set("refresh_token", refreshToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//       path: "/",
//       maxAge: 7 * 24 * 60 * 60, // 7 days
//     });

//     return response;
//   } catch (err) {
//     console.error("Login error:", err);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }
