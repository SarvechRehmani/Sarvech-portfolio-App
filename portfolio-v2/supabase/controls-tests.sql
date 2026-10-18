-- All mutations and queued HTTP requests are rolled back. No emails are sent.
begin;
do $$declare owner_id uuid;current_session uuid;layout jsonb;test_link uuid;test_message uuid;claim jsonb;token uuid:=gen_random_uuid();social_url text;begin
select user_id into owner_id from portfolio_api.admins limit 1;
perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated','aal','aal2','session_id',token)::text,true);
perform public.portfolio_manage('contact_toggle','{"enabled":true}');
if public.portfolio_manage('counts')->>'projects' is null then raise exception 'Sidebar counts failed';end if;
perform public.portfolio_manage('health');perform public.portfolio_manage('activity');perform public.portfolio_manage('socials','{"days":7}');
layout:=public.portfolio_studio('layout');
perform public.portfolio_studio('save_layout',layout||'{"loader_enabled":false,"maintenance_enabled":true,"maintenance_title":"Rollback maintenance","maintenance_message":"Rollback-only message"}'::jsonb);
if public.portfolio_site()->'layout'->>'maintenance_title'='Rollback maintenance' then raise exception 'Draft setting leaked';end if;
perform public.portfolio_admin('publish');
if public.portfolio_site() ? 'projects' or public.portfolio_site()->'layout'->>'maintenance_title'<>'Rollback maintenance' or public.portfolio_blog()<>'[]'::jsonb then raise exception 'Maintenance leaked public content';end if;
perform public.portfolio_studio('save_layout',layout||'{"maintenance_enabled":false}'::jsonb);perform public.portfolio_admin('publish');
perform public.portfolio_manage('create_recruiter',jsonb_build_object('company','Rollback test','slug','rollback-'||replace(token::text,'-',''),'note','Private note'));
select id into test_link from portfolio_api.recruiter_links where slug='rollback-'||replace(token::text,'-','');
perform set_config('request.jwt.claims','{"role":"anon"}',true);
perform public.portfolio_event(jsonb_build_object('type','visit','label','/','session_id',token,'device','desktop','recruiter_ref','rollback-'||replace(token::text,'-','')));
perform public.portfolio_event(jsonb_build_object('type','resume','label','Resume download','session_id',token,'device','desktop','recruiter_ref','rollback-'||replace(token::text,'-','')));
perform public.portfolio_contact(jsonb_build_object('name','Rollback only','email','rollback@example.invalid','subject','Test only','message','This message will be rolled back.'));
select id into test_message from portfolio_api.messages where email='rollback@example.invalid' order by created_at desc limit 1;
if not exists(select 1 from portfolio_api.mail_queue where message_id=test_message and kind='notification' and status='pending') then raise exception 'Notification was not queued';end if;
perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated','aal','aal2','session_id',token)::text,true);
if not exists(select 1 from jsonb_array_elements(public.portfolio_manage('recruiters')) r where r->>'id'=test_link::text and (r->>'visits')::integer=1 and (r->>'resume')::integer=1 and r->>'note'='Private note') then raise exception 'Recruiter attribution failed';end if;
perform public.portfolio_manage('message_action',jsonb_build_object('ids',jsonb_build_array(test_message),'operation','spam'));
if not exists(select 1 from portfolio_api.messages where id=test_message and is_spam and not deleted) then raise exception 'Spam not preserved';end if;
perform public.portfolio_manage('message_action',jsonb_build_object('ids',jsonb_build_array(test_message),'operation','unspam'));
perform public.portfolio_manage('queue_reply',jsonb_build_object('id',test_message,'subject','Re: test only','body','Rollback reply only.'));
if exists(select 1 from portfolio_api.messages where id=test_message and replied_at is not null) then raise exception 'Unsent reply marked delivered';end if;
perform public.portfolio_manage('contact_toggle','{"enabled":false}');
begin perform public.portfolio_contact('{"name":"Blocked","email":"blocked@example.invalid","subject":"Blocked","message":"Blocked in rollback test"}');raise exception 'Closed contact accepted' using errcode='XX000';exception when raise_exception then null;end;
perform public.portfolio_manage('contact_toggle','{"enabled":true}');
insert into portfolio_api.session_activity(session_id,user_id,created_at,last_seen,ip,user_agent)values(token,owner_id,now(),now(),'192.0.2.10','Rollback device');
perform public.portfolio_manage('recognize_session',jsonb_build_object('id',token));
perform public.portfolio_manage('revoke_session',jsonb_build_object('id',token));
if public.portfolio_is_admin() then raise exception 'Revoked JWT still has admin access';end if;
end $$;
set local role anon;
do $$declare denied boolean:=false;begin
begin perform public.portfolio_manage('messages');exception when insufficient_privilege then denied:=true;end;if not denied then raise exception 'Anonymous inbox allowed';end if;
denied:=false;begin perform public.portfolio_mail_jobs('claim');exception when insufficient_privilege then denied:=true;end;if not denied then raise exception 'Anonymous mail worker allowed';end if;
end $$;
reset role;
select set_config('request.jwt.claims','{"role":"service_role"}',true);
set local role service_role;
do $$begin perform public.portfolio_mail_jobs('start');perform public.portfolio_mail_jobs('claim');end $$;
reset role;
rollback;

