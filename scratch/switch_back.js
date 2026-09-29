const axios = require('axios');
const token = '8808729909:AAGpDmRICjMHuB0_yqzGKu-HUaKW9ht55pA';
const url1 = 'https://gsxcwfoxozgyavzbphmd.supabase.co/functions/v1/telegram-bot';
const url2 = 'https://gsxcwfoxozgyavzbphmd.supabase.co/functions/v1/telegram-webhook';

async function setWebhook() {
    try {
        const res = await axios.post(`https://api.telegram.org/bot${token}/setWebhook`, { url: url2 });
        console.log("Set to telegram-webhook:", res.data);
    } catch(e) {
        console.error(e.response ? e.response.data : e.message);
    }
}
setWebhook();
