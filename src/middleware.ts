import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// A simple in-memory rate limiter for demo purposes.
// For a production app, use Redis (e.g., @upstash/redis).
const rateLimit = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20; // Max requests per minute per IP for sensitive routes

export function middleware(request: NextRequest) {
  // 1. Pass path to headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  // 2. Simple Rate Limiting for auth and order routes
  const path = request.nextUrl.pathname;
  if (path.startsWith('/api/auth') || path.startsWith('/api/register') || path.startsWith('/api/orders')) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();
    
    const record = rateLimit.get(ip);
    
    if (record) {
      if (now - record.timestamp < RATE_LIMIT_WINDOW) {
        if (record.count > MAX_REQUESTS) {
          return new NextResponse('Too Many Requests', { status: 429 });
        }
        record.count += 1;
      } else {
        rateLimit.set(ip, { count: 1, timestamp: now });
      }
    } else {
      rateLimit.set(ip, { count: 1, timestamp: now });
    }
  }

  // 3. Optional: Add a simple check for missing CSRF tokens on non-GET API requests
  // This is a basic example; a full CSRF implementation requires token generation and validation.
  /*
  if (path.startsWith('/api') && request.method !== 'GET') {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    // If there's an origin, verify it matches our host (basic CSRF protection)
    if (origin && origin !== `https://${host}` && origin !== `http://${host}`) {
       // return new NextResponse('Invalid Origin', { status: 403 });
    }
  }
  */

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
