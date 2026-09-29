const fs = require('fs');
let webCode = fs.readFileSync('src/app/api/webhooks/plisio/route.ts', 'utf8');

// Replace the dangerous expired logic
const oldExpired = `      if (data.status !== 'completed' && data.status !== 'mismatch' && data.status !== 'expired') {
        return NextResponse.json({ success: true, message: \`Status '\${data.status}' ignored\` });
      }

      // 4. Extract order data
      const orderId = data.order_number;
      const amountPaidStr = data.source_amount;

      if (!orderId || !amountPaidStr) {
        return NextResponse.json({ error: 'Missing order_number or source_amount' }, { status: 400 });
      }
      
      // If it expired, verify they actually paid something. If $0, ignore it.
      if (data.status === 'expired' && Number(amountPaidStr) <= 0) {
        return NextResponse.json({ success: true, message: 'Expired with no payment, ignored' });
      }`;

const newExpired = `      // ONLY process payments that are fully completed or overpaid (mismatch)
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

if (webCode.includes("data.status !== 'expired'")) {
    webCode = webCode.replace(oldExpired, newExpired);
    fs.writeFileSync('src/app/api/webhooks/plisio/route.ts', webCode, 'utf8');
    console.log("Fixed critical underpayment vulnerability!");
} else {
    console.log("Could not find expired logic.");
}
