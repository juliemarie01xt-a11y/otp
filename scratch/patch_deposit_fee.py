with open('src/app/api/deposit/route.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# We need to change the amount sent to Plisio to amount * 1.005
old_params = """        source_currency: 'USD',
        source_amount: amount,
        order_name: `Wallet Top-Up`,"""

new_params = """        source_currency: 'USD',
        source_amount: (amount * 1.005).toFixed(4), // Add our 0.5% profit cut upfront
        order_name: `Wallet Top-Up`,"""

code = code.replace(old_params, new_params)

with open('src/app/api/deposit/route.ts', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
