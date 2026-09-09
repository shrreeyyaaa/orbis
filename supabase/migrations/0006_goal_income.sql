-- Goal income allocations + contribution ledger

create type public.allocation_mode as enum ('pct', 'fixed');

create table public.goal_income_allocations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  income_source_id uuid not null references public.income_sources(id) on delete cascade,
  mode public.allocation_mode not null default 'pct',
  value_bps int not null default 0,
  value_minor bigint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (goal_id, income_source_id)
);
create index goal_income_allocations_household_idx on public.goal_income_allocations(household_id);
create index goal_income_allocations_goal_idx on public.goal_income_allocations(goal_id);

create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  income_source_id uuid references public.income_sources(id) on delete set null,
  amount_minor bigint not null,
  currency text not null default 'USD' references public.currencies(code),
  applied_on date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);
create index goal_contributions_household_idx on public.goal_contributions(household_id);
create index goal_contributions_goal_idx on public.goal_contributions(goal_id);

alter table public.goal_income_allocations enable row level security;
alter table public.goal_contributions enable row level security;

create policy "goal_income_allocations_select" on public.goal_income_allocations
  for select using (public.is_household_member(household_id));
create policy "goal_income_allocations_modify" on public.goal_income_allocations
  for all using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

create policy "goal_contributions_select" on public.goal_contributions
  for select using (public.is_household_member(household_id));
create policy "goal_contributions_modify" on public.goal_contributions
  for all using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
