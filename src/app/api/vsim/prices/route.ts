import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabaseAdmin } from '@/lib/supabase-admin';

const VSIM_API_URL = 'https://api.vsimpro.com/stubs/handler_api.php';
const SMSBOWER_API_URL = 'https://smsbower.page/stubs/handler_api.php';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');
  const service = searchParams.get('service');

  if (!country || !service) {
    return NextResponse.json({ error: 'Missing country or service' }, { status: 400 });
  }

  try {
    const { data: rules, error: ruleError } = await supabaseAdmin
      .from('routing_rules')
      .select('*')
      .eq('country_id', country)
      .eq('internal_service', service);

    if (ruleError || !rules || rules.length === 0) {
      return NextResponse.json({ 
        available: false, 
        error: 'No active route configured for this service. Please contact support.' 
      });
    }

    const fetchRulePrice = async (rule: any) => {
      const TARGET_API_URL = rule.target_api === 'smsbower' ? SMSBOWER_API_URL : VSIM_API_URL;
      const TARGET_API_KEY = rule.target_api === 'smsbower' ? process.env.SMSBOWER_API_KEY : process.env.VSIM_API_KEY;

      if (!TARGET_API_KEY) return null;

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
        const response = await axios.get(TARGET_API_URL, { params: apiParams, validateStatus: (s) => s < 500 });
        const data = response.data;
        
        let bestPrice: number | null = null;
        let count = 0;
        
        if (data && typeof data === 'object' && data[country] && data[country][rule.target_service_code]) {
          const sData = data[country][rule.target_service_code];
          
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
          // HARDCODE: Force VSIMPRO Google Voice (USA) to be $0.15 retail. 
          // Since we add 0.012 profit later, we set wholesale here to 0.138.
          if (country === '12' && rule.target_api === 'vsim' && rule.target_service_code === 'lvbv') {
             bestPrice = 0.138;
          }

          return {
            tier: rule.tier,
            price: bestPrice,
            count: count,
            source: rule.target_api
          };
        }
      } catch (e) {
        return null;
      }
      return null;
    };

    const results = await Promise.all(rules.map(fetchRulePrice));
    const validResults = results.filter(r => r !== null && r.count > 0);

    // Aggregate by Tier
    const grouped: any = {};
    for (const res of validResults) {
        if (!res) continue;
        if (!grouped[res.tier]) {
            grouped[res.tier] = { tier: res.tier, price: res.price, count: res.count };
        } else {
            // Find lowest price for this tier
            grouped[res.tier].price = Math.min(grouped[res.tier].price, res.price);
            // Sum total stock for this tier
            grouped[res.tier].count += res.count;
        }
    }

    const PROFIT_MARGIN = 0.012;
    const options = Object.values(grouped).map((g: any) => ({
      ...g,
      price: Number((g.price + PROFIT_MARGIN).toPrecision(12))
    })).sort((a: any, b: any) => a.price - b.price);

    return NextResponse.json({
      available: options.length > 0,
      options: options
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
