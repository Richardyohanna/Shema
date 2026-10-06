import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  CURRENCY_CONFIG,
  PaystackError,
  formatAmount,
  initializePaystackTransaction,
  parseCurrency,
  toSubunit,
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
  const currency = parseCurrency(body?.currency);
  const amountKobo = toSubunit(body?.amount);

  const errors: Record<string, string> = {};
  if (!name || name.length > 100) errors.name = 'Please enter your full name.';
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!currency) {
    errors.currency = 'Unsupported currency. Supported currencies are NGN and USD.';
  } else {
    const { min, max } = CURRENCY_CONFIG[currency];
    if (amountKobo === null || amountKobo < min * 100 || amountKobo > max * 100) {
      errors.amount = `Enter an amount between ${formatAmount(min * 100, currency)} and ${formatAmount(max * 100, currency)}.`;
    }
  }
  if (reason && reason.length > 500) errors.reason = 'Please keep your message under 500 characters.';
  if (Object.keys(errors).length > 0) {
    const message = errors.currency ?? 'Validation failed.';
    return NextResponse.json({ success: false, message, error: message, errors }, { status: 400 });
  }
  if (!currency || amountKobo === null) {
    return NextResponse.json({ success: false, message: 'Validation failed.' }, { status: 400 });
  }

  // Major units -> subunit (kobo / cents) exactly once, via string arithmetic.
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
    currency,
    status: 'pending',
  });
  if (dbError) return fail('database-insert', dbError, 500);

  try {
    const authorizationUrl = await initializePaystackTransaction({
      email,
      amountKobo,
      currency,
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

    // Safe diagnostics only: no keys, no donor details.
    console.error('Paystack initialization failed:', {
      currency,
      amountMajor: body?.amount,
      amountSentToPaystack: amountKobo,
      paystackHttpStatus: error instanceof PaystackError ? error.httpStatus : undefined,
      paystackMessage: error instanceof PaystackError ? error.paystackMessage : undefined,
      error: error instanceof Error ? error.message : String(error),
    });

    const respond = (message: string, code: string, status: number) =>
      NextResponse.json({ success: false, message, error: message, code }, { status });

    if (error instanceof PaystackError) {
      if (error.message.includes('SECRET_KEY') || error.httpStatus === 401) {
        return fail('paystack-config', error, 500);
      }
      if (/currency not supported/i.test(error.paystackMessage ?? '')) {
        return respond(
          `${currency} donations are temporarily unavailable. Please select Naira (NGN), or try again later.`,
          'CURRENCY_NOT_SUPPORTED',
          422
        );
      }
      if (error.httpStatus === undefined) {
        // Network failure / timeout: nothing to do with the currency.
        return respond(
          "We couldn't connect to the payment service. Please try again.",
          'PAYMENT_PROVIDER_UNAVAILABLE',
          502
        );
      }
      if (error.httpStatus >= 400 && error.httpStatus < 500) {
        // Raw Paystack text is logged above, never shown to the donor.
        return respond(
          'Your donation could not be started. Please check your details and try again.',
          'PAYMENT_REJECTED',
          422
        );
      }
    }
    return fail('paystack-initialize', error, 502);
  }
}
