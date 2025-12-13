/*import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // If the user has a token and is trying to access the sign-in page, redirect to the dashboard.
  if (accessToken && pathname.startsWith('/auth/sign-in')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If the user does not have a token and is trying to access the dashboard, redirect to the sign-in page.
  if (!accessToken && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/sign-in'],
};*/
// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// // ✅ Small helper to decode JWT without external libs
// function decodeJwt(token: string): any | null {
//   try {
//     const base64 = token.split(".")[1];
//     if (!base64) return null;

//     const payload = Buffer.from(base64, "base64").toString("utf8");
//     return JSON.parse(payload);
//   } catch {
//     return null;
//   }
// }

// export function middleware(request: NextRequest) {
//   const token = request.cookies.get("access_token")?.value;
//   const { pathname } = request.nextUrl;

//   if (token) {
//     const decoded = decodeJwt(token);

//     // If decoding failed → invalid token
//     if (!decoded) {
//       const url = request.nextUrl.clone();
//       url.pathname = "/auth/sign-in";
//       const response = NextResponse.redirect(url);
//       response.cookies.delete("access_token");
//       return response;
//     }

//     // Check expiry (exp is in seconds)
//     if (decoded.exp && Date.now() >= decoded.exp * 1000) {
//       const url = request.nextUrl.clone();
//       url.pathname = "/auth/sign-in";
//       const response = NextResponse.redirect(url);
//       response.cookies.delete("access_token");
//       return response;
//     }

//     // If logged in and tries to access sign-in → go dashboard
//     if (pathname.startsWith("/auth/sign-in")) {
//       return NextResponse.redirect(new URL("/dashboard", request.url));
//     }
//   } else {
//     // No token and trying to access dashboard → sign in
//     if (pathname.startsWith("/dashboard")) {
//       return NextResponse.redirect(new URL("/auth/sign-in", request.url));
//     }
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/dashboard/:path*", "/auth/sign-in"],
// };

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ✅ Helper to decode JWT without external libraries
function decodeJwt(token: string): any | null {
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    const payload = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

// ✅ Function to refresh the access token using refresh token
async function refreshAccessToken(refreshToken: string) {
  try {
    const res = await fetch(`${process.env.API_URL}/api/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.access; // DRF SimpleJWT returns {"access": "..."}
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const { pathname } = request.nextUrl;

  if (accessToken) {
    const decoded = decodeJwt(accessToken);

    // Token invalid or expired
    if (!decoded || (decoded.exp && Date.now() >= decoded.exp * 1000)) {
      if (refreshToken) {
        const newAccessToken = await refreshAccessToken(refreshToken);

        if (newAccessToken) {
          // ✅ Successfully refreshed
          const response = NextResponse.next();
          response.cookies.set("access_token", newAccessToken, {
            httpOnly: true,
            path: "/",
          });
          return response;
        }
      }

      // ❌ Refresh failed — redirect to sign-in
      const url = request.nextUrl.clone();
      url.pathname = "/auth/sign-in";
      const response = NextResponse.redirect(url);
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      return response;
    }

    // Already logged in but tries to go to /auth/sign-in
    if (pathname.startsWith("/auth/sign-in")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } else {
    // No token at all — only allow auth routes
    if (pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/auth/sign-in", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/sign-in"],
};

