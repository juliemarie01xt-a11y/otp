import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Only initialize if the user has configured the Upstash keys
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Create a new ratelimiter that allows 30 requests per 10 seconds per IP
const ratelimit = redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(30, '10 s'),
      analytics: true,
    })
  : null;

export async function middleware(request: NextRequest) {
  // Extract the true IP address (works behind Vercel, Cloudflare, etc)
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1';

  // We only want to rate limit the backend API routes (this protects both the Web and the Telegram Bot)
  if (request.nextUrl.pathname.startsWith('/api/') && ratelimit) {
    try {
      const { success, limit, reset, remaining } = await ratelimit.limit(`ratelimit_${ip}`);
      
      if (!success) {
        return NextResponse.json(
          { error: 'Edge Defense: Too many requests. You have been temporarily blocked for spamming.' },
          { 
            status: 429, 
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString()
            }
          }
        );
      }
    } catch (e) {
      // If the Redis connection drops, fail open (let the request through) so real users aren't blocked
      console.error('Upstash Edge Limiter Error:', e);
    }
  }

  return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
  matcher: '/api/:path*',
};
