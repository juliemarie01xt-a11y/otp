with open('src/app/api/vsim/allocate/route.ts', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    "error: `Your wallet balance is insufficient for this transaction (Required: $${maxPrice}, Available: $${userBalance}). Please add funds to your wallet.`",
    "error: `Your wallet balance is insufficient for this transaction (Required: $${Number(maxPrice).toFixed(3)}, Available: $${userBalance.toFixed(2)}). Please add funds to your wallet.`"
)

with open('src/app/api/vsim/allocate/route.ts', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
