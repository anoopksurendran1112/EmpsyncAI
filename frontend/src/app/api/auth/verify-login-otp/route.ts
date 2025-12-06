/*import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    
    const api_url = `${process.env.API_URL}/verify-login-otp`;

    const res = await fetch(api_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    console.log("Received response from external API. Status:", res.status);
    console.log("External API response body:", JSON.stringify(data, null, 2));

    if (!res.ok) {
      console.error("External API returned an error.");
      return NextResponse.json({ error: data?.message || "Verification failed", details: data }, { status: res.status });
    }

    const response = NextResponse.json({ data, success: true });
    
    return response;
  } catch (err) {
    console.error("Error in /api/auth/verify-login-otp:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
*/
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    console.log("OTP verification request for mobile:", body.mobile);

    const api_url = `${process.env.API_URL}/verify-login-otp`;

    const res = await fetch(api_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mobile: body.mobile,
        otp: body.otp,
        fcm_token: body.fcm_token || "default_fcm_token"
      }),
    });

    const data = await res.json();

    console.log("Django API response status:", res.status);

    if (!res.ok) {
      console.error("OTP verification failed:", data);
      return NextResponse.json(
        { 
          error: data?.message || "OTP verification failed",
          success: false,
          status: res.status
        }, 
        { status: res.status }
      );
    }

    console.log("✅ OTP verification successful for user:", data.data?.user?.first_name);

    // Set HTTP-only cookies
    const response = NextResponse.json(data);
    
    if (data.access_token) {
      response.cookies.set({
        name: "access_token",
        value: data.access_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 1 day
      });
    }

    if (data.refresh_token) {
      response.cookies.set({
        name: "refresh_token", 
        value: data.refresh_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    return response;
    
  } catch (err) {
    console.error("Error in OTP verification:", err);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}