import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { getDonation, getSecretKey, verifyAndRecordDonation } from '@/lib/donations';

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get('x-paystack-signature') ?? '';

  let expected: Buffer;
  try {
    expected = createHmac('sha512', getSecretKey()).update(raw).digest();
  } catch {
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 500 });
  }
  const provided = Buffer.from(signature, 'hex');
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  const reference = event?.data?.reference;
  if (event?.event !== 'charge.success' || typeof reference !== 'string') {
    return NextResponse.json({ received: true });
  }

  try {
    const donation = await getDonation(reference);
    // Unknown references are acknowledged so Paystack does not retry them.
    if (donation) await verifyAndRecordDonation(donation);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    // Non-2xx makes Paystack retry later.
    return NextResponse.json({ error: 'Processing failed.' }, { status: 500 });
  }
}
