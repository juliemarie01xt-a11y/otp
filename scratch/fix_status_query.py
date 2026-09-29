import os

file_path = "src/app/api/bot/command/route.ts"
with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

old_query = "const { data: activations } = await supabaseAdmin.from('activations').select('cost').eq('user_id', profile.id);"
new_query = "const { data: activations } = await supabaseAdmin.from('activations').select('cost').eq('user_id', profile.id).eq('status', 'COMPLETED');"

if old_query in code:
    code = code.replace(old_query, new_query)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(code)
    print("Fixed status calculation successfully!")
else:
    print("Could not find the query.")
