const axios = require('axios');
const token = '8808729909:AAGpDmRICjMHuB0_yqzGKu-HUaKW9ht55pA';

async function check() {
    try {
        const res = await axios.get(`https://api.telegram.org/bot${token}/getWebhookInfo`);
        console.log(res.data);
    } catch(e) {
        console.error(e.response ? e.response.data : e.message);
    }
}
check();
