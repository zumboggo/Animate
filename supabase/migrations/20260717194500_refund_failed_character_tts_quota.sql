create or replace function public.refund_character_tts_quota(p_user_id uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.character_tts_usage
  set generation_count = greatest(generation_count - 1, 0)
  where user_id = p_user_id and usage_date = current_date;
$$;

revoke all on function public.refund_character_tts_quota(uuid) from public, anon, authenticated;
grant execute on function public.refund_character_tts_quota(uuid) to service_role;
