import { NextRequest, NextResponse } from 'next/server';
import {
  PaystackError,
  getDonation,
  toPublicDonation,
  verifyAndRecordDonation,
} from '@/lib/donations';

const REFERENCE_RE = /^SHEMA-[0-9a-f-]{36}$/i;

export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get('reference') ?? '';
  if (!REFERENCE_RE.test(reference)) {
    return NextResponse.json({ error: 'Invalid transaction reference.' }, { status: 400 });
  }

  try {
    const donation = await getDonation(reference);
    if (!donation) {
      return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });
    }
    const verified = await verifyAndRecordDonation(donation);
    return NextResponse.json({ donation: toPublicDonation(verified) });
  } catch (error) {
    console.error('Donation verification failed:', error);
    const status = error instanceof PaystackError ? 502 : 500;
    return NextResponse.json(
      { error: 'We could not verify your payment right now. Please try again shortly.' },
      { status }
    );
  }
}
