-- ============================================================
-- RaceBox - Auth + Admin Approval Schema (Supabase/Postgres)
-- Jalankan di Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Tabel profil pengguna
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'banned')),
  role text not null default 'user'
    check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  banned_at timestamptz
);

-- 2. Realtime untuk dashboard
alter table public.profiles replica identity full;

-- 3. Otomatis buat profile saat user daftar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Row Level Security
alter table public.profiles enable row level security;

-- Beri akses dasar ke role PostgREST. Tanpa grant ini, RLS policy tidak
-- akan  mem-filter apa pun karena role anon/authenticated tidak punya
-- privilege SELECT di tabel sama sekali -> hasilnya selalu 0 baris (tanpa error).
grant select on public.profiles to anon, authenticated;
grant update on public.profiles to authenticated;
grant insert on public.profiles to authenticated;

-- Helper admin: security definer -> menembus RLS (tanpa infinite recursion).
-- Fungsi ini membaca tabel profiles dari role postgres (bypass RLS).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.status = 'approved'
  );
$$;

-- User biasa: hanya bisa baca profile miliknya sendiri
create policy "users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Fallback: user bisa baca profile yang emailnya cocok dengan JWT-nya
-- (berguna jika baris profile dibuat manual dan id-nya tidak cocok dgn auth uid)
create policy "users read own profile by email"
  on public.profiles for select
  using (lower(auth.jwt() ->> 'email') = lower(email));

-- Admin: bisa baca semua profile (via security definer, tanpa recursion)
create policy "admin read all profiles"
  on public.profiles for select
  using (public.is_admin());

-- Admin: bisa update status/role profile mana pun
create policy "admin update profiles"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- 5. Cara menjadikan user pertama sebagai admin:
--    Setelah membuat akun via aplikasi, jalankan:
--    update public.profiles
--    set role = 'admin', status = 'approved', approved_at = now()
--    where email = 'EMAIL_ADMIN_KAMU@example.com';
