with open('src/app/api/webhooks/plisio/route.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# Update the webhook to deduct the 0.5% profit cut
old_logic = """    // 6. Credit the user's wallet ATOMICALLY using SQL RPC
    //    This prevents lost deposits when two webhooks fire simultaneously.
    const addedAmount = Number(amountPaidStr);
    if (addedAmount > 0) {"""

new_logic = """    // 6. Credit the user's wallet ATOMICALLY using SQL RPC
    //    We deduct the 0.5% profit cut we added upfront (divide by 1.005)
    let addedAmount = Number(amountPaidStr) / 1.005;
    
    // Round to 4 decimal places to prevent infinite fraction floating point errors
    addedAmount = Number(addedAmount.toFixed(4));
    
    if (addedAmount > 0) {"""

code = code.replace(old_logic, new_logic)

with open('src/app/api/webhooks/plisio/route.ts', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
