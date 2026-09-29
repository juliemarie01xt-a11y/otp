const fs = require('fs');
let code = fs.readFileSync('src/app/api/bot/command/route.ts', 'utf8');

const replacements = [
    ["? Your account is not currently linked.", "❌ Your account is not currently linked."],
    ["? Your account has been securely disconnected", "🔌 Your account has been securely disconnected"],
    ["? This route is no longer available.", "❌ This route is no longer available."],
    ["? Your wallet balance is insufficient.", "❌ Your wallet balance is insufficient."],
    ["? Provider failed to return a price", "❌ Provider failed to return a price"],
    ["? Insufficient balance for this specific number", "❌ Insufficient balance for this specific number"],
    ["? Provider returned invalid data.", "❌ Provider returned invalid data."],
    ["? Insufficient balance (concurrency check)", "❌ Insufficient balance (concurrency check)"],
    ["? Out of stock for this specific tier.", "❌ Out of stock for this specific tier."],
    ["? Provider API Error:", "❌ Provider API Error:"],
    ["dY\"T Back to Countries", "🔙 Back to Countries"],
    ["dY>' <b>What service do you need?</b>", "🛒 <b>What service do you need?</b>"],
    ["dY>' <b>Available routes", "🛒 <b>Available routes"],
    ["dY>' <b>Choose a country", "🌍 <b>Choose a country"],
    ["?3 <b>Processing your purchase securely...</b>", "⏳ <b>Processing your purchase securely...</b>"]
];

for (const [bad, good] of replacements) {
    code = code.split(bad).join(good);
}

// Ensure the weird ones are fixed too
code = code.replace(/\?O /g, "❌ ");
code = code.replace(/\?3 /g, "⏳ ");
code = code.replace(/dY'Z /g, "💎 ");
code = code.replace(/-\? /g, "⭐ ");
code = code.replace(/\? /g, "⭐ ");

fs.writeFileSync('src/app/api/bot/command/route.ts', code, 'utf8');
console.log("Cleaned up remaining emojis!");
