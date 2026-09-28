with open('src/app/dashboard/buy/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

import re

# Update buyNumber definition
old_buyNumber = "  const buyNumber = async (tier: string = 'premium', price: number) => {"
new_buyNumber = "  const buyNumber = async (rule_id: string, tier: string, price: number) => {"
code = code.replace(old_buyNumber, new_buyNumber)

# Update purchasingTier state name
code = code.replace('const [purchasingTier, setPurchasingTier] = useState<string | null>(null);', 'const [purchasingRule, setPurchasingRule] = useState<string | null>(null);')
code = code.replace('setPurchasingTier(tier);', 'setPurchasingRule(rule_id);')
code = code.replace('setPurchasingTier(null);', 'setPurchasingRule(null);')
code = code.replace('purchasingTier === opt.tier', 'purchasingRule === opt.rule_id')

# Update apiPost body
old_api_req = "const res = await apiPost('/api/vsim/allocate', { country, service, maxPrice: price, tier });"
new_api_req = "const res = await apiPost('/api/vsim/allocate', { country, service, maxPrice: price, rule_id, tier });"
code = code.replace(old_api_req, new_api_req)

# Update JSX mapping for options
# Current: <div key={opt.tier} 
old_key = "<div \n                          key={opt.tier}"
new_key = "<div \n                          key={opt.rule_id}"
code = code.replace(old_key, new_key)

# Replace label logic
old_tier_text = """<img src={selectedCountry.flagUrl} className="inline-block w-4 h-4 mr-1.5 object-cover rounded shadow-sm border border-black/10" alt="flag" />
                                {opt.tier === 'premium' ? 'High-Priority' : 'Standard'}"""
new_tier_text = """<img src={selectedCountry.flagUrl} className="inline-block w-4 h-4 mr-1.5 object-cover rounded shadow-sm border border-black/10" alt="flag" />
                                {opt.tier === 'premium' ? 'High-Priority' : 'Standard'} <span className="opacity-60 font-normal">({opt.server_label})</span>"""
code = code.replace(old_tier_text, new_tier_text)

# Update onClick
old_onClick = "onClick={() => buyNumber(opt.tier, opt.price)}"
new_onClick = "onClick={() => buyNumber(opt.rule_id, opt.tier, opt.price)}"
code = code.replace(old_onClick, new_onClick)


with open('src/app/dashboard/buy/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
