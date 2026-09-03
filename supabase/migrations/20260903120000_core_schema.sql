-- Business Ops App: core schema
-- Single-user app. RLS restricts every table to the owner's Google account
-- (checked against the JWT email claim) rather than a generic "any authenticated user"
-- check, since Supabase project-level access could otherwise be broadened later.

create or replace function is_owner() returns boolean as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'empowertherebel@gmail.com';
$$ language sql stable;

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

create policy "owner full access" on clients for all using (is_owner()) with check (is_owner());
create policy "owner full access" on client_focuses for all using (is_owner()) with check (is_owner());
create policy "owner full access" on past_clients for all using (is_owner()) with check (is_owner());
create policy "owner full access" on leads for all using (is_owner()) with check (is_owner());
create policy "owner full access" on employees for all using (is_owner()) with check (is_owner());
create policy "owner full access" on payment_overrides for all using (is_owner()) with check (is_owner());

-- seed: the one employee that exists today
insert into employees (name, pay_amount, pay_date, pay_recurrence)
values ('Dalton', null, date_trunc('month', now())::date + interval '0 day', 'monthly');
