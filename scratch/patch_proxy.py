with open('src/proxy.ts', 'r', encoding='utf-8') as f:
    code = f.read()

old_auth = """  if (isAdminRoute) {
    const authHeader = request.headers.get('authorization');
    const expectedPassword = process.env.ADMIN_PASSWORD;
    
    if (!expectedPassword) {
      return new NextResponse('Admin password not configured in environment', { status: 403 });
    }

    if (authHeader) {
      const authValue = authHeader.split(' ')[1];
      const decoded = atob(authValue);
      const [username, ...passParts] = decoded.split(':');
      const password = passParts.join(':');
      
      if (password === expectedPassword) {"""

new_auth = """  if (isAdminRoute) {
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
      
      if (username === expectedEmail && password === expectedPassword) {"""

code = code.replace(old_auth, new_auth)

with open('src/proxy.ts', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
