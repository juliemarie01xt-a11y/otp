import { type EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  if (token_hash && type) {
    // We must use the SSR server client so the user's browser actually receives the session cookies!
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              // Ignore
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!error) {
      // If it's a password recovery, redirect directly to the reset-password page or custom 'next' url!
      if (type === 'recovery' || next === '/reset-password') {
         return NextResponse.redirect(new URL('/reset-password', request.url))
      }
      
      // Otherwise (like normal signup), redirect to the beautiful success page
      return NextResponse.redirect(new URL('/auth/success', request.url))
    }
    
    console.error("OTP Verification Error:", error)
  }

  // return the user to an error page with some instructions
  return NextResponse.redirect(new URL('/login?error=Invalid+or+expired+verification+link', request.url))
}
