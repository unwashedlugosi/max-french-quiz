-- Plain links (2026-11-01): Dave wants the app and the parent tracker to open from plain addresses,
-- with no key, PIN or login. This is a one-student app, so these functions always use Max's record.
create or replace function public.fr_load_max() returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object('state', state, 'updated_at', updated_at) from fr_state where room = 'max';
$$;

create or replace function public.fr_save_max(p_state jsonb, p_events jsonb) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare t timestamptz := now();
begin
  if octet_length(p_state::text) > 500000 then raise exception 'state too large'; end if;
  update fr_state set state = p_state, updated_at = t where room = 'max';
  insert into fr_events(room, at, item_id, lvl, ok, answer, expected, mode, session_id)
  select 'max', coalesce((e->>'at')::timestamptz, t), left(e->>'item_id', 60), (e->>'lvl')::int, (e->>'ok')::boolean,
         left(e->>'answer', 200), left(e->>'expected', 200), left(e->>'mode', 20), left(e->>'session_id', 40)
  from jsonb_array_elements(coalesce(p_events, '[]'::jsonb)) as e
  limit 200;
  return t;
end $$;

create or replace function public.fr_parent_max() returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'state', s.state, 'updated_at', s.updated_at,
    'events', coalesce((select jsonb_agg(to_jsonb(e) - 'room' - 'id' order by e.at desc)
                        from (select * from fr_events where room = s.room order by at desc limit 1500) e), '[]'::jsonb))
  from fr_state s where s.room = 'max';
$$;

revoke all on function public.fr_load_max(), public.fr_save_max(jsonb, jsonb), public.fr_parent_max() from public;
grant execute on function public.fr_load_max(), public.fr_save_max(jsonb, jsonb), public.fr_parent_max() to anon;

-- The old key-based functions are no longer used; turn them off.
revoke execute on function public.fr_load(text), public.fr_save(text, jsonb, jsonb), public.fr_parent(text) from anon;
