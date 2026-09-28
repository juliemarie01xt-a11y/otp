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

    const PROFIT_MARGIN = 0.012;
    
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
    ];

    return NextResponse.json({
      available: options.length > 0,
      options: options
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
