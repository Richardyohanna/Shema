import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase-admin';

const PAYSTACK_BASE = 'https://api.paystack.co';

export type DonationCurrency = 'NGN' | 'USD';

// Limits are in major units (naira / dollars); keep in sync with the donate modal.
export const CURRENCY_CONFIG: Record<
  DonationCurrency,
  { symbol: string; locale: string; min: number; max: number }
> = {
  NGN: { symbol: '₦', locale: 'en-NG', min: 100, max: 10_000_000 },
  USD: { symbol: '$', locale: 'en-US', min: 1, max: 10_000 },
};

export function parseCurrency(value: unknown): DonationCurrency | null {
  return value === 'NGN' || value === 'USD' ? value : null;
}

/**
 * Converts a human amount (e.g. 25.5) to the currency's subunit (2550) using
 * string arithmetic, so no floating-point error is introduced. NGN (kobo) and
 * USD (cents) both have 100 subunits per unit in Paystack. Returns null when the
 * amount is not a plain positive number with at most 2 decimal places.
 */
export function toSubunit(amount: unknown): number | null {
  const s = typeof amount === 'number' ? String(amount) : typeof amount === 'string' ? amount.trim() : '';
  const m = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) return null;
  const subunit = Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0') || '0');
  return subunit > 0 ? subunit : null;
}

