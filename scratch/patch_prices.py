with open('src/app/api/vsim/prices/route.ts', 'r', encoding='utf-8') as f:
    code = f.read()

import re

old_logic = """    // Aggregate by Tier
    const grouped: any = {};
    for (const rule of activeRules) {
        let bestPrice = parseFloat(rule.cached_wholesale_cost);
        
        // HARDCODE: Google Voice (USA) Minimum Floor Price is $0.15 retail. 
        // Since we add 0.012 profit later, we ensure wholesale is at least 0.138.
        if (country === '12' && rule.target_api === 'vsim' && rule.target_service_code === 'lvbv') {
           if (bestPrice < 0.138) {
               bestPrice = 0.138;
           }
        }

        if (!grouped[rule.tier]) {
            grouped[rule.tier] = { tier: rule.tier, price: bestPrice, count: 100, source: rule.target_api };
        } else {
            // Find lowest price for this tier
            grouped[rule.tier].price = Math.min(grouped[rule.tier].price, bestPrice);
            grouped[rule.tier].count += 100;
        }
    }

    const PROFIT_MARGIN = 0.012;
    const options = Object.values(grouped).map((g: any) => ({
      ...g,
      price: Number((g.price + PROFIT_MARGIN).toPrecision(12))
    })).sort((a: any, b: any) => {
      if (a.tier === 'premium' && b.tier !== 'premium') return -1;
      if (b.tier === 'premium' && a.tier !== 'premium') return 1;
      return a.price - b.price;
    });"""

new_logic = """    const PROFIT_MARGIN = 0.012;
    
    // Split into tiers and sort by price
    const premiumRules = activeRules.filter(r => r.tier === 'premium').sort((a,b) => parseFloat(a.cached_wholesale_cost) - parseFloat(b.cached_wholesale_cost));
    const standardRules = activeRules.filter(r => r.tier === 'standard').sort((a,b) => parseFloat(a.cached_wholesale_cost) - parseFloat(b.cached_wholesale_cost));

    const getLetter = (index: number) => String.fromCharCode(65 + index); // 0->A, 1->B, etc.

    const processRule = (rule: any, index: number) => {
        let bestPrice = parseFloat(rule.cached_wholesale_cost);
        if (country === '12' && rule.target_api === 'vsim' && rule.target_service_code === 'lvbv') {
           if (bestPrice < 0.138) bestPrice = 0.138;
        }
        return {
            rule_id: rule.id,
            tier: rule.tier,
            server_label: `Server ${getLetter(index)}`,
            price: Number((bestPrice + PROFIT_MARGIN).toPrecision(12)),
            count: 100,
            source: rule.target_api
        };
    };

    const options = [
        ...premiumRules.map((r, i) => processRule(r, i)),
        ...standardRules.map((r, i) => processRule(r, i))
    ];"""

code = code.replace(old_logic, new_logic)

with open('src/app/api/vsim/prices/route.ts', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
