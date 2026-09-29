const fs = require('fs');
let webCode = fs.readFileSync('src/app/api/webhooks/plisio/route.ts', 'utf8');

const oldExpired = `      // ONLY process payments that are fully completed or overpaid (mismatch)
      // Do NOT process 'expired' because partial payments could trigger it and credit the full amount!
      if (data.status !== 'completed' && data.status !== 'mismatch') {
        return NextResponse.json({ success: true, message: \`Status '\${data.status}' ignored\` });
      }

      // 4. Extract order data
      const orderId = data.order_number;
      const amountPaidStr = data.source_amount;

      if (!orderId || !amountPaidStr) {
        return NextResponse.json({ error: 'Missing order_number or source_amount' }, { status: 400 });
      }`;

const newExpired = `      // ONLY process completed, overpaid (mismatch), or underpaid (expired)
      if (data.status !== 'completed' && data.status !== 'mismatch' && data.status !== 'expired') {
        return NextResponse.json({ success: true, message: \`Status '\${data.status}' ignored\` });
      }

      // 4. Extract order data
      const orderId = data.order_number;
      
      // If completed or overpaid, Plisio's source_amount reflects the invoice target exactly
      let amountPaidStr = data.source_amount;

      // DYNAMIC PARTIAL PAYMENT RECOVERY:
      // If they underpaid and it expired, source_amount is just the invoice target.
      // We must calculate exactly what they actually sent in USD.
      if (data.status === 'expired') {
          const actualCryptoSent = Number(data.amount);
          const exchangeRate = Number(data.source_rate);
          
          if (!actualCryptoSent || !exchangeRate || actualCryptoSent <= 0) {
              return NextResponse.json({ success: true, message: 'Expired with no payment, ignored' });
          }
          
          // Convert actual crypto sent into USD
          const actualUsdSent = actualCryptoSent / exchangeRate;
          
          // Since Plisio takes ~1%, what arrived in our wallet is ~99% of what they sent.
          // To safely calculate their credit while maintaining our 0.5% profit:
          // Target Credit = (Actual USD Sent * 0.99) / 1.005
          const safeCredit = (actualUsdSent * 0.99) / 1.005;
          
          // We override amountPaidStr to simulate that they "requested" this safe credit
          // so the rest of the webhook math seamlessly processes it.
          // The rest of the webhook multiplies this by (1.015 / 1.01), so we reverse it here:
          amountPaidStr = (safeCredit * (1.015 / 1.01)).toString();
      }

      if (!orderId || !amountPaidStr) {
        return NextResponse.json({ error: 'Missing order_number or source_amount' }, { status: 400 });
      }`;

if (webCode.includes("if (data.status !== 'completed' && data.status !== 'mismatch') {")) {
    webCode = webCode.replace(oldExpired, newExpired);
    fs.writeFileSync('src/app/api/webhooks/plisio/route.ts', webCode, 'utf8');
    console.log("Injected dynamic partial payment recovery!");
} else {
    console.log("Could not find the expired logic to replace.");
}
