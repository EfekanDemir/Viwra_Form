-- Supabase SQL Structure for Viwra Portal (The Void & First Circle)
-- Table: Viwra_Waitlist

create table public."Viwra_Waitlist" (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  email text not null,
  phone text,
  biometric_score numeric(5,2),   -- Örn: 96.40
  cognitive_state text,           -- Soruya verilen yanıt (ör. Prensibimdir, Sessizliğimdir vs.)
  mental_status text,             -- "Zihnindeki kaos" opsiyonel kelime
  form_fill_time_ms bigint,       -- Milisaniye cinsinden tamamlama süresi
  backspace_count integer,        -- Silme tuşu kullanım sayısı (kararsızlık ölçütü)
  is_altruistic boolean,          -- Empati testini geçenlerin boolean flag'ı
  status text default 'pending',  -- pending, approved vb.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) Opsiyonel Ayarları
alter table public."Viwra_Waitlist" enable row level security;

-- Açık başvuru formu olduğundan INSERT'e (herkes) izin verilir:
create policy "Allow anonymous inserts" on public."Viwra_Waitlist"
  for insert
  with check (true);

-- Verileri sadece yetkili kullanıcılar/adminler GÖREBİLİR:
create policy "Allow authenticated selects" on public."Viwra_Waitlist"
  for select
  using (auth.role() = 'authenticated');
