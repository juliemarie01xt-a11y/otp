const axios = require('axios');
const token = '8808729909:AAGpDmRICjMHuB0_yqzGKu-HUaKW9ht55pA';
const url = 'https://gsxcwfoxozgyavzbphmd.supabase.co/functions/v1/telegram-bot';

async function setWebhook() {
    try {
        const res = await axios.post(`https://api.telegram.org/bot${token}/setWebhook`, { url: url });
        console.log("Set to telegram-bot:", res.data);
    } catch(e) {
        console.error(e.response ? e.response.data : e.message);
    }
}
setWebhook();
