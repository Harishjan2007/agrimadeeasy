import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * AgriME Server-Side Route Protection Middleware
 * -----------------------------------------------
 * Enforces authentication on the six core protected modules:
 * 1. Crop Price (/crop-price)
 * 2. Prediction (/prediction)
 * 3. Dealers (/dealers, /dealer)
 * 4. Machinery Booking (/machinery, /bookings, /machinery-provider)
 * 5. E-commerce (/ecommerce)
 * 6. Schemes (/schemes)
 * Plus user profile (/profile).
 *
 * Public routes (Home '/', '/login', '/signup', '/api/*', static assets) remain accessible to all.
 */

const PROTECTED_PREFIXES = [
  '/crop-price',
  '/prediction',
  '/dealers',
  '/dealer',
  '/machinery',
  '/bookings',
  '/machinery-provider',
  '/ecommerce',
  '/schemes',
  '/profile'
];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Check if current path matches any of the protected prefixes
  const isProtected = PROTECTED_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for authentication tokens / session indicators in cookies
  const cookies = request.cookies;
  const hasAgriMeAuth = cookies.has('agrime_auth') && cookies.get('agrime_auth')?.value === 'true';

  // Also check for any Supabase auth token cookies (e.g. sb-*-auth-token)
  let hasSupabaseToken = false;
  for (const cookie of cookies.getAll()) {
    if (cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')) {
      hasSupabaseToken = Boolean(cookie.value);
      break;
    }
  }

  const isAuthenticated = hasAgriMeAuth || hasSupabaseToken;

  if (!isAuthenticated) {
    const fullRequestedPath = pathname + (search || '');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', fullRequestedPath);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/crop-price/:path*',
    '/prediction/:path*',
    '/dealers/:path*',
    '/dealer/:path*',
    '/machinery/:path*',
    '/bookings/:path*',
    '/machinery-provider/:path*',
    '/ecommerce/:path*',
    '/schemes/:path*',
    '/profile/:path*'
  ]
};
