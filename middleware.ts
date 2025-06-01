import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  // Check paths
  const { pathname, search } = request.nextUrl
  const fullUrl = `${pathname}${search}`
  const isLoginPage = pathname === '/login'
  const isSettingsPage = pathname.startsWith('/settings')

  // Get the token to check if user is authenticated
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || "fallback-dev-secret-do-not-use-in-production"
  })

  // A user is authenticated if token exists AND contains user data
  const isAuthenticated = !!token && !!token.userId

  // Only log in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log(`Middleware: Path=${fullUrl}, Token=${!!token}, UserId=${token?.userId}, IsAuthenticated=${isAuthenticated}, LoginPage=${isLoginPage}, SettingsPage=${isSettingsPage}`)
  }

  // If on login page and authenticated, redirect to settings
  if (isLoginPage && isAuthenticated) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Middleware: Redirecting authenticated user from login to settings')
    }
    const redirectUrl = new URL('/settings', request.url)
    // Add cache busting parameter to avoid browser caching
    redirectUrl.searchParams.set('t', Date.now().toString())
    return NextResponse.redirect(redirectUrl)
  }

  // If on settings page and not authenticated, redirect to login
  if (isSettingsPage && !isAuthenticated) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Middleware: Redirecting unauthenticated user from settings to login')
    }
    const redirectUrl = new URL('/login', request.url)
    // Add cache busting parameter to avoid browser caching
    redirectUrl.searchParams.set('t', Date.now().toString())
    return NextResponse.redirect(redirectUrl)
  }

  // Otherwise, proceed normally
  return NextResponse.next()
}

// Run middleware on these paths
export const config = {
  matcher: [
    '/login',
    '/settings/:path*'
  ],
}
