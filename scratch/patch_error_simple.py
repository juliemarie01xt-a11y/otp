with open('src/app/api/vsim/allocate/route.ts', 'r', encoding='utf-8') as f:
    code = f.read()

import re

code = code.replace(
    "error: `Your wallet balance is insufficient for this transaction (Required: $${Number(maxPrice).toFixed(3)}, Available: $${userBalance.toFixed(2)}). Please add funds to your wallet.`",
    "error: 'Your wallet balance is insufficient for this transaction.'"
)

code = code.replace(
    "error: 'Your wallet balance is insufficient. Please add funds to your wallet.'",
    "error: 'Your wallet balance is insufficient for this transaction.'"
)

code = code.replace(
    "lastError = 'Your wallet balance is insufficient for this specific route. Please add funds to your wallet.';",
    "lastError = 'Your wallet balance is insufficient for this transaction.';"
)

with open('src/app/api/vsim/allocate/route.ts', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
