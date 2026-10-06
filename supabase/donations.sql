-- Donations recorded via Paystack. Only the server (service role) accesses this table.
-- Safe to re-run: creates the table if missing and adds any newer columns.
create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  donor_name text not null,
  donor_email text not null,
  amount_kobo bigint not null check (amount_kobo > 0),
  currency text not null default 'NGN',
  status text not null default 'pending'
    check (status in ('pending','success','failed','abandoned')),
  paystack_transaction_id text,
  paid_at timestamptz,
  verified boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.donations add column if not exists reason text;
alter table public.donations add column if not exists thank_you_email_sent boolean not null default false;
alter table public.donations add column if not exists thank_you_email_sent_at timestamptz;
alter table public.donations add column if not exists thank_you_email_claimed_at timestamptz;

alter table public.donations enable row level security;

-- Refresh the PostgREST schema cache so the API sees the table/columns immediately.
notify pgrst, 'reload schema';
