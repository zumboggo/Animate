create table if not exists public.character_tts_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  generation_count integer not null default 0 check (generation_count >= 0),
  primary key (user_id, usage_date)
);

alter table public.character_tts_usage enable row level security;
revoke all on table public.character_tts_usage from anon, authenticated;

create or replace function public.consume_character_tts_quota(
  p_user_id uuid,
  p_daily_limit integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  accepted boolean := false;
begin
  if p_user_id is null or p_daily_limit < 1 or p_daily_limit > 1000 then
    return false;
  end if;

  insert into public.character_tts_usage (user_id, usage_date, generation_count)
  values (p_user_id, current_date, 1)
  on conflict (user_id, usage_date) do update
    set generation_count = character_tts_usage.generation_count + 1
    where character_tts_usage.generation_count < p_daily_limit
  returning true into accepted;

  return coalesce(accepted, false);
end;
$$;

revoke all on function public.consume_character_tts_quota(uuid, integer) from public, anon, authenticated;
grant execute on function public.consume_character_tts_quota(uuid, integer) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('character-voice-references', 'character-voice-references', false, 5242880,
    array['audio/wav', 'audio/x-wav', 'audio/ogg']),
  ('character-voice-cache', 'character-voice-cache', false, 5242880,
    array['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/ogg'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- No storage.objects policies are created. Only the Edge Function's service
-- credential can read reference recordings or cached cloned speech.
