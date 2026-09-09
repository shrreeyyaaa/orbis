-- Financial events timeline for gamification + activity streaks

create type public.financial_event_kind as enum (
  'achievement',
  'goal_completed',
  'contribution',
  'milestone',
  'manual'
);

create table public.financial_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  kind public.financial_event_kind not null default 'manual',
  title text not null,
  occurred_on date not null default current_date,
  goal_id uuid references public.goals(id) on delete set null,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index financial_events_household_idx on public.financial_events(household_id);
create index financial_events_occurred_idx on public.financial_events(household_id, occurred_on desc);

alter table public.financial_events enable row level security;

create policy "financial_events_select" on public.financial_events
  for select using (public.is_household_member(household_id));
create policy "financial_events_modify" on public.financial_events
  for all using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
