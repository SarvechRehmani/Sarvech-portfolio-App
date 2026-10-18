-- Rollback-only checks. No live email dispatch, publication or content edits.
begin;
do $$declare owner_id uuid;checks jsonb;asset record;usage jsonb;session_key text:=gen_random_uuid()::text;begin
select user_id into owner_id from portfolio_api.admins limit 1;
perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated','aal','aal2')::text,true);
checks:=public.portfolio_manage('health');
if not checks?'contact_enabled' or not checks?'unread_messages' or not checks?'unpublished' then raise exception 'Missing dashboard suggestions';end if;
for asset in select * from jsonb_array_elements(public.portfolio_studio('media')) loop
 if not asset.value?'usage' then raise exception 'Media usage missing';end if;
 if (asset.value->>'unused')::boolean and jsonb_array_length(asset.value->'usage')<>0 then raise exception 'Referenced media marked unused';end if;
end loop;
if public.portfolio_manage('geography','{"days":7}')->'countries' is null then raise exception 'Geography aggregate missing';end if;
perform set_config('request.jwt.claims','{"role":"service_role"}',true);
perform public.portfolio_visitor_event(jsonb_build_object('type','visit','label','/rollback-only','session_id',session_key,'device','desktop','referrer',''),'1.1.1.1');
if not exists(select 1 from portfolio_api.visitor_locations where session_id=session_key) then raise exception 'Visitor not captured';end if;
perform portfolio_api.mail_jobs('visitor_geo_result',jsonb_build_object('session_id',session_key,'city','Rollback city','country','Rollback country','country_code','XX'));
if not exists(select 1 from portfolio_api.visitor_locations where session_id=session_key and country='Rollback country') then raise exception 'Visitor lookup result missing';end if;
end $$;
set local role anon;
do $$begin
begin perform public.portfolio_manage('geography');raise exception 'Anon read allowed';exception when insufficient_privilege then null;end;
begin perform public.portfolio_visitor_event('{}','1.1.1.1');raise exception 'Anon IP injection allowed';exception when insufficient_privilege then null;end;
begin perform 1 from portfolio_api.visitor_locations;raise exception 'Anon table read allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
