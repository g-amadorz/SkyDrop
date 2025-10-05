import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const method = request.method;
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Log the incoming request
  console.log(`
    [${new Date().toISOString()}] ${method} ${pathname}
    IP: ${ip}
    User-Agent: ${userAgent}
    Query Params: ${searchParams.toString() || 'none'}
  `);

  // Measure response time
  const start = Date.now();
  const response = NextResponse.next();
  const duration = Date.now() - start;

  // Log the response
  console.log(`
    [${new Date().toISOString()}] ${method} ${pathname} - ${response.status}
    Duration: ${duration}ms
  `);

  return response;
}

// Configure which paths should be processed by this middleware
export const config = {
  matcher: ['/:path*'], // Run on all routes
};