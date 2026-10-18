-- Only explicit, admin-checked backup operations receive a longer API budget.
create or replace function public.portfolio_backup_check(payload jsonb default '{}') returns jsonb language sql security invoker set search_path='' set statement_timeout='45s' as $$select portfolio_api.workspace('backup_check',payload)$$;
create or replace function public.portfolio_backup_restore(payload jsonb) returns jsonb language sql security invoker set search_path='' set statement_timeout='45s' as $$select public.portfolio_studio('restore_backup',payload)$$;
revoke all on function public.portfolio_backup_check(jsonb),public.portfolio_backup_restore(jsonb) from public,anon,authenticated;
grant execute on function public.portfolio_backup_check(jsonb),public.portfolio_backup_restore(jsonb) to authenticated;
notify pgrst,'reload schema';
