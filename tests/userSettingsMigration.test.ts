import { describe, expect, it } from 'vitest';
import migration from '../supabase/migrations/20260718090000_ai_story_generation.sql?raw';

describe('AI settings database migration', () => {
  it('creates a private authenticated-only user settings table', () => {
    expect(migration).toContain('create table if not exists public.user_settings');
    expect(migration).toContain('alter table public.user_settings enable row level security');
    expect(migration).toContain('revoke all on table public.user_settings from anon');
    expect(migration).toContain('grant select, insert, update, delete on table public.user_settings to authenticated');
  });

  it('restricts every operation to the signed-in owner and refreshes PostgREST', () => {
    expect(migration.match(/\(select auth\.uid\(\)\) = user_id/g)).toHaveLength(5);
    expect(migration).toContain("notify pgrst, 'reload schema'");
  });
});
