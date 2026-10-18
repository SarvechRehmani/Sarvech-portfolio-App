-- Public entry points are SECURITY INVOKER. Privileged implementations live in
-- the unexposed private schema, with their existing scope/admin/MFA checks intact.
do $$ declare f record; definition text; begin
for f in select p.oid,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef and p.proname in ('portfolio_is_admin','portfolio_site','portfolio_blog','portfolio_admin','portfolio_event','portfolio_contact','portfolio_shared_draft','portfolio_studio') loop
definition:=pg_get_functiondef(f.oid);
definition:=replace(definition,'FUNCTION public.'||f.proname||'(','FUNCTION portfolio_api.rpc_'||substr(f.proname,11)||'(');
execute definition;
end loop;end $$;

create or replace function public.portfolio_is_admin() returns boolean language sql stable security invoker set search_path='' as $$ select portfolio_api.rpc_is_admin() $$;
create or replace function public.portfolio_site() returns jsonb language sql stable security invoker set search_path='' as $$ select portfolio_api.rpc_site() $$;
create or replace function public.portfolio_blog(post_slug text default null) returns jsonb language sql stable security invoker set search_path='' as $$ select portfolio_api.rpc_blog(post_slug) $$;
create or replace function public.portfolio_admin(action text,section text default '',payload jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$ select portfolio_api.rpc_admin(action,section,payload) $$;
create or replace function public.portfolio_event(payload jsonb) returns void language sql security invoker set search_path='' as $$ select portfolio_api.rpc_event(payload) $$;
create or replace function public.portfolio_contact(payload jsonb) returns void language sql security invoker set search_path='' as $$ select portfolio_api.rpc_contact(payload) $$;
create or replace function public.portfolio_shared_draft(token text) returns jsonb language sql security invoker set search_path='' as $$ select portfolio_api.rpc_shared_draft(token) $$;
create or replace function public.portfolio_studio(action text,payload jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$ select portfolio_api.rpc_studio(action,payload) $$;

-- Remove obsolete entry points from the pre-JPA implementation. No rows are removed.
do $$ declare f record;begin for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('is_admin','mark_draft','audit_content','build_snapshot','publish_site','restore_history','reorder_content','analytics_summary','submit_message') loop execute format('revoke all on function %s from public,anon,authenticated',f.signature);end loop;end $$;

revoke all on all functions in schema portfolio_api from public,anon,authenticated;
grant usage on schema portfolio_api to anon,authenticated;
grant execute on function portfolio_api.is_admin(),portfolio_api.can_delete_asset(text) to authenticated;
grant execute on function portfolio_api.rpc_is_admin(),portfolio_api.rpc_site(),portfolio_api.rpc_blog(text),portfolio_api.rpc_event(jsonb),portfolio_api.rpc_contact(jsonb),portfolio_api.rpc_shared_draft(text) to anon,authenticated;
grant execute on function portfolio_api.rpc_admin(text,text,jsonb),portfolio_api.rpc_studio(text,jsonb) to authenticated;
revoke all on function public.portfolio_is_admin(),public.portfolio_site(),public.portfolio_blog(text),public.portfolio_event(jsonb),public.portfolio_contact(jsonb),public.portfolio_shared_draft(text),public.portfolio_admin(text,text,jsonb),public.portfolio_studio(text,jsonb) from public,anon,authenticated;
grant execute on function public.portfolio_is_admin(),public.portfolio_site(),public.portfolio_blog(text),public.portfolio_event(jsonb),public.portfolio_contact(jsonb),public.portfolio_shared_draft(text) to anon,authenticated;
grant execute on function public.portfolio_admin(text,text,jsonb),public.portfolio_studio(text,jsonb) to authenticated;

-- Public object URLs remain readable; anonymous users cannot enumerate the bucket.
drop policy if exists portfolio_public_read on storage.objects;
drop policy if exists portfolio_admin_list on storage.objects;
create policy portfolio_admin_list on storage.objects for select to authenticated using(bucket_id='portfolio' and (select portfolio_api.is_admin()));
notify pgrst,'reload schema';
