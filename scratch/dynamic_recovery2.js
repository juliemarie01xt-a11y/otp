const fs = require('fs');
let webCode = fs.readFileSync('src/app/api/webhooks/plisio/route.ts', 'utf8');

const anchor1 = "    // 3. Process completed (paid in full), mismatch (overpaid), or expired (partial payment).";
const anchor2 = "    // 5. ATOMIC LOCK:";

let p1 = webCode.indexOf(anchor1);
let p2 = webCode.indexOf(anchor2);

if (p1 !== -1 && p2 !== -1) {
    const newBlock = `    // 3. Process completed, mismatch (overpaid), or expired (partial payment).
    if (data.status !== 'completed' && data.status !== 'mismatch' && data.status !== 'expired') {
      return NextResponse.json({ success: true, message: \`Status '\${data.status}' ignored\` });
    }

    // 4. Extract order data
    const orderId = data.order_number;
    let amountPaidStr = data.source_amount;

    if (!orderId || !amountPaidStr) {
      return NextResponse.json({ error: 'Missing order_number or source_amount' }, { status: 400 });
    }
    
    // DYNAMIC PARTIAL PAYMENT RECOVERY:
    // If they underpaid and it expired, source_amount is just the invoice target.
    // We must calculate exactly what they actually sent in USD to be fair.
    if (data.status === 'expired') {
        const actualCryptoSent = Number(data.amount);
        const exchangeRate = Number(data.source_rate);
        
        if (!actualCryptoSent || !exchangeRate || actualCryptoSent <= 0) {
            return NextResponse.json({ success: true, message: 'Expired with no payment, ignored' });
        }
        
        // Convert actual crypto sent into USD
        const actualUsdSent = actualCryptoSent / exchangeRate;
        
        // Target Credit = (Actual USD Sent * 0.99) / 1.005
        const safeCredit = (actualUsdSent * 0.99) / 1.005;
        
        // We override amountPaidStr to simulate that they "requested" this safe credit.
        // The webhook bottom math divides by (1.015 / 1.01), so we reverse multiply it here!
        amountPaidStr = (safeCredit * (1.015 / 1.01)).toString();
    }

`;
    webCode = webCode.substring(0, p1) + newBlock + webCode.substring(p2);
    fs.writeFileSync('src/app/api/webhooks/plisio/route.ts', webCode, 'utf8');
    console.log("Injected dynamic partial payment recovery!");
} else {
    console.log("Could not find anchors.", p1, p2);
}
