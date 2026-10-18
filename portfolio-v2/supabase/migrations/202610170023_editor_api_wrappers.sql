-- Keep privileged implementations in the unexposed schema, matching the existing API.
do $$declare name text;args text;definition text;begin
 for name,args in values ('portfolio_editor_review',''),('portfolio_save_layout_checked','jsonb,jsonb'),('portfolio_apply_review','text,text,timestamp with time zone'),('portfolio_schedule_notice','') loop
 if (select prosecdef from pg_proc where oid=to_regprocedure('public.'||name||'('||args||')')) then
 definition:=pg_get_functiondef(to_regprocedure('public.'||name||'('||args||')'));definition:=replace(definition,'FUNCTION public.'||name||'(','FUNCTION portfolio_api.'||name||'(');execute definition;end if;end loop;
end $$;
create or replace function public.portfolio_editor_review() returns jsonb language sql security invoker set search_path='' as $$select portfolio_api.portfolio_editor_review()$$;
create or replace function public.portfolio_save_layout_checked(expected jsonb,payload jsonb) returns jsonb language sql security invoker set search_path='' as $$select portfolio_api.portfolio_save_layout_checked(expected,payload)$$;
create or replace function public.portfolio_apply_review(action text,expected text,publish_at timestamptz default null) returns void language sql security invoker set search_path='' as $$select portfolio_api.portfolio_apply_review(action,expected,publish_at)$$;
create or replace function public.portfolio_schedule_notice() returns text language sql stable security invoker set search_path='' as $$select portfolio_api.portfolio_schedule_notice()$$;
revoke all on function portfolio_api.portfolio_editor_review(),portfolio_api.portfolio_save_layout_checked(jsonb,jsonb),portfolio_api.portfolio_apply_review(text,text,timestamptz),portfolio_api.portfolio_schedule_notice() from public,anon;
grant execute on function portfolio_api.portfolio_editor_review(),portfolio_api.portfolio_save_layout_checked(jsonb,jsonb),portfolio_api.portfolio_apply_review(text,text,timestamptz),portfolio_api.portfolio_schedule_notice() to authenticated;
notify pgrst,'reload schema';
