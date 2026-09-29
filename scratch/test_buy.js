const axios = require('axios');
async function testBuy() {
    try {
        const res = await axios.post('http://localhost:3000/api/bot/command', {
            message: {
                chat: { id: 8252822439 },
                text: '/buy'
            }
        }, {
            headers: {
                'x-telegram-bot-api-secret-token': 'swiftotp_secure_webhook_token_2026'
            }
        });
        console.log(res.status, res.data);
    } catch(e) {
        console.error(e.response ? e.response.data : e.message);
    }
}
testBuy();
