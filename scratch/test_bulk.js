const axios = require('axios');
require('dotenv').config({ path: '.env.local' });
async function check() {
    try {
        const start = Date.now();
        const res = await axios.get('https://smsbower.page/stubs/handler_api.php', {
            params: {
                api_key: process.env.SMSBOWER_API_KEY,
                action: 'getPricesV3'
            }
        });
        console.log("Time:", Date.now() - start, "ms");
        console.log("Size:", JSON.stringify(res.data).length, "bytes");
    } catch(e) {
         console.log("Error Status:", e.response ? e.response.status : e.message);
    }
}
check();
