-- Supabase SQL Structure for Viwra Waitlist

create table public.waitlist (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  email text not null,
  phone text,
  form_fill_time_ms bigint,
  backspace_count integer default 0,
  is_altruistic boolean default false,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Optional: Set up Row Level Security (RLS)
alter table public.waitlist enable row level security;

-- Allow anonymous inserts (since it's a public waitlist form)
create policy "Allow anonymous inserts" on public.waitlist
  for insert
  with check (true);

-- Only authenticated users (admins) can view the waitlist
create policy "Allow authenticated selects" on public.waitlist
  for select
  using (auth.role() = 'authenticated');