export function formatAmount(subunit: number, currency: string): string {
  const cfg = CURRENCY_CONFIG[currency as DonationCurrency];
  const value = subunit / 100;
  return new Intl.NumberFormat(cfg?.locale ?? 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export type DonationStatus = 'pending' | 'success' | 'failed' | 'abandoned';

export interface DonationRow {
  reference: string;
  donor_name: string;
  donor_email: string;
  amount_kobo: number;
  currency: string;
  status: DonationStatus;
  paystack_transaction_id: string | null;
  paid_at: string | null;
  verified: boolean;
  thank_you_email_sent: boolean;
}

const DONATION_COLUMNS =
  'reference, donor_name, donor_email, amount_kobo, currency, status, paystack_transaction_id, paid_at, verified, thank_you_email_sent';

export class PaystackError extends Error {
  constructor(
    message: string,
    public readonly httpStatus?: number,
    public readonly paystackMessage?: string
  ) {
    super(message);
  }
}

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new PaystackError('PAYSTACK_SECRET_KEY is not configured');
  return key;
}

export function getSecretKey() {
  return secretKey();
}

async function paystackFetch(path: string, init?: RequestInit) {
  let res: Response;
  try {
    res = await fetch(`${PAYSTACK_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${secretKey()}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new PaystackError('Unable to reach Paystack');
  }
  const json = await res.json().catch(() => null);
  if (!res.ok || !json) {
    const pm = (json as any)?.message as string | undefined;
    throw new PaystackError(`Paystack responded with ${res.status}: ${pm ?? 'no message'}`, res.status, pm);
  }
  return json as { status: boolean; message: string; data: any };
}

export async function initializePaystackTransaction(params: {
  email: string;
  amountKobo: number;
  currency: DonationCurrency;
  reference: string;
  callbackUrl: string;
  name: string;
}) {
  const json = await paystackFetch('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      currency: params.currency,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: {
        donor_name: params.name,
        purpose: 'Donation to Shema',
        cancel_action: `${params.callbackUrl}?reference=${params.reference}&cancelled=1`,
      },
    }),
  });
  if (!json.status || !json.data?.authorization_url) {
    throw new PaystackError('Paystack could not initialize the transaction');
  }
  return json.data.authorization_url as string;
}

export async function getDonation(reference: string): Promise<DonationRow | null> {
  const { data, error } = await supabaseAdmin
    .from('donations')
    .select(DONATION_COLUMNS)
    .eq('reference', reference)
    .maybeSingle();
  if (error) throw error;
  return data as DonationRow | null;
}

/**
 * Verifies a donation with Paystack and records the outcome. Safe to call
 * repeatedly (callback, webhook, retries): a donation already marked
 * successful is never modified again.
 */
export async function verifyAndRecordDonation(donation: DonationRow): Promise<DonationRow> {
  if (donation.status === 'success' && donation.verified) {
    // Already verified: only retry a thank-you email that previously failed.
    await sendThankYouEmailOnce(donation);
    return donation;
  }

  const json = await paystackFetch(
    `/transaction/verify/${encodeURIComponent(donation.reference)}`
  );
  const tx = json.data;
  if (!json.status || !tx) throw new PaystackError('Paystack verification failed');
  if (tx.reference !== donation.reference) {
    throw new PaystackError('Paystack transaction reference mismatch');
  }

  let status: DonationStatus;
  switch (tx.status) {
    case 'success':
      status = 'success';
      break;
    case 'failed':
    case 'reversed':
      status = 'failed';
      break;
    case 'abandoned':
      status = 'abandoned';
      break;
    default:
      status = 'pending';
  }

  // A "success" is only honoured if amount and currency match what we initialised.
  if (
    status === 'success' &&
    (tx.amount !== donation.amount_kobo || tx.currency !== donation.currency)
  ) {
    status = 'failed';
  }

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    status,
    updated_at: now,
    paystack_transaction_id: tx.id != null ? String(tx.id) : donation.paystack_transaction_id,
  };
  if (status === 'success') {
    update.paid_at = tx.paid_at ?? now;
    update.verified = true;
    update.verified_at = now;
  }

  const { data, error } = await supabaseAdmin
    .from('donations')
    .update(update)
    .eq('reference', donation.reference)
    .neq('status', 'success') // idempotency: never overwrite a recorded success
    .select(DONATION_COLUMNS)
    .maybeSingle();
  if (error) throw error;

  const final = (data as DonationRow | null) ?? (await getDonation(donation.reference)) ?? donation;
  if (final.status === 'success' && final.verified) await sendThankYouEmailOnce(final);
  return final;
}

const EMAIL_CLAIM_TTL_MS = 5 * 60 * 1000;

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * Sends the thank-you email at most once per donation. A conditional UPDATE
 * claims the send so concurrent verify/webhook calls cannot both send; the claim
 * is released if delivery fails so a later verification retries. Never throws:
 * an email problem must not affect the (already successful) donation.
 */
export async function sendThankYouEmailOnce(donation: DonationRow): Promise<void> {
  if (donation.thank_you_email_sent) return;
  try {
    const staleBefore = new Date(Date.now() - EMAIL_CLAIM_TTL_MS).toISOString();
    const { data: claimed, error: claimError } = await supabaseAdmin
      .from('donations')
      .update({ thank_you_email_claimed_at: new Date().toISOString() })
      .eq('reference', donation.reference)
      .eq('status', 'success')
      .eq('verified', true)
      .eq('thank_you_email_sent', false)
      .or(`thank_you_email_claimed_at.is.null,thank_you_email_claimed_at.lt.${staleBefore}`)
      .select('reference')
      .maybeSingle();
    if (claimError) throw claimError;
    if (!claimed) return; // already sent or another request is sending it

    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) throw new Error('RESEND_API_KEY is not configured');
      const siteUrl = (
        process.env.SITE_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        'https://shemahs.org'
      ).replace(/\/+$/, '');
      const amount = formatAmount(donation.amount_kobo, donation.currency);
      const date = new Date(donation.paid_at ?? Date.now()).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const name = escapeHtml(donation.donor_name);

      const { error: sendError } = await new Resend(apiKey).emails.send({
        from: 'Shema <info@shemahs.org>',
        to: [donation.donor_email],
        replyTo: 'info@shemahs.org',
        subject: 'Thank You for Supporting Shema',
        html: `
          <p>Dear ${name},</p>
          <p>Thank you for your generous donation of <strong>${amount}</strong> to Shema.</p>
          <p>Your support means a great deal to us and helps us continue our work and support the people and communities we serve.</p>
          <p><strong>Donation reference:</strong> ${escapeHtml(donation.reference)}<br/>
          <strong>Date:</strong> ${date}</p>
          <p>We sincerely appreciate your generosity and commitment to our cause.</p>
          <p>With gratitude,<br/>The Shema Team<br/>
          <a href="${siteUrl}">${siteUrl}</a> &middot; info@shemahs.org</p>
        `,
      });
      if (sendError) throw sendError;
    } catch (error) {
      console.error('Thank-you email failed (will retry on next verification):', error);
      await supabaseAdmin
        .from('donations')
        .update({ thank_you_email_claimed_at: null })
        .eq('reference', donation.reference);
      return;
    }

    const { error: markError } = await supabaseAdmin
      .from('donations')
      .update({ thank_you_email_sent: true, thank_you_email_sent_at: new Date().toISOString() })
      .eq('reference', donation.reference);
    if (markError) console.error('Could not mark thank-you email as sent:', markError);
  } catch (error) {
    console.error('Thank-you email processing failed:', error);
  }
}

export function toPublicDonation(d: DonationRow) {
  return {
    reference: d.reference,
    status: d.status,
    donorName: d.donor_name,
    amount: d.amount_kobo / 100,
    currency: d.currency,
    paidAt: d.paid_at,
  };
}
