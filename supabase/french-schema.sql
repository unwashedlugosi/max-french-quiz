-- Max's French quiz (Unit 1, Leçon 1A). Additive and namespaced (fr_*): it does not touch other tables.
-- No logins: Max's link carries a student key, Dave's tracker link carries a parent key.
-- Tables have RLS on with no policies, so the browser can only go through the three functions below.

create table if not exists public.fr_state (
  room text primary key,
  student_key text not null unique,
  parent_key text not null unique,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.fr_events (
  id bigserial primary key,
  room text not null references public.fr_state(room),
  at timestamptz not null,
  item_id text not null,
  lvl int,
  ok boolean not null,
  answer text,
  expected text,
  mode text,
  session_id text
);
create index if not exists fr_events_room_at on public.fr_events(room, at desc);

alter table public.fr_state enable row level security;
alter table public.fr_events enable row level security;

create or replace function public.fr_load(p_key text) returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object('state', state, 'updated_at', updated_at) from fr_state where student_key = p_key;
$$;

create or replace function public.fr_save(p_key text, p_state jsonb, p_events jsonb) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare r text; t timestamptz := now();
begin
  select room into r from fr_state where student_key = p_key;
  if r is null then raise exception 'unknown key'; end if;
  if octet_length(p_state::text) > 500000 then raise exception 'state too large'; end if;
  update fr_state set state = p_state, updated_at = t where room = r;
  insert into fr_events(room, at, item_id, lvl, ok, answer, expected, mode, session_id)
  select r, coalesce((e->>'at')::timestamptz, t), left(e->>'item_id', 60), (e->>'lvl')::int, (e->>'ok')::boolean,
         left(e->>'answer', 200), left(e->>'expected', 200), left(e->>'mode', 20), left(e->>'session_id', 40)
  from jsonb_array_elements(coalesce(p_events, '[]'::jsonb)) as e
  limit 200;
  return t;
end $$;

create or replace function public.fr_parent(p_key text) returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'state', s.state, 'updated_at', s.updated_at,
    'events', coalesce((select jsonb_agg(to_jsonb(e) - 'room' - 'id' order by e.at desc)
                        from (select * from fr_events where room = s.room order by at desc limit 1500) e), '[]'::jsonb))
  from fr_state s where s.parent_key = p_key;
$$;

revoke all on function public.fr_load(text), public.fr_save(text, jsonb, jsonb), public.fr_parent(text) from public;
grant execute on function public.fr_load(text), public.fr_save(text, jsonb, jsonb), public.fr_parent(text) to anon;

-- The real keys are not kept in this public repo; the setup copy Dave ran has them.
insert into public.fr_state(room, student_key, parent_key)
values ('max', '<student key>', '<parent key>')
on conflict (room) do nothing;
