import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;
  const isAuthPage = request.nextUrl.pathname === "/login";
  const isHomePage = request.nextUrl.pathname === "/";

  // If the user is not authenticated and trying to access a protected route
  if (!isAuthenticated && !isAuthPage) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If the user is authenticated and trying to access auth pages
  if (isAuthenticated && isAuthPage) {
    const settingsUrl = new URL("/settings", request.url);
    return NextResponse.redirect(settingsUrl);
  }

  // Redirect root to settings if authenticated
  if (isAuthenticated && isHomePage) {
    const settingsUrl = new URL("/settings", request.url);
    return NextResponse.redirect(settingsUrl);
  }

  return NextResponse.next();
}

// Configure the paths that should be protected
export const config = {
  matcher: [
    // Protected routes that need authentication
    "/",
    "/orders/:path*",
    "/pnl/:path*",
    "/settings/:path*",
    // Auth routes that should redirect if already authenticated
    "/login",
  ],
};
