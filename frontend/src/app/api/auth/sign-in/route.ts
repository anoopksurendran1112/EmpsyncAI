import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    
    const res = await fetch(`${process.env.API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      credentials: "include", 
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data?.message || "Login failed" }, { status: res.status });
    }

    // Example: set httpOnly cookie for production
    const response = NextResponse.json(data);
    const token = data.access_token|| data.token; // Adjust based on your API response
    response.cookies.set({
      name: "access_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
