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

    // Filter to rules that have stock (cached_wholesale_cost > 0)
    const activeRules = rules.filter(r => r.cached_wholesale_cost > 0);
    
    if (activeRules.length === 0) {
       return NextResponse.json({ 
        available: false, 
        error: 'Service temporarily out of stock. Please try again in a few minutes.' 
      });
    }

    // Aggregate by Tier
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
    });

    return NextResponse.json({
      available: options.length > 0,
      options: options
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
