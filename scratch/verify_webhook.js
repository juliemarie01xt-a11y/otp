const axios = require('axios');
const token = '8808729909:AAGpDmRICjMHuB0_yqzGKu-HUaKW9ht55pA';
async function getWebhookInfo() {
    try {
        const res = await axios.get(`https://api.telegram.org/bot${token}/getWebhookInfo`);
        console.log(res.data);
    } catch(e) {}
}
getWebhookInfo();
