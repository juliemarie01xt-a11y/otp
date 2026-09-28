import re

with open('src/app/api/deposit/route.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# Build success and fail URLs
new_urls = """    const callbackUrl = `${protocol}://${host}/api/webhooks/plisio?json=true`;
    const successUrl = `${protocol}://${host}/dashboard/success`;
    const failUrl = `${protocol}://${host}/dashboard/failed`;"""

code = code.replace("    const callbackUrl = `${protocol}://${host}/api/webhooks/plisio?json=true`;", new_urls)

# Add to params
new_params = """        order_name: `Wallet Top-Up`,
        order_number: deposit.id,
        callback_url: callbackUrl,
        success_invoice_url: successUrl,
        fail_invoice_url: failUrl,
        api_key: PLISIO_SECRET_KEY"""

code = code.replace("""        order_name: `Wallet Top-Up`,
        order_number: deposit.id,
        callback_url: callbackUrl,
        api_key: PLISIO_SECRET_KEY""", new_params)

with open('src/app/api/deposit/route.ts', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
