'use client';

import { useEffect, useState } from 'react';
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

const SUGGESTED = [1000, 5000, 10000, 20000];
const MIN = 100;
const MAX = 10_000_000;
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;

function isPaystackUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && u.hostname.endsWith('paystack.com');
  } catch {
    return false;
  }
}

type Errors = { name?: string; email?: string; amount?: string; reason?: string };
type Phase = 'idle' | 'initializing' | 'redirecting';

interface DonateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DonateModal({ open, onOpenChange }: DonateModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selected, setSelected] = useState<number | 'custom'>(5000);
  const [custom, setCustom] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [phase, setPhase] = useState<Phase>('idle');
  const [formError, setFormError] = useState('');

  // Pressing Back from Paystack restores this page from bfcache with the old busy state.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) setPhase('idle');
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  const busy = phase !== 'idle';
  const amount = selected === 'custom' ? Number(custom) : selected;

  const validate = (): Errors => {
    const e: Errors = {};
    if (!name.trim()) e.name = 'Please enter your full name.';
    if (!EMAIL_RE.test(email.trim())) e.email = 'Please enter a valid email address.';
    if (selected === 'custom' && (custom.trim() === '' || !Number.isFinite(amount))) {
      e.amount = 'Please enter a valid amount.';
    } else if (!(amount > 0)) {
      e.amount = 'Amount must be greater than zero.';
    } else if (amount < MIN || amount > MAX) {
      e.amount = `Enter an amount between ₦${MIN.toLocaleString('en-NG')} and ₦${MAX.toLocaleString('en-NG')}.`;
    }
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (busy) return;
    setFormError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setPhase('initializing');
    try {
      const res = await fetch('/api/donations/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), amount, reason: reason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      // Temporary diagnostics: safe fields only.
      console.log('Donation initialization response:', {
        status: res.status,
        success: data.success,
        hasAuthorizationUrl: Boolean(data.authorizationUrl),
        reference: data.reference,
      });
      if (res.ok && data.success && isPaystackUrl(data.authorizationUrl)) {
        setPhase('redirecting');
        // Real navigation to Paystack checkout (not the /donate/result callback).
        window.location.href = data.authorizationUrl;
        return;
      }
      if (data.errors) setErrors(data.errors);
      setFormError(
        data.message ||
          data.error ||
          (res.ok
            ? 'Payment page was not returned. Please try again.'
            : 'Unable to initialize donation payment')
      );
    } catch {
      setFormError('Network error. Please check your connection and try again.');
    }
    setPhase('idle');
  };

  const inputClass =
    'border-gray-300 focus:border-primary focus:ring-primary bg-gray-50 h-11 rounded-lg';

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogOverlay className="bg-white/10 backdrop-blur-lg" />
      <DialogContent className="sm:max-w-[500px] bg-white shadow-2xl rounded-2xl border-0 p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="bg-gradient-to-r from-secondary to-secondary/80 p-6 sm:p-8 text-white rounded-t-2xl space-y-2 border-0">
          <DialogTitle className="text-2xl sm:text-3xl font-bold text-white">
            Donate to SHEMA
          </DialogTitle>
          <DialogDescription className="text-white/90 text-base">
            Your gift supports SHEMA&apos;s humanitarian work. Payments are processed securely by Paystack.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="donor-name" className="block text-sm font-semibold text-secondary mb-2">
                Full Name <span className="text-primary">*</span>
              </label>
              <Input
                id="donor-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                disabled={busy}
                aria-invalid={!!errors.name}
                className={inputClass}
              />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="donor-email" className="block text-sm font-semibold text-secondary mb-2">
                Email Address <span className="text-primary">*</span>
              </label>
              <Input
                id="donor-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                disabled={busy}
                aria-invalid={!!errors.email}
                className={inputClass}
              />
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
            </div>

            <div>
              <span className="block text-sm font-semibold text-secondary mb-2">
                Donation Amount (?) <span className="text-primary">*</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SUGGESTED.map((v) => (
                  <Button
                    key={v}
                    type="button"
                    disabled={busy}
                    variant={selected === v ? 'default' : 'outline'}
                    onClick={() => setSelected(v)}
                    className={selected === v ? 'bg-primary text-white' : 'border-gray-300'}
                  >
                    ₦{v.toLocaleString('en-NG')}
                  </Button>
                ))}
                <Button
                  type="button"
                  disabled={busy}
                  variant={selected === 'custom' ? 'default' : 'outline'}
                  onClick={() => setSelected('custom')}
                  className={selected === 'custom' ? 'bg-primary text-white' : 'border-gray-300'}
                >
                  Custom
                </Button>
              </div>
              {selected === 'custom' && (
                <Input
                  type="number"
                  inputMode="decimal"
                  min={MIN}
                  step="any"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  placeholder="Enter amount in naira"
                  aria-label="Custom donation amount in naira"
                  disabled={busy}
                  className={`${inputClass} mt-3`}
                />
              )}
              {errors.amount && <p className="text-sm text-red-600 mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label htmlFor="donor-reason" className="block text-sm font-semibold text-secondary mb-2">
                Why are you supporting Shema? (Optional)
              </label>
              <Textarea
                id="donor-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="I would like to support Shema's work because..."
                maxLength={500}
                disabled={busy}
                className="border-gray-300 focus:border-primary focus:ring-primary bg-gray-50 min-h-[90px] resize-none rounded-lg"
              />
              {errors.reason && <p className="text-sm text-red-600 mt-1">{errors.reason}</p>}
            </div>

            {formError && (
              <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
                {formError}
              </p>
            )}
            {busy && (
              <p role="status" className="text-sm text-foreground/70">
                {phase === 'initializing' ? 'Initializing payment...' : 'Redirecting to secure payment...'}
              </p>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => onOpenChange(false)}
                className="border-gray-300 hover:bg-primary"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={busy}
                className="bg-primary hover:bg-primary/90 text-white font-semibold px-6"
              >
                {busy
                  ? phase === 'initializing'
                    ? 'Initializing...'
                    : 'Redirecting...'
                  : `Donate${amount > 0 && Number.isFinite(amount) ? ` ₦${amount.toLocaleString('en-NG')}` : ''}`}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
