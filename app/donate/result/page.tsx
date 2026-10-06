'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DonateModal } from '@/components/donate-modal';

type Donation = {
  reference: string;
  status: 'pending' | 'success' | 'failed' | 'abandoned';
  donorName: string;
  amount: number;
  currency: string;
  paidAt: string | null;
};
type State =
  | { kind: 'verifying' }
  | { kind: 'done'; donation: Donation }
  | { kind: 'error'; message: string; invalid?: boolean };

function Result() {
  const params = useSearchParams();
  const reference = params.get('reference') || params.get('trxref') || '';
  const cancelledHint = params.get('cancelled') === '1';
  const [state, setState] = useState<State>({ kind: 'verifying' });
  const [donateOpen, setDonateOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!reference) {
      setState({ kind: 'error', message: 'Invalid transaction reference.', invalid: true });
      return;
    }
    let active = true;
    setState({ kind: 'verifying' });
    fetch(`/api/donations/verify?reference=${encodeURIComponent(reference)}`, { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        if (res.ok && data.donation) setState({ kind: 'done', donation: data.donation });
        else
          setState({
            kind: 'error',
            message: data.error || 'We could not verify your payment right now.',
            invalid: res.status === 400 || res.status === 404,
          });
      })
      .catch(() => {
        if (active)
          setState({ kind: 'error', message: 'Network error. Please check your connection and try again.' });
      });
    return () => {
      active = false;
    };
  }, [reference, attempt]);

  let icon = '…';
  let title = 'Verifying payment...';
  let message = 'Please wait while we confirm your donation with Paystack.';
  let tone = 'text-secondary';
  let retry = false;
  let refreshable = false;

  if (state.kind === 'done') {
    const { status } = state.donation;
    if (status === 'success') {
      icon = '✓';
      title = 'Thank You for Supporting Shema';
      message =
        'Your donation has been successfully received. Your generosity helps us continue our work and support the people and communities we serve.';
      tone = 'text-primary';
    } else if (status === 'failed') {
      icon = '✕';
      title = "We couldn't confirm your donation yet";
      message = 'Your payment was not successful and you have not been charged. Please try again.';
      tone = 'text-red-600';
      retry = true;
    } else {
      icon = '!';
      title = cancelledHint ? 'Donation cancelled' : 'Payment not completed';
      message = cancelledHint
        ? 'You cancelled the payment. No charge was made.'
        : 'This payment was abandoned or is still pending. If you were charged, refresh in a moment; otherwise try again.';
      tone = 'text-amber-600';
      retry = true;
      refreshable = !cancelledHint && status === 'pending';
    }
  } else if (state.kind === 'error') {
    icon = '✕';
    title = state.invalid ? 'Invalid transaction' : 'Verification unavailable';
    message = state.message;
    tone = 'text-red-600';
    retry = true;
    refreshable = !state.invalid;
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8 text-center">
        <div className={`text-5xl mb-4 ${tone}`} aria-hidden>{icon}</div>
        <h1 className="text-2xl font-bold text-secondary mb-2" role="status">{title}</h1>
        <p className="text-foreground/70 leading-relaxed">{message}</p>
        {state.kind === 'done' && state.donation.status === 'success' && (
          <dl className="mt-6 text-sm text-left bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between gap-4"><dt className="text-foreground/60">Donor</dt><dd className="font-medium text-right">{state.donation.donorName}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-foreground/60">Amount</dt><dd className="font-medium">₦{state.donation.amount.toLocaleString('en-NG')}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-foreground/60">Status</dt><dd className="font-medium text-primary">Successful</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-foreground/60">Reference</dt><dd className="font-mono break-all text-right">{state.donation.reference}</dd></div>
          </dl>
        )}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          {refreshable && (
            <Button variant="outline" onClick={() => setAttempt((n) => n + 1)}>
              Check again
            </Button>
          )}
          {retry && (
            <Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => setDonateOpen(true)}>
              Return to donation
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
      <DonateModal open={donateOpen} onOpenChange={setDonateOpen} />
    </main>
  );
}

export default function DonateResultPage() {
  return (
    <Suspense fallback={null}>
      <Result />
    </Suspense>
  );
}
