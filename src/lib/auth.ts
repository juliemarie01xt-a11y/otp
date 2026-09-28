import { supabaseAdmin } from './supabase-admin';

/**
 * Verifies the Supabase JWT token from the Authorization header
 * and returns the authenticated user's ID.
 * 
 * Returns null if the token is missing, invalid, or expired.
 */
export async function getAuthUserId(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
  } catch {
    return null;
  }
}


/**
 * Verifies if the request contains valid admin credentials in headers.
 */
export function verifyAdmin(request: Request): boolean {
  const email = request.headers.get('x-admin-email');
  const password = request.headers.get('x-admin-password');
  
  const envEmail = process.env.ADMIN_EMAIL;
  const envPassword = process.env.ADMIN_PASSWORD;

  if (!envEmail || !envPassword) return false;
  
  return email === envEmail && password === envPassword;
}
