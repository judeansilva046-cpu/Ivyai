-- BANCADA — schema inicial
-- Execute no SQL Editor do Supabase. Não edite este arquivo depois; crie novas migrations.

create extension if not exists "pgcrypto";

create table if not exists public.fichas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  dados jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fichas_user_id_idx on public.fichas (user_id);
create index if not exists fichas_updated_at_idx on public.fichas (updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists fichas_set_updated_at on public.fichas;
create trigger fichas_set_updated_at
before update on public.fichas
for each row
execute function public.set_updated_at();

alter table public.fichas enable row level security;

drop policy if exists "fichas_select_own" on public.fichas;
create policy "fichas_select_own"
on public.fichas for select
using (auth.uid() = user_id);

drop policy if exists "fichas_insert_own" on public.fichas;
create policy "fichas_insert_own"
on public.fichas for insert
with check (auth.uid() = user_id);

drop policy if exists "fichas_update_own" on public.fichas;
create policy "fichas_update_own"
on public.fichas for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "fichas_delete_own" on public.fichas;
create policy "fichas_delete_own"
on public.fichas for delete
using (auth.uid() = user_id);

-- Estrutura esperada de dados (jsonb):
-- {
--   "rendimento": number,
--   "unidade": string,
--   "validadeDias": number,
--   "conservacao": string,
--   "ingredientes": [
--     {
--       "nome": string,
--       "qtdCompra": number,
--       "unidadeCompra": "g"|"kg"|"ml"|"L"|"un",
--       "precoCompra": number,
--       "qtdUso": number,
--       "unidadeUso": "g"|"kg"|"ml"|"L"|"un"
--     }
--   ],
--   "preco": {
--     "embalagem": number,
--     "taxasPct": number,
--     "fixosPct": number,
--     "lucroPct": number
--   }
-- }
