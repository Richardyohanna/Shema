'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Loader2, Lock, ShieldCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

/* -------------------------------------------------------------------------- */
/*  Config                                                                    */
/* -------------------------------------------------------------------------- */

type Currency = 'NGN' | 'USD';

const CURRENCIES: Record<
  Currency,
  { symbol: string; name: string; locale: string; presets: number[]; min: number; max: number }
> = {
  NGN: { symbol: '₦', name: 'Naira', locale: 'en-NG', presets: [1000, 5000, 10000, 20000], min: 100, max: 10_000_000 },
  USD: { symbol: '$', name: 'US Dollar', locale: 'en-US', presets: [10, 25, 50, 100], min: 1, max: 10_000 },
};

// Which preset is selected by default after choosing a currency (index into presets).
const DEFAULT_PRESET_INDEX = 1;

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;
// Up to 2 decimal places, digits only.
const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

function formatMoney(value: number, currency: Currency) {
  return new Intl.NumberFormat(CURRENCIES[currency].locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function isPaystackUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && (u.hostname === 'paystack.com' || u.hostname.endsWith('.paystack.com'));
  } catch {
    return false;
  }
}

type Errors = { name?: string; email?: string; amount?: string; reason?: string };
type Phase = 'idle' | 'initializing' | 'redirecting';
type Step = 1 | 2;

