const axios = require('axios');
async function check() {
    try {
        const start = Date.now();
        const res = await axios.get('https://swiftotp.store/api/cron/sync-prices', {
            headers: {
                'Authorization': 'Bearer corn123'
            },
            timeout: 65000
        });
        console.log("Status:", res.status, res.data);
        console.log("Time:", Date.now() - start, "ms");
    } catch(e) {
         console.log("Error Status:", e.response ? e.response.status : e.message);
         console.log("Data:", e.response ? e.response.data : '');
    }
}
check();
