import { NextResponse } from 'next/server';
import axios from 'axios';

const VSIM_API_URL = 'https://api.vsimpro.com/stubs/handler_api.php';
const VSIM_API_KEY = process.env.VSIM_API_KEY || '';

const SMSBOWER_API_URL = 'https://smsbower.page/stubs/handler_api.php';
const SMSBOWER_API_KEY = process.env.SMSBOWER_API_KEY || '';

// Hardcoded map per user instructions
const SERVICE_MAP: Record<string, { vsim: string, smsbower: string }> = {
    'gv': { vsim: 'lvbv', smsbower: 'gf' },
    'gmail': { vsim: 'api', smsbower: 'go' }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');
  const service = searchParams.get('service');

  if (!country || !service || !SERVICE_MAP[service]) {
    return NextResponse.json({ error: 'Invalid country or service' }, { status: 400 });
  }

  const vsimCode = SERVICE_MAP[service].vsim;
  const bowerCode = SERVICE_MAP[service].smsbower;
  let allOptions: any[] = [];

  try {
    // --- VSIM SCAN ---
    if (VSIM_API_KEY) {
      try {
        const opsRes = await axios.get(VSIM_API_URL, { params: { api_key: VSIM_API_KEY, action: 'getOperators' } });
        const opIds = Object.values(opsRes.data) as string[];
        
        const pricePromises = opIds.map(opId => {
          return axios.get(VSIM_API_URL, {
            params: { api_key: VSIM_API_KEY, action: 'getPricesV3', country, service: vsimCode, operator: opId },
            validateStatus: (s) => s < 500
          }).then(res => ({ opId, data: res.data }));
        });

        const results = await Promise.all(pricePromises);
        results.forEach(res => {
          if (res.data && res.data[country] && res.data[country][vsimCode]) {
            const serviceData = res.data[country][vsimCode];
            if (serviceData.providers) {
              Object.values(serviceData.providers).forEach((p: any) => {
                allOptions.push({
                  api: 'vsim',
                  code: vsimCode,
                  operator: res.opId,
                  provider: p.providerIds,
                  price: parseFloat(p.price[0] || p.price),
                  count: p.count
                });
              });
            } else {
               allOptions.push({
                    api: 'vsim',
                    code: vsimCode,
                    operator: res.opId,
                    provider: null,
                    price: parseFloat(serviceData.price),
                    count: serviceData.count
               });
            }
          }
        });
      } catch(e) {
        console.error('VSIM Scan Error:', e);
      }
    }

    // --- SMSBOWER SCAN ---
    if (SMSBOWER_API_KEY) {
      try {
        const bowerRes = await axios.get(SMSBOWER_API_URL, { 
            params: { api_key: SMSBOWER_API_KEY, action: 'getPricesV3', country, service: bowerCode },
            validateStatus: (s) => s < 500 
        });
        const bData = bowerRes.data;

        if (bData && typeof bData === 'object' && bData[country] && bData[country][bowerCode]) {
          const providers = bData[country][bowerCode];
          Object.entries(providers).forEach(([providerId, pData]: [string, any]) => {
            allOptions.push({
              api: 'smsbower',
              code: bowerCode,
              operator: null, // SMSBower has no separate operator 
              provider: providerId, // It only has provider ID
              price: parseFloat(pData.price || 0),
              count: pData.count || 0
            });
          });
        }
      } catch(e) {
         console.error('SMSBower Scan Error:', e);
      }
    }

    // Sort by price (cheapest first)
    allOptions.sort((a, b) => a.price - b.price);

    return NextResponse.json({ success: true, options: allOptions });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
