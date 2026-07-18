-- AI story generation: per-user settings (OpenRouter key + model) and a
-- private storage bucket for generated background scenes.

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  openrouter_api_key text,
  story_model text,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "user_settings_select_own"
  on public.user_settings for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_settings_insert_own"
  on public.user_settings for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_settings_update_own"
  on public.user_settings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_settings_delete_own"
  on public.user_settings for delete
  to authenticated
  using (auth.uid() = user_id);

-- Generated story backgrounds. Private: each user can only touch files inside
-- a folder named after their own user id ({uid}/scene-name.png).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('story-backgrounds', 'story-backgrounds', false, 8388608,
    array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "story_backgrounds_read_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'story-backgrounds' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "story_backgrounds_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'story-backgrounds' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "story_backgrounds_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'story-backgrounds' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "story_backgrounds_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'story-backgrounds' and (storage.foldername(name))[1] = auth.uid()::text);
