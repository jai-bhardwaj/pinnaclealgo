import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  // Check paths
  const { pathname, search } = request.nextUrl;
  const fullUrl = `${pathname}${search}`;
  const isLoginPage = pathname === "/login";
  const isProtectedPage = pathname.startsWith("/dashboard") || 
                          pathname.startsWith("/strategies") || 
                          pathname.startsWith("/orders") || 
                          pathname.startsWith("/portfolio") || 
                          pathname.startsWith("/pnl") || 
                          pathname.startsWith("/settings");

  // Get the token to check if user is authenticated
  const token = await getToken({
    req: request,
    secret:
      process.env.NEXTAUTH_SECRET ||
      "fallback-dev-secret-do-not-use-in-production",
  });

  // A user is authenticated if token exists AND contains user data
  const isAuthenticated = !!token && !!token.userId;

  // Only log in development mode
  if (process.env.NODE_ENV === "development") {
    console.log(
      `Middleware: Path=${fullUrl}, Token=${!!token}, UserId=${
        token?.userId
      }, IsAuthenticated=${isAuthenticated}, LoginPage=${isLoginPage}, ProtectedPage=${isProtectedPage}`
    );
  }

  // If on login page and authenticated, redirect to dashboard
  if (isLoginPage && isAuthenticated) {
    if (process.env.NODE_ENV === "development") {
      console.log(
        "Middleware: Redirecting authenticated user from login to dashboard"
      );
    }
    try {
      const redirectUrl = new URL("/dashboard", request.url);
      // Add cache busting parameter to avoid browser caching
      redirectUrl.searchParams.set("t", Date.now().toString());
      return NextResponse.redirect(redirectUrl);
    } catch (error) {
      // Fallback redirect if URL creation fails
      return NextResponse.redirect(new URL("/dashboard", "http://localhost"));
    }
  }

  // If on protected page and not authenticated, redirect to login
  if (isProtectedPage && !isAuthenticated) {
    if (process.env.NODE_ENV === "development") {
      console.log(
        "Middleware: Redirecting unauthenticated user from protected page to login"
      );
    }
    try {
      const redirectUrl = new URL("/login", request.url);
      // Add cache busting parameter to avoid browser caching
      redirectUrl.searchParams.set("t", Date.now().toString());
      return NextResponse.redirect(redirectUrl);
    } catch (error) {
      // Fallback redirect if URL creation fails
      return NextResponse.redirect(new URL("/login", "http://localhost"));
    }
  }

  // Otherwise, proceed normally
  return NextResponse.next();
}

// Run middleware on these paths
export const config = {
  matcher: [
    "/login", 
    "/dashboard/:path*", 
    "/strategies/:path*", 
    "/orders/:path*", 
    "/portfolio/:path*", 
    "/pnl/:path*", 
    "/settings/:path*"
  ],
};
