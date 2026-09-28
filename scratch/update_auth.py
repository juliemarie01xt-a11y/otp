with open('src/lib/auth.ts', 'r', encoding='utf-8') as f:
    code = f.read()

admin_func = """

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
"""

with open('src/lib/auth.ts', 'w', encoding='utf-8') as f:
    f.write(code + admin_func)
print('done')
