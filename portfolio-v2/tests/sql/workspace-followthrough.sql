begin;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select user_id from portfolio_api.admins limit 1),'role','authenticated','aal','aal2')::text,true);
do $$declare b jsonb;r jsonb;begin
 b:=public.portfolio_studio('backup')-'exported_at';
 r:=public.portfolio_workspace('backup_check');
 if not (r->>'passed')::boolean or (r->>'checked')::int=0 then raise exception 'Current backup rehearsal failed: %',r;end if;
 if public.portfolio_studio('backup')-'exported_at' is distinct from b then raise exception 'Rehearsal changed draft data';end if;
 r:=public.portfolio_workspace('backup_check','{"backup":{"format":"portfolio-backup-v2","projects":[{"data":{"title":""}}]}}');
 if (r->>'passed')::boolean then raise exception 'Invalid backup passed rehearsal';end if;
 if public.portfolio_studio('backup')-'exported_at' is distinct from b then raise exception 'Invalid restore rehearsal was not rolled back';end if;
end $$;
do $$declare m uuid;r jsonb;begin
 select id into m from portfolio_api.messages where not deleted limit 1;
 if m is null then raise exception 'Need a fixture message';end if;
 perform public.portfolio_workspace('save_followup',jsonb_build_object('id',m,'labels',jsonb_build_array('Rollback priority','Java role'),'notes','rollback-private-followup-token','at',now()-interval '1 minute','done',false));
 if not exists(select 1 from jsonb_array_elements(public.portfolio_manage('messages')) x where x->>'id'=m::text and x->>'private_notes'='rollback-private-followup-token') then raise exception 'Inbox metadata missing';end if;
 r:=public.portfolio_workspace('attention');if (r->>'followups')::int<1 then raise exception 'Due alert missing';end if;
 if public.portfolio_site()::text like '%rollback-private-followup-token%' then raise exception 'Private note leaked into public content';end if;
 perform public.portfolio_workspace('save_followup',jsonb_build_object('id',m,'labels',jsonb_build_array('Java role'),'notes','private','at',now()-interval '1 minute','done',true));
 if not (select follow_up_done from portfolio_api.messages where id=m) then raise exception 'Reminder completion failed';end if;
 begin perform public.portfolio_workspace('save_followup',jsonb_build_object('id',m,'labels',jsonb_build_array(repeat('a',33))));raise exception 'Overlong label accepted';exception when raise_exception then if sqlerrm='Overlong label accepted' then raise;end if;end;
end $$;
do $$declare link uuid:=gen_random_uuid();sid text:=gen_random_uuid()::text;r jsonb;begin
 insert into portfolio_api.recruiter_links(id,company,slug)values(link,'Rollback journey','rollback-journey-'||left(link::text,8));
 insert into portfolio_api.events(id,created_at,updated_at,version,device,label,session_id,type,recruiter_id)values
 (gen_random_uuid(),now()-interval '4 minutes',now(),0,'mobile','/recruiter',sid,'visit',link),
 (gen_random_uuid(),now()-interval '3 minutes',now(),0,'mobile','Project example',sid,'project',link),
 (gen_random_uuid(),now()-interval '2 minutes',now(),0,'mobile','Resume',sid,'resume',link),
 (gen_random_uuid(),now()-interval '1 minute',now(),0,'mobile','Contact',sid,'message',link);
 r:=public.portfolio_workspace('journey',jsonb_build_object('id',link));
 if (r->>'total')::int<>1 or jsonb_array_length(r->'items'->0->'events')<>4 or r->'items'->0->'events'->0->>'type'<>'visit' or r->'items'->0->'events'->3->>'type'<>'message' then raise exception 'Journey attribution or chronology failed';end if;
 if public.portfolio_workspace('journey',jsonb_build_object('id',link,'page',2))->'items'<>'[]'::jsonb then raise exception 'Journey pagination failed';end if;
end $$;
do $$declare h uuid;q uuid;begin
 select id,queue_id into h,q from portfolio_api.email_history where source='contact' and queue_id is not null limit 1;
 update portfolio_api.mail_queue set status='failed',sent_at=null,manual_retries=0,last_manual_retry=null where id=q;
 update portfolio_api.email_history set status='failed' where id=h;
 perform public.portfolio_workspace('retry_email',jsonb_build_object('id',h));
 if (select status from portfolio_api.mail_queue where id=q)<>'pending' or (select manual_retries from portfolio_api.mail_queue where id=q)<>1 then raise exception 'Retry did not queue exactly once';end if;
 begin perform public.portfolio_workspace('retry_email',jsonb_build_object('id',h));raise exception 'Duplicate retry accepted';exception when raise_exception then if sqlerrm='Duplicate retry accepted' then raise;end if;end;
 update portfolio_api.mail_queue set status='failed',manual_retries=3 where id=q;
 update portfolio_api.email_history set status='failed' where id=h;
 begin perform public.portfolio_workspace('retry_email',jsonb_build_object('id',h));raise exception 'Manual retry cap ignored';exception when raise_exception then if sqlerrm='Manual retry cap ignored' then raise;end if;end;
 update portfolio_api.email_history set status='unknown' where id=h;
 begin perform public.portfolio_workspace('retry_email',jsonb_build_object('id',h));raise exception 'Uncertain SMTP receipt resent';exception when raise_exception then if sqlerrm='Uncertain SMTP receipt resent' then raise;end if;end;
end $$;
do $$declare types jsonb;begin
 types:=public.portfolio_workspace('email_types');
 if not exists(select 1 from jsonb_array_elements(types) t where t->>'kind'='email_change') or not exists(select 1 from jsonb_array_elements(types) t where t->>'kind'='recovery') then raise exception 'Required email counters absent';end if;
end $$;
select set_config('request.jwt.claims','{"role":"service_role"}',true);
do $$declare q uuid;h uuid;r jsonb;begin
 select queue_id,id into q,h from portfolio_api.email_history where source='contact' and status='unknown' limit 1;
 r:=public.portfolio_mail_jobs('claim');
 if exists(select 1 from jsonb_array_elements(r) j where j->>'id'=q::text) then raise exception 'Uncertain email automatically claimed again';end if;
 select id into h from portfolio_api.email_history where source='auth' limit 1;
 if h is not null then
 perform public.portfolio_email_worker('failed',jsonb_build_object('id',h,'error_code','smtp_auth','raw_error','SECRET DO NOT STORE'));
 if (select last_error from portfolio_api.email_history where id=h) not like 'Gmail rejected%' or (select last_error from portfolio_api.email_history where id=h) like '%SECRET%' then raise exception 'Safe failure reason missing';end if;
 end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}',true);
do $$begin
 begin perform public.portfolio_workspace('attention');raise exception 'Non-admin could read private workspace';exception when insufficient_privilege then null;end;
 begin perform public.portfolio_backup_check();raise exception 'Non-admin could run backup rehearsal';exception when insufficient_privilege then null;end;
 begin perform public.portfolio_backup_restore('{}');raise exception 'Non-admin could restore backups';exception when insufficient_privilege then null;end;
end $$;
reset role;
do $$begin if has_function_privilege('anon','public.portfolio_workspace(text,jsonb)','execute') or has_function_privilege('anon','public.portfolio_backup_check(jsonb)','execute') or has_function_privilege('anon','public.portfolio_backup_restore(jsonb)','execute') or has_table_privilege('authenticated','portfolio_api.backup_checks','select') then raise exception 'Workspace data exposed';end if;end $$;
rollback;
