const fs = require('fs');
let code = fs.readFileSync('supabase/functions/telegram-bot/index.ts', 'utf8');

const oldGuide = "const unlinkedGuide = `?? <b>Welcome to SwiftOTP!</b>\\n\\nTo start buying numbers directly from Telegram, you need to securely connect this chat to your website account.\\n\\n<b>How to link your account:</b>\\n1?? Copy your Telegram ID: <code>${chatId}</code>\\n2?? Log in to <a href=\"${WEBSITE_URL}\">SwiftOTP.online</a>\\n3?? Go to your <b>Settings</b> page\\n4?? Paste your ID into the \"Telegram Bot\" box and click Link!\\n\\n<i>Once linked, you can type /buy to instantly purchase numbers!</i>`;";

const newGuide = "const unlinkedGuide = `?? <b>Welcome to SwiftOTP!</b>\\n\\nTo start buying numbers directly from Telegram, you need to securely connect this chat to your website account.\\n\\n<b>How to link your account:</b>\\n1?? Copy your Telegram ID: <code>${chatId}</code>\\n2?? Open the <a href=\"https://otp-three-liard.vercel.app/dashboard/telegram\">Telegram Setup Page</a> on our website.\\n3?? Paste your ID into the secure connection box and click Connect!\\n\\n<i>You will receive a confirmation message here once successfully linked.</i>`;";

if (code.includes(oldGuide)) {
    code = code.replace(oldGuide, newGuide);
    fs.writeFileSync('supabase/functions/telegram-bot/index.ts', code, 'utf8');
    console.log("Updated Edge Function guide!");
} else {
    console.log("Could not find oldGuide exactly. Using regex...");
    
    // Fallback regex
    const regex = /const unlinkedGuide = `[\s\S]*?`;/;
    code = code.replace(regex, newGuide);
    fs.writeFileSync('supabase/functions/telegram-bot/index.ts', code, 'utf8');
    console.log("Updated using regex!");
}
