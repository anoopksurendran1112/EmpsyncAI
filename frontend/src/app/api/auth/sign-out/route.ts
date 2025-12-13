import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore =await  cookies();
  const token = cookieStore.get("access_token")?.value;

  // Always try to clear the cookie on the client-side
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: "access_token",
    value: "",
    maxAge: 0,
    path: "/",
  });

  if (token) {
    try {
      const apiResponse = await fetch(`${process.env.API_URL}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!apiResponse.ok) {
        // The backend logout failed. We've still cleared the client-side
        // cookie, but we should log this and potentially return a different
        // response to the client.
        console.error("Backend logout failed:", apiResponse.status, apiResponse.statusText);
        // For now, we'll still return success as the client is logged out
        // from the perspective of this app. A more robust implementation
        // might want to handle this differently.
      }
    } catch (error) {
      console.error("External logout failed:", error);
      // The backend is likely unavailable.
      // We are still clearing the cookie, so the user is logged out
      // from the perspective of this app.
    }
  }

  return response;
}
