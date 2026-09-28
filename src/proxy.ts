import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Protect Admin Routes with Basic Auth
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/api/admin');
  
  if (isAdminRoute) {
    const authHeader = request.headers.get('authorization');
    const expectedPassword = process.env.ADMIN_PASSWORD;
    const expectedEmail = process.env.ADMIN_EMAIL;
    
    if (!expectedPassword || !expectedEmail) {
      return new NextResponse('Admin credentials not configured in environment', { status: 403 });
    }

    if (authHeader) {
      const authValue = authHeader.split(' ')[1];
      const decoded = atob(authValue);
      const [username, ...passParts] = decoded.split(':');
      const password = passParts.join(':');
      
      if (username === expectedEmail && password === expectedPassword) {
        // Proceed normally for authorized admin
      } else {
        return new NextResponse('Auth required', {
          status: 401,
          headers: { 'WWW-Authenticate': 'Basic realm="Admin Access"' }
        });
      }
    } else {
      return new NextResponse('Auth required', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Admin Access"' }
      });
    }
  }

  const { data: { user } } = await supabase.auth.getUser()

  // Protect /dashboard and /deposit routes
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/deposit')
  
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Prevent logged-in users from seeing login/signup pages
  const isAuthRoute = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup'
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
