const axios = require('axios');
const token = '8808729909:AAGpDmRICjMHuB0_yqzGKu-HUaKW9ht55pA';
const url = 'https://otp-three-liard.vercel.app/api/bot/command';

async function setWebhook() {
    try {
        const res = await axios.post(`https://api.telegram.org/bot${token}/setWebhook`, {
            url: url,
            secret_token: 'swiftotp_secure_webhook_token_2026'
        });
        console.log("Success:", res.data);
    } catch(e) {
        console.error("Error:", e.response ? e.response.data : e.message);
    }
}
setWebhook();
