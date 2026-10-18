-- Comprehensive Content Studio checks. Every change below is rolled back.
begin;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select user_id from portfolio_api.admins limit 1),'role','authenticated','aal','aal1')::text,true);
do $$ declare saved jsonb; restored jsonb; palette jsonb; colors jsonb; new_theme uuid; target uuid; test_change_id uuid; versions uuid[]; old_messages bigint; count_before bigint; h jsonb; rejected boolean:=false; begin
if not public.portfolio_is_admin() then raise exception 'Owner access failed';end if;
if (public.portfolio_studio('history','{"page":1,"size":5}')->'items') is null or jsonb_array_length(public.portfolio_studio('history','{"page":1,"size":5}')->'items')<>5 then raise exception 'History pagination failed';end if;
saved:=public.portfolio_studio('layout');palette:=public.portfolio_studio('themes')->0;
if jsonb_array_length(public.portfolio_studio('themes'))<3 then raise exception 'Built-in palettes missing';end if;
new_theme:=(public.portfolio_studio('import_theme',palette||'{"format":"portfolio-theme-v1","name":"Rollback palette"}'::jsonb)->>'id')::uuid;
begin perform public.portfolio_studio('import_theme',(palette||'{"format":"portfolio-theme-v1"}'::jsonb)||jsonb_build_object('dark',(palette->'dark')||'{"accent":"url(https://bad.example)"}'::jsonb));exception when raise_exception then rejected:=true;end;
if not rejected then raise exception 'Unsafe CSS accepted';end if;
select jsonb_agg(case when x.value->>'key'='about' then x.value||'{"enabled":false}'::jsonb else x.value end order by x.n desc) into colors from jsonb_array_elements(saved->'sections') with ordinality x(value,n);
restored:=public.portfolio_studio('save_layout',saved||jsonb_build_object('theme_id',new_theme,'sections',colors));
if public.portfolio_site()->'layout'->>'theme_id'=new_theme::text then raise exception 'Draft brand leaked';end if;
if restored->'sections'<>colors then raise exception 'Section order failed';end if;
select id,array[before_record_id,after_record_id] into test_change_id,versions from portfolio_api.content_history where section='layout' order by created_at desc limit 1;
perform public.portfolio_studio('restore_layout',jsonb_build_object('id',test_change_id));
if public.portfolio_studio('layout')->'sections'<>saved->'sections' then raise exception 'Layout restore failed';end if;
perform public.portfolio_studio('delete_history',jsonb_build_object('id',test_change_id));
if exists(select 1 from portfolio_api.content_history where id=test_change_id) or exists(select 1 from portfolio_api.layouts where id=any(versions)) then raise exception 'History versions were not purged';end if;
old_messages:=(select count(*) from portfolio_api.messages);
saved:=public.portfolio_studio('backup');if saved->>'format'<>'portfolio-backup-v2' or not saved ?& array['profile','projects','messages','themes','layout','media'] then raise exception 'Backup incomplete';end if;
count_before:=(select count(*) from portfolio_api.projects where revision_kind='DRAFT');
restored:=public.portfolio_studio('restore_backup',saved);
if (restored->>'restored')::integer<10 or old_messages<>(select count(*) from portfolio_api.messages) or count_before<>(select count(*) from portfolio_api.projects where revision_kind='DRAFT') then raise exception 'Backup merge failed';end if;
end $$;
-- Assert publication and scheduler independently of any open browser.
do $$ begin
perform public.portfolio_admin('publish');
perform public.portfolio_studio('schedule',jsonb_build_object('at',now()+interval '5 minutes'));
if (public.portfolio_studio('state')->>'scheduled_at') is null then raise exception 'Schedule missing';end if;
update portfolio_api.site_state set scheduled_at=now()-interval '1 minute' where singleton='site';
perform portfolio_api.run_scheduled_publish();
if (public.portfolio_studio('state')->>'scheduled_at') is not null then raise exception 'Scheduled publication did not run';end if;
if not exists(select 1 from cron.job where jobname='portfolio-publish-schedule' and active) then raise exception 'Database scheduler disabled';end if;
perform public.portfolio_studio('create_link',jsonb_build_object('token',repeat('a',64),'label','Rollback shared draft','hours',1));
end $$;
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
do $$ declare rejected boolean:=false; begin
if public.portfolio_shared_draft(repeat('a',64))->'profile' is null then raise exception 'Shared draft unavailable';end if;
begin perform public.portfolio_shared_draft(repeat('b',64));exception when insufficient_privilege then rejected:=true;end;if not rejected then raise exception 'Unknown link accepted';end if;
rejected:=false;begin perform public.portfolio_studio('backup');exception when insufficient_privilege then rejected:=true;end;if not rejected then raise exception 'Anonymous studio access allowed';end if;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select user_id from portfolio_api.admins limit 1),'role','authenticated','aal','aal1')::text,true);
do $$ declare target uuid;begin
select id into target from portfolio_api.draft_links where token_hash=encode(sha256(convert_to(repeat('a',64),'UTF8')),'hex');
perform public.portfolio_studio('revoke_link',jsonb_build_object('id',target));
end $$;
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
do $$ declare rejected boolean:=false;begin begin perform public.portfolio_shared_draft(repeat('a',64));exception when insufficient_privilege then rejected:=true;end;if not rejected then raise exception 'Revoked link still works';end if;end $$;
reset role;
rollback;


