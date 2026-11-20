-- Apply in Supabase SQL editor or migration CLI. Backend service role only.
begin;
create table public.app_users (
 id uuid primary key default gen_random_uuid(),
 wallet text unique not null check (wallet ~ '^0x[0-9a-f]{40}$'),
 role text not null default 'customer' check (role in ('customer','staff','manager','finance','admin','owner')),
 created_at timestamptz not null default now()
);
create table public.auth_challenges (
 nonce text primary key, expires_at timestamptz not null
);
create table public.app_sessions (
 token_hash text primary key, user_id uuid not null references public.app_users(id) on delete cascade,
 expires_at timestamptz not null
);
create index app_sessions_user on public.app_sessions(user_id);
alter table public.app_users enable row level security;
alter table public.auth_challenges enable row level security;
alter table public.app_sessions enable row level security;
revoke all on public.app_users, public.auth_challenges, public.app_sessions from anon, authenticated;
grant select, insert, update, delete on public.app_users, public.auth_challenges, public.app_sessions to service_role;
create function public.complete_wallet_login(p_nonce text,p_wallet text,p_hash text)
returns uuid language plpgsql security invoker set search_path = public as $$
declare uid uuid;
begin
 delete from public.auth_challenges where nonce=p_nonce and expires_at>now();
 if not found then return null; end if;
 insert into public.app_users(wallet) values(p_wallet)
 on conflict(wallet) do update set wallet=excluded.wallet returning id into uid;
 insert into public.app_sessions(token_hash,user_id,expires_at) values(p_hash,uid,now()+interval '1 day');
 return uid;
end; $$;
revoke all on function public.complete_wallet_login(text,text,text) from public, anon, authenticated;
grant execute on function public.complete_wallet_login(text,text,text) to service_role;
commit;
