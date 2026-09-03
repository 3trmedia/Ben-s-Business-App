-- Replaces the employees/payment_overrides pair with a single, direction-agnostic
-- payment_schedules concept covering both incoming (client) and outgoing (team)
-- recurring payments, editable entirely from the Payments Calendar itself rather
-- than needing a separate Clients-tab edit or a dedicated employees list.

drop table if exists payment_overrides cascade;
drop table if exists employees cascade;

create table payment_schedules (
  id uuid primary key default gen_random_uuid(),
  direction text not null check (direction in ('incoming', 'outgoing')),
  label text not null,
  amount numeric,
  client_id uuid references clients(id) on delete set null,
  anchor_date date not null,
  recurrence pay_recurrence not null default 'monthly',
  notes text,
  created_at timestamptz not null default now()
);

create table payment_schedule_overrides (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references payment_schedules(id) on delete cascade,
  instance_date date not null,
  new_date date, -- null = this occurrence is skipped
  new_amount numeric, -- null = use the schedule's normal amount
  note text,
  unique (schedule_id, instance_date)
);

alter table payment_schedules enable row level security;
alter table payment_schedule_overrides enable row level security;

create policy "approved users only" on payment_schedules for all to authenticated using (public.is_approved()) with check (public.is_approved());
create policy "approved users only" on payment_schedule_overrides for all to authenticated using (public.is_approved()) with check (public.is_approved());
