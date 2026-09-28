with open('src/app/api/vsim/allocate/route.ts', 'r', encoding='utf-8') as f:
    code = f.read()

old_req = "const { country, service, maxPrice, tier = 'premium' } = await request.json();"
new_req = "const { country, service, maxPrice, rule_id } = await request.json();"
code = code.replace(old_req, new_req)

old_db = """    // 1. Get ALL rules for this tier (Fallback Engine)
    const { data: rules, error: rulesError } = await supabaseAdmin
      .from('routing_rules')
      .select('*')
      .eq('country_id', country)
      .eq('internal_service', service)
      .eq('tier', tier);

    if (rulesError || !rules || rules.length === 0) {
      return NextResponse.json({ error: 'No active route configured for this service tier.' }, { status: 404 });
    }"""

new_db = """    if (!rule_id) {
      return NextResponse.json({ error: 'Missing rule_id' }, { status: 400 });
    }

    // 1. Get the specific rule selected by the user
    const { data: rule, error: rulesError } = await supabaseAdmin
      .from('routing_rules')
      .select('*')
      .eq('id', rule_id)
      .single();

    if (rulesError || !rule) {
      return NextResponse.json({ error: 'This route is no longer available. Please refresh prices.' }, { status: 404 });
    }
    
    // We put it in an array to keep the rest of the code structure the same, but it only iterates once.
    const rules = [rule];"""

code = code.replace(old_db, new_db)

old_error = "return NextResponse.json({ success: false, error: lastError }, { status: 400 });"
new_error = "return NextResponse.json({ success: false, error: 'This route is currently out of stock or having issues. Please try selecting one of our other available routes above!' }, { status: 400 });"
code = code.replace(old_error, new_error)


with open('src/app/api/vsim/allocate/route.ts', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
