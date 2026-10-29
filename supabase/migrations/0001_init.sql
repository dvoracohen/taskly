-- Taskly 0001_init: categories + tasks, triggers, RLS.
-- Single-user app with no auth: the anon role gets full CRUD on these two tables only.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 50),
  color text not null default '#6B7280',
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  description text check (description is null or char_length(description) <= 2000),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  category_id uuid references public.categories (id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index tasks_status_due_date_idx on public.tasks (status, due_date);
create index tasks_category_id_idx on public.tasks (category_id);

-- ---------------------------------------------------------------------------
-- Trigger functions
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

-- completed_at is set when status becomes 'done' and cleared otherwise.
-- done -> done keeps the original timestamp.
create or replace function public.set_completed_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'done' then
    if tg_op = 'INSERT' or old.status is distinct from 'done' then
      new.completed_at := pg_catalog.now();
    end if;
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create trigger set_completed_at
  before insert or update of status on public.tasks
  for each row execute function public.set_completed_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.tasks enable row level security;

create policy "anon can select categories" on public.categories
  for select to anon using (true);
create policy "anon can insert categories" on public.categories
  for insert to anon with check (true);
create policy "anon can update categories" on public.categories
  for update to anon using (true) with check (true);
create policy "anon can delete categories" on public.categories
  for delete to anon using (true);

create policy "anon can select tasks" on public.tasks
  for select to anon using (true);
create policy "anon can insert tasks" on public.tasks
  for insert to anon with check (true);
create policy "anon can update tasks" on public.tasks
  for update to anon using (true) with check (true);
create policy "anon can delete tasks" on public.tasks
  for delete to anon using (true);

grant select, insert, update, delete on public.categories, public.tasks to anon;
