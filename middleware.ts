import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Add the paths that should be accessible only to logged-in users
const protectedPaths = ["/dashboard", "/profile"];

// Add the paths that should be accessible only to logged-out users
const authPaths = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;
  const path = request.nextUrl.pathname;

  // If the user is logged in and tries to access auth pages (login/register)
  if (isAuthenticated && authPaths.includes(path)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If the user is not logged in and tries to access protected pages
  if (!isAuthenticated && protectedPaths.includes(path)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [...protectedPaths, ...authPaths],
};
