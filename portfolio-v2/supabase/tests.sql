-- Live acceptance test: all content/message/event mutations are rolled back.
begin;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select user_id from portfolio_api.admins limit 1),'role','authenticated')::text,true);
set local role authenticated;
do $$
declare a jsonb; b jsonb; h jsonb; ids jsonb; original jsonb; test_id uuid; expected bigint; rejected boolean:=false; section_name text; begin
if not public.portfolio_is_admin() then raise exception 'Owner membership failed'; end if;
original:=public.portfolio_site();
a:=public.portfolio_admin('save','certificates','{"data":{"title":"Rollback certificate","issuer":"Test","image":"","url":"","date":"2026"},"position":99}');
test_id:=(a->>'id')::uuid;
if exists(select 1 from jsonb_array_elements(public.portfolio_site()->'certificates') c where c->>'title'='Rollback certificate') then raise exception 'Draft leaked'; end if;
b:=public.portfolio_admin('save','certificates',jsonb_build_object('id',test_id,'data',(a->'data')||'{"title":"Updated rollback certificate"}'::jsonb,'position',99,'version',a->'version'));
begin perform public.portfolio_admin('save','certificates',jsonb_build_object('id',test_id,'data',a->'data','position',99,'version',a->'version')); exception when serialization_failure then rejected:=true; end;
if not rejected then raise exception 'Stale edit was accepted'; end if;
select jsonb_agg(r->>'id' order by (r->>'position')::integer desc) into ids from jsonb_array_elements(public.portfolio_admin('list','certificates')) r;
perform public.portfolio_admin('reorder','certificates',jsonb_build_object('ids',ids));
perform public.portfolio_admin('publish');
if not exists(select 1 from jsonb_array_elements(public.portfolio_site()->'certificates') c where c->>'title'='Updated rollback certificate') then raise exception 'Publish failed'; end if;
perform public.portfolio_admin('delete','certificates',jsonb_build_object('id',test_id));
select r into h from jsonb_array_elements(public.portfolio_admin('list','content_history')) r where r->>'operation'='DELETE' and r->>'table_name'='certificates' limit 1;
perform public.portfolio_admin('restore','',jsonb_build_object('id',h->>'id'));
if not exists(select 1 from jsonb_array_elements(public.portfolio_admin('list','certificates')) r where r->'data'->>'title'='Updated rollback certificate') then raise exception 'Restore failed'; end if;
-- Check every relational field and collection can round-trip unchanged.
foreach section_name in array array['profile','focus_items','jobs','projects','skill_groups','education','certificates','testimonials','blog_posts'] loop
for a in select value from jsonb_array_elements(public.portfolio_admin('list',section_name)) loop
b:=public.portfolio_admin('save',section_name,a);
if a->'data'<>b->'data' then raise exception '% fields/collections changed during round trip',section_name; end if; end loop; end loop;
perform public.portfolio_admin('save','blog_posts','{"data":{"title":"Rollback blog","content":"<p>Test</p>","tags":["Java"],"published":true},"position":99}');
if not exists(select 1 from jsonb_array_elements(public.portfolio_blog('rollback-blog')) p where p->'data'->>'title'='Rollback blog') then raise exception 'Blog publish switch failed'; end if;
if jsonb_array_length(public.portfolio_admin('analytics','', '{"days":30}')->'daily')<>30 then raise exception 'Analytics failed'; end if;
end $$;
reset role;
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
do $$ declare rejected boolean:=false; begin
begin perform public.portfolio_admin('draft'); exception when insufficient_privilege then rejected:=true; end;
if not rejected then raise exception 'Anonymous admin access allowed'; end if;
perform public.portfolio_contact('{"name":"Rollback test","email":"rollback-test@example.com","subject":"Test","message":"Test contact body"}');
perform public.portfolio_event('{"type":"visit","label":"/rollback-test","session_id":"rollback-session-123456","referrer":"","device":"desktop"}');
rejected:=false;
begin perform public.portfolio_event('{"type":"invalid","label":"x","session_id":"rollback-session-123456","device":"desktop"}'); exception when raise_exception then rejected:=true; end;
if not rejected then raise exception 'Invalid event accepted'; end if;
end $$;
reset role;
rollback;
