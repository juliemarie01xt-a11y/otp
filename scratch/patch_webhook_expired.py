with open('src/app/api/webhooks/plisio/route.ts', 'r', encoding='utf-8') as f:
    code = f.read()

old_status_check = """    // 3. Only process completed (paid in full) or mismatch (overpaid).
    //    Per Plisio docs: mismatch = overpaid, so safe to credit.
    //    All other statuses (pending, new, expired, cancelled, error) are ignored.
    if (data.status !== 'completed' && data.status !== 'mismatch') {
      return NextResponse.json({ success: true, message: `Status '${data.status}' ignored` });
    }

    // 4. Extract order data (per Plisio invoice callback docs, these are top-level fields)
    const orderId = data.order_number;
    const amountPaidStr = data.source_amount;

    if (!orderId || !amountPaidStr) {
      return NextResponse.json({ error: 'Missing order_number or source_amount' }, { status: 400 });
    }"""

new_status_check = """    // 3. Process completed (paid in full), mismatch (overpaid), or expired (partial payment).
    //    Per Plisio docs: mismatch = overpaid, expired = may have partial payment.
    if (data.status !== 'completed' && data.status !== 'mismatch' && data.status !== 'expired') {
      return NextResponse.json({ success: true, message: `Status '${data.status}' ignored` });
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
    }"""

code = code.replace(old_status_check, new_status_check)

with open('src/app/api/webhooks/plisio/route.ts', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