interface DonateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function DonateModal({ open, onOpenChange }: DonateModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [currency, setCurrency] = useState<Currency>('NGN');
  const [selected, setSelected] = useState<number | 'custom'>(
    CURRENCIES.NGN.presets[DEFAULT_PRESET_INDEX]
  );
  const [custom, setCustom] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [phase, setPhase] = useState<Phase>('idle');
  const [formError, setFormError] = useState('');

  const cfg = CURRENCIES[currency];
  const busy = phase !== 'idle';
  const amount =
    selected === 'custom' ? (AMOUNT_RE.test(custom.trim()) ? Number(custom) : NaN) : selected;
  const amountReady = Number.isFinite(amount) && amount > 0;

  // Pressing Back from Paystack restores this page from bfcache with the old busy state.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) setPhase('idle');
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  // Start from step 1 every time the modal is reopened.
  useEffect(() => {
    if (!open) {
      setStep(1);
      setErrors({});
      setFormError('');
      setName('');
      setEmail('');
      setReason('');
      setSelected(CURRENCIES['NGN'].presets[DEFAULT_PRESET_INDEX]);
      setCustom('');
      setCurrency('NGN');
    }
  }, [open]);

  /* ----------------------------- handlers -------------------------------- */

  const chooseCurrency = (next: Currency) => {
    if (busy || next === currency) return;
    setCurrency(next);
    setSelected(CURRENCIES[next].presets[DEFAULT_PRESET_INDEX]);
    setCustom('');
    setErrors((prev) => ({ ...prev, amount: undefined }));
  };

  const choosePreset = (value: number) => {
    setSelected(value);
    setCustom('');
    setErrors((prev) => ({ ...prev, amount: undefined }));
  };

  const onCustomChange = (raw: string) => {
    // Keep digits and a single decimal point only.
    let v = raw.replace(/[^\d.]/g, '');
    const firstDot = v.indexOf('.');
    if (firstDot !== -1) v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '');
    setCustom(v);
    setSelected('custom');
    setErrors((prev) => ({ ...prev, amount: undefined }));
  };

  const validateAmount = (): string | undefined => {
    if (selected === 'custom' && custom.trim() === '') return 'Enter an amount or pick one above.';
    if (!Number.isFinite(amount)) return 'Enter a valid amount, for example 25 or 25.50.';
    if (amount < cfg.min || amount > cfg.max) {
      return `Enter an amount between ${formatMoney(cfg.min, currency)} and ${formatMoney(cfg.max, currency)}.`;
    }
    return undefined;
  };

  const validateDetails = (): Errors => {
    const e: Errors = {};
    if (!name.trim()) e.name = 'Enter your full name.';
    if (!EMAIL_RE.test(email.trim())) e.email = 'Enter a valid email address.';
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (busy) return;
    setFormError('');

    // Step 1 → validate the gift, then move on to the donor's details.
    if (step === 1) {
      const amountError = validateAmount();
      setErrors(amountError ? { amount: amountError } : {});
      if (!amountError) setStep(2);
      return;
    }

    // Step 2 → validate everything, then initialise the payment.
    const amountError = validateAmount();
    if (amountError) {
      setErrors({ amount: amountError });
      setStep(1);
      return;
    }
    const detailErrors = validateDetails();
    setErrors(detailErrors);
    if (Object.keys(detailErrors).length > 0) return;

    setPhase('initializing');
    try {
      const res = await fetch('/api/donations/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          amount,
          currency,
          reason: reason.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success && isPaystackUrl(data.authorizationUrl)) {
        setPhase('redirecting');
        // Real navigation to Paystack checkout (not the /donate/result callback).
        window.location.href = data.authorizationUrl;
        return;
      }

      if (data.errors) {
        setErrors(data.errors);
        if (data.errors.amount) setStep(1);
      }
      setFormError(
        data.message ||
          data.error ||
          (res.ok
            ? 'We could not open the payment page. Please try again.'
            : 'We could not start your donation. Please try again.')
      );
    } catch {
      setFormError('Network error. Check your connection and try again.');
    }
    setPhase('idle');
  };

  /* ------------------------------ styles --------------------------------- */

  const inputClass =
    'h-11 rounded-xl border-gray-300 bg-gray-50 focus:border-primary focus:ring-primary';
  const labelClass = 'mb-1.5 block text-sm font-semibold text-secondary';

  /* ------------------------------ render --------------------------------- */

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogOverlay className="bg-black/50 backdrop-blur-sm" />
      <DialogContent
        // [&>button] recolours shadcn's built-in close icon so it is visible on the dark header.
        className="flex max-h-[92vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl sm:max-w-[480px] [&>button]:text-white [&>button]:opacity-80 [&>button:hover]:opacity-100"
      >
        {/* ---------- Header ---------- */}
        <DialogHeader className="space-y-1.5 bg-secondary px-6 pb-5 pt-6 text-left text-white sm:px-8">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Lock className="h-4 w-4" aria-hidden="true" />
            <span>Secure donation</span>
          </div>
          <DialogTitle className="text-2xl font-bold text-white sm:text-[1.7rem]">
            Donate to SHEMA
          </DialogTitle>
          <DialogDescription className="text-sm text-white/85">
            Your gift supports SHEMA&apos;s humanitarian work.
          </DialogDescription>
        </DialogHeader>

        {/* ---------- Body ---------- */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          {/* Progress: this really is a two-step sequence */}
          <div className="mb-6">
            <div className="mb-2 flex items-baseline justify-between text-sm">
              <span className="font-semibold text-secondary">
                {step === 1 ? 'Your gift' : 'Your details'}
              </span>
              <span className="text-gray-500">Step {step} of 2</span>
            </div>
            <div className="flex gap-1.5" aria-hidden="true">
              <div className="h-1.5 flex-1 rounded-full bg-primary" />
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  step === 2 ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {step === 1 && (
              <>
                {/* Currency */}
                <div>
                  <span id="currency-label" className={labelClass}>
                    Currency
                  </span>
                  <div
                    role="radiogroup"
                    aria-labelledby="currency-label"
                    className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1"
                  >
                    {(Object.keys(CURRENCIES) as Currency[]).map((c) => {
                      const active = c === currency;
                      return (
                        <button
                          key={c}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          disabled={busy}
                          onClick={() => chooseCurrency(c)}
                          className={`h-10 rounded-lg text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            active
                              ? 'bg-white font-semibold text-secondary shadow-sm'
                              : 'text-gray-500 hover:text-secondary'
                          }`}
                        >
                          <span className="mr-1.5">{CURRENCIES[c].symbol}</span>
                          {CURRENCIES[c].name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <span id="amount-label" className={labelClass}>
                    Amount
                  </span>
                  <div
                    role="radiogroup"
                    aria-labelledby="amount-label"
                    className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                  >
                    {cfg.presets.map((v) => {
                      const active = selected === v;
                      return (
                        <button
                          key={`${currency}-${v}`}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          disabled={busy}
                          onClick={() => choosePreset(v)}
                          className={`relative flex h-12 items-center justify-center rounded-xl border-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            active
                              ? 'border-primary bg-primary/5 text-secondary'
                              : 'border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {active && (
                            <Check
                              className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-primary"
                              aria-hidden="true"
                            />
                          )}
                          {formatMoney(v, currency)}
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative mt-3">
                    <span
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500"
                      aria-hidden="true"
                    >
                      {cfg.symbol}
                    </span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={custom}
                      onChange={(e) => onCustomChange(e.target.value)}
                      onFocus={() => setSelected('custom')}
                      placeholder="Other amount"
                      aria-label={`Other amount in ${cfg.name}`}
                      aria-invalid={!!errors.amount}
                      disabled={busy}
                      className={`${inputClass} pl-9 ${
                        selected === 'custom' ? 'border-primary ring-1 ring-primary' : ''
                      }`}
                    />
                  </div>
                  {errors.amount && (
                    <p role="alert" className="mt-1.5 text-sm text-red-600">
                      {errors.amount}
                    </p>
                  )}
                  {currency === 'USD' && (
                    <p className="mt-2 text-xs text-gray-500">
                      International cards are accepted for dollar donations.
                    </p>
                  )}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                {/* Gift summary */}
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <div>
                    <p className="text-xs text-gray-500">Your gift</p>
                    <p className="text-xl font-bold text-secondary">
                      {amountReady ? formatMoney(amount, currency) : '—'}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setStep(1)}
                    className="rounded-md px-2 py-1 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <label htmlFor="donor-name" className={labelClass}>
                    Full name <span className="text-primary">*</span>
                  </label>
                  <Input
                    id="donor-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    autoComplete="name"
                    autoFocus
                    disabled={busy}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'donor-name-error' : undefined}
                    className={inputClass}
                  />
                  {errors.name && (
                    <p id="donor-name-error" className="mt-1 text-sm text-red-600">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="donor-email" className={labelClass}>
                    Email address <span className="text-primary">*</span>
                  </label>
                  <Input
                    id="donor-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={busy}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'donor-email-error' : undefined}
                    className={inputClass}
                  />
                  {errors.email && (
                    <p id="donor-email-error" className="mt-1 text-sm text-red-600">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="donor-reason" className={labelClass}>
                    Why are you supporting SHEMA?{' '}
                    <span className="font-normal text-gray-500">(optional)</span>
                  </label>
                  <Textarea
                    id="donor-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Share a few words with us"
                    maxLength={500}
                    disabled={busy}
                    className="min-h-[84px] resize-none rounded-xl border-gray-300 bg-gray-50 focus:border-primary focus:ring-primary"
                  />
                  {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason}</p>}
                </div>

                <div className="flex gap-3 rounded-xl bg-primary/5 p-3.5 text-sm text-gray-700">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <p>
                    You&apos;ll enter your card or bank details on Paystack&apos;s secure page. SHEMA
                    never sees or stores them.
                  </p>
                </div>
              </>
            )}

            {formError && (
              <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {formError}
              </p>
            )}

            <p role="status" aria-live="polite" className="sr-only">
              {phase === 'initializing' && 'Preparing secure checkout'}
              {phase === 'redirecting' && 'Redirecting to Paystack'}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              {step === 2 ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setStep(1)}
                  className="h-12 rounded-xl border-gray-300 px-4"
                  aria-label="Back to gift amount"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => onOpenChange(false)}
                  className="h-12 rounded-xl border-gray-300 px-5"
                >
                  Cancel
                </Button>
              )}

              <Button
                type="submit"
                disabled={busy || (step === 1 && !amountReady)}
                className="h-12 flex-1 rounded-xl bg-primary font-semibold text-white hover:bg-primary/90"
              >
                {busy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    {phase === 'initializing' ? 'Preparing secure checkout…' : 'Redirecting to Paystack…'}
                  </>
                ) : step === 1 ? (
                  'Continue'
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" aria-hidden="true" />
                    {amountReady ? `Donate ${formatMoney(amount, currency)}` : 'Donate'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* ---------- Trust bar (always visible) ---------- */}
        <div className="flex items-center justify-center gap-2 border-t border-gray-100 bg-gray-50 px-6 py-3 text-xs text-gray-600">
          <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Encrypted payment, processed by Paystack</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}