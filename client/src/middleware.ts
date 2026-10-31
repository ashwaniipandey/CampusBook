import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths requiring authentication
const protectedPaths = ['/dashboard', '/admin', '/profile', '/sell', '/my-books'];

// Paths only for unauthenticated guests
const authOnlyPaths = ['/login', '/signup', '/forgot-password', '/reset-password'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  const isAuthOnly = authOnlyPaths.some((path) => pathname.startsWith(path));

  // If trying to access a protected route without a token cookie, redirect to /login
  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated and trying to visit login/signup, redirect to /dashboard
  if (isAuthOnly && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/sell/:path*',
    '/my-books/:path*',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
  ],
};
