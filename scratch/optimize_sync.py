import os

file_path = "src/app/api/cron/sync-prices/route.ts"
with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

# Replace the sequential loop with a Promise-based batching loop
new_loop = """
    // 2. Process rules in parallel batches to prevent Vercel 10s timeout
    const BATCH_SIZE = 15; // Process 15 requests concurrently
    
    for (let i = 0; i < rules.length; i += BATCH_SIZE) {
      const batch = rules.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (rule) => {
        const TARGET_API_URL = rule.target_api === 'smsbower' ? SMSBOWER_API_URL : VSIM_API_URL;
        const TARGET_API_KEY = rule.target_api === 'smsbower' ? process.env.SMSBOWER_API_KEY : process.env.VSIM_API_KEY;

        if (!TARGET_API_KEY) return;

        const apiParams: any = {
          api_key: TARGET_API_KEY,
          action: 'getPricesV3',
          country: rule.country_id,
          service: rule.target_service_code
        };
        
        if (rule.target_api === 'vsim' && rule.target_operator) {
           apiParams.operator = rule.target_operator;
        }

        try {
          const response = await axios.get(TARGET_API_URL, { params: apiParams, validateStatus: (s) => s < 500, timeout: 5000 });
          const data = response.data;
          
          let bestPrice: number | null = null;
          let count = 0;
          const country = rule.country_id;
          const service = rule.target_service_code;
          
          if (data && typeof data === 'object' && data[country] && data[country][service]) {
            const sData = data[country][service];
            
            if (sData.providers) {
               Object.values(sData.providers).forEach((p: any) => {
                   if (!rule.target_provider || p.providerIds == rule.target_provider) {
                       const pPrice = parseFloat(p.price[0] || p.price);
                       if (bestPrice === null || pPrice < bestPrice) bestPrice = pPrice;
                       count += parseInt(p.count || 0);
                   }
               });
            }
            else if (rule.target_api === 'smsbower') {
               Object.entries(sData).forEach(([provId, pData]: [string, any]) => {
                   if (!rule.target_provider || provId == rule.target_provider) {
                       const pPrice = parseFloat(pData.price || 0);
                       if (bestPrice === null || pPrice < bestPrice) bestPrice = pPrice;
                       count += parseInt(pData.count || 0);
                   }
               });
            }
            else {
                bestPrice = parseFloat(sData.price);
                count = parseInt(sData.count || 0);
            }
          }
          
          if (bestPrice !== null && count > 0) {
              await supabaseAdmin.from('routing_rules').update({ cached_wholesale_cost: bestPrice }).eq('id', rule.id);
              updatedCount++;
          } else {
              await supabaseAdmin.from('routing_rules').update({ cached_wholesale_cost: 0 }).eq('id', rule.id);
          }
        } catch (e) {
          console.error(`Failed to sync rule ${rule.id}`);
        }
      }));
    }

    return NextResponse.json({ success: true, updated: updatedCount });"""

# Extract everything before the old for...of loop
parts = code.split("// 2. Loop through each rule and update its cached price")
if len(parts) == 2:
    tail_parts = parts[1].split("return NextResponse.json({ success: true, updated: updatedCount });")
    if len(tail_parts) == 2:
        new_code = parts[0] + new_loop + tail_parts[1]
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_code)
        print("Updated sync-prices loop successfully!")
    else:
        print("Could not find the return statement.")
else:
    print("Could not split the code.")
