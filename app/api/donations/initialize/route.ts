import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  MAX_DONATION_NGN,
  MIN_DONATION_NGN,
  PaystackError,
  initializePaystackTransaction,
} from '@/lib/donations';

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;

function sanitizeName(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeReason(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f<>]/g, '')
    .trim();
  return cleaned || null;
}

function siteUrl(request: NextRequest): string {
  const configured = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL)?.replace(/\/+$/, '');
  if (configured) return configured;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SITE_URL is not configured');
  }
  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request.', error: 'Invalid request.' }, { status: 400 });
  }

  const name = sanitizeName(body?.name);
  const reason = sanitizeReason(body?.reason);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const amount = typeof body?.amount === 'number' ? body.amount : Number(body?.amount);

  const errors: Record<string, string> = {};
  if (!name || name.length > 100) errors.name = 'Please enter your full name.';
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (
    !Number.isFinite(amount) ||
    amount < MIN_DONATION_NGN ||
    amount > MAX_DONATION_NGN
  ) {
    errors.amount = `Enter an amount between ₦${MIN_DONATION_NGN.toLocaleString('en-NG')} and ₦${MAX_DONATION_NGN.toLocaleString('en-NG')}.`;
  }
  if (reason && reason.length > 500) errors.reason = 'Please keep your message under 500 characters.';
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ success: false, message: 'Validation failed.', error: 'Validation failed.', errors }, { status: 400 });
  }

  // Naira -> kobo exactly once, here.
  const amountKobo = Math.round(amount * 100);
  const reference = `SHEMA-${randomUUID()}`;

  const fail = (stage: string, error: unknown, status: number) => {
    // Technical detail stays in the server logs only.
    console.error(`Donation initialization failed at stage "${stage}":`, error);
    const message = 'Unable to initialize donation payment';
    return NextResponse.json({ success: false, message, error: message }, { status });
  };

  let callbackUrl: string;
  try {
    callbackUrl = `${siteUrl(request)}/donate/result`;
  } catch (error) {
    return fail('config', error, 500);
  }

  const { error: dbError } = await supabaseAdmin.from('donations').insert({
    reference,
    donor_name: name,
    donor_email: email,
    reason,
    amount_kobo: amountKobo,
    currency: 'NGN',
    status: 'pending',
  });
  if (dbError) return fail('database-insert', dbError, 500);

  try {
    const authorizationUrl = await initializePaystackTransaction({
      email,
      amountKobo,
      reference,
      callbackUrl,
      name,
    });
    return NextResponse.json({ success: true, authorizationUrl, reference });
  } catch (error) {
    await supabaseAdmin
      .from('donations')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('reference', reference);
    return fail(
      'paystack-initialize',
      error,
      error instanceof PaystackError && error.message.includes('SECRET_KEY') ? 500 : 502
    );
  }
}
