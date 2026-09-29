import { type EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  if (token_hash && type) {
    const { error } = await supabaseAdmin.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!error) {
      // redirect user to specified redirect URL or root of app
      return NextResponse.redirect(new URL(`/${next.replace(/^\//, '')}`, request.url))
    }
    
    console.error("OTP Verification Error:", error)
  }

  // return the user to an error page with some instructions
  return NextResponse.redirect(new URL('/login?error=Invalid+or+expired+verification+link', request.url))
}
