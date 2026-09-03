-- Business Ops App: core schema
-- Shares its Supabase project with Ben's Improvement App (same free-tier org
-- constraint), so this reuses that project's existing auth/approval system
-- rather than inventing a parallel one: public.is_approved() and the
-- app_users allowlist already exist from that app's access-control migration
-- and gate this app's tables the same way. Table/type names below were
-- checked against that project's existing schema for collisions — none.

-- This project already had leftover objects from the health app's earlier,
-- since-removed Clients-tab prototype (client_status, pay_recurrence, and
-- possibly a stale clients table) — cleared here per Ben's go-ahead so this
-- migration can define them fresh for this standalone app instead.
drop table if exists client_focuses cascade;
drop table if exists clients cascade;
drop table if exists past_clients cascade;
drop table if exists leads cascade;
drop table if exists employees cascade;
drop table if exists payment_overrides cascade;
drop type if exists client_status cascade;
drop type if exists pay_recurrence cascade;

create type client_status as enum ('starting', 'ongoing', 'closing');
create type pay_recurrence as enum ('monthly', 'biweekly', 'weekly', 'irregular');

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status client_status not null default 'starting',
  quarterly_goal text,
  pay_date date,
  pay_recurrence pay_recurrence not null default 'monthly',
  payment_method text,
  notes text,
  created_at timestamptz not null default now()
);

create table client_focuses (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  text text not null default '',
  done boolean not null default false,
  position int not null default 0
);

create table past_clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  last_worked_date date,
  notes text,
  created_at timestamptz not null default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  next_contact_date date,
  notes text,
  created_at timestamptz not null default now()
);

create table employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pay_amount numeric,
  pay_date date not null,
  pay_recurrence pay_recurrence not null default 'monthly',
  notes text,
  created_at timestamptz not null default now()
);

create table payment_overrides (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('client', 'employee')),
  source_id uuid not null,
  instance_date date not null,
  new_date date, -- null = this occurrence is skipped
  note text,
  unique (source_type, source_id, instance_date)
);

alter table clients enable row level security;
alter table client_focuses enable row level security;
alter table past_clients enable row level security;
alter table leads enable row level security;
alter table employees enable row level security;
alter table payment_overrides enable row level security;

create policy "approved users only" on clients for all to authenticated using (public.is_approved()) with check (public.is_approved());
create policy "approved users only" on client_focuses for all to authenticated using (public.is_approved()) with check (public.is_approved());
create policy "approved users only" on past_clients for all to authenticated using (public.is_approved()) with check (public.is_approved());
create policy "approved users only" on leads for all to authenticated using (public.is_approved()) with check (public.is_approved());
create policy "approved users only" on employees for all to authenticated using (public.is_approved()) with check (public.is_approved());
create policy "approved users only" on payment_overrides for all to authenticated using (public.is_approved()) with check (public.is_approved());

-- seed: the one employee that exists today
insert into employees (name, pay_amount, pay_date, pay_recurrence)
values ('Dalton', null, date_trunc('month', now())::date, 'monthly');
