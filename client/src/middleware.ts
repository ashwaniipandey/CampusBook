import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware
 *
 * NOTE: Authentication is handled client-side via ProtectedRoute and AdminShell
 * using httpOnly cookies sent to the backend API (credentials: 'include').
 * In a decoupled deployment (Vercel frontend + Render backend), cross-origin cookies
 * are not available to Vercel's edge middleware in document requests.
 */
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
