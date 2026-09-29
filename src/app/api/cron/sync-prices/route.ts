export const maxDuration = 60;

import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabaseAdmin } from '@/lib/supabase-admin';

const VSIM_API_URL = 'https://api.vsimpro.com/stubs/handler_api.php';
const SMSBOWER_API_URL = 'https://smsbower.page/stubs/handler_api.php';

export async function GET(request: Request) {
  // Strict Security check for Cron
  const CRON_SECRET = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized. Invalid or missing CRON_SECRET.' }, { status: 401 });
  }

  try {
    // 1. Fetch all ACTIVE routing rules
    const { data: rules, error: ruleError } = await supabaseAdmin
      .from('routing_rules')
      .select('*');

    if (ruleError || !rules || rules.length === 0) {
      return NextResponse.json({ message: 'No active rules to sync.', count: 0 });
    }

    let updatedCount = 0;

    
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

    return NextResponse.json({ success: true, updated: updatedCount });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
