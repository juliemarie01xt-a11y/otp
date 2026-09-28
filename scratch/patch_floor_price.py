with open('src/app/api/vsim/prices/route.ts', 'r', encoding='utf-8') as f:
    code = f.read()

import re
code = code.replace("if (bestPrice < 0.138) bestPrice = 0.138;", "if (bestPrice < 0.188) bestPrice = 0.188;")

with open('src/app/api/vsim/prices/route.ts', 'w', encoding='utf-8') as f:
    f.write(code)

with open('src/app/api/vsim/allocate/route.ts', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("if (retailCost < 0.15) {", "if (retailCost < 0.20) {")
code = code.replace("retailCost = 0.15;", "retailCost = 0.20;")
code = code.replace("VSIMPRO Google Voice (USA) Minimum Floor Price is $0.15", "VSIMPRO Google Voice (USA) Minimum Floor Price is $0.20")

with open('src/app/api/vsim/allocate/route.ts', 'w', encoding='utf-8') as f:
    f.write(code)
print("done")
