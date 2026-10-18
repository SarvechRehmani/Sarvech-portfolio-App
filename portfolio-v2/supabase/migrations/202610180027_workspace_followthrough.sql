-- Private workspace operations; JSON is transport only, never stored content.
alter table portfolio_api.messages add column if not exists labels text[] not null default '{}';
alter table portfolio_api.messages add column if not exists private_notes text not null default '' check(length(private_notes)<=4000);
alter table portfolio_api.messages add column if not exists follow_up_at timestamptz;
alter table portfolio_api.messages add column if not exists follow_up_done boolean not null default false;
alter table portfolio_api.mail_queue add column if not exists manual_retries integer not null default 0;
alter table portfolio_api.mail_queue add column if not exists last_manual_retry timestamptz;
create index if not exists messages_follow_up on portfolio_api.messages(follow_up_at) where not deleted and not is_spam and not follow_up_done;
create table if not exists portfolio_api.backup_checks(id uuid primary key default gen_random_uuid(),created_at timestamptz not null default now(),passed boolean not null,records integer not null,detail text not null);
alter table portfolio_api.backup_checks enable row level security;
revoke all on portfolio_api.backup_checks from public,anon,authenticated;
-- Include private follow-up fields in the existing checked inbox response.
do $$declare d text;begin
 d:=pg_get_functiondef('portfolio_api.manage(text,jsonb)'::regprocedure);
 if d not like '%created_at,labels%' then d:=replace(d,'read as is_read,is_spam,replied_at,created_at','read as is_read,is_spam,replied_at,created_at,labels,private_notes,follow_up_at,follow_up_done');end if;
 while d like '%,labels,private_notes,follow_up_at,follow_up_done,labels,private_notes,follow_up_at,follow_up_done%' loop d:=replace(d,',labels,private_notes,follow_up_at,follow_up_done,labels,private_notes,follow_up_at,follow_up_done',',labels,private_notes,follow_up_at,follow_up_done');end loop;
 execute d;
end $$;
create or replace function portfolio_api.workspace(action text,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare target uuid:=nullif(payload->>'id','')::uuid;item record;q portfolio_api.mail_queue;h portfolio_api.email_history;result jsonb;data jsonb;before_data jsonb;after_data jsonb;entry jsonb;section text;expected integer:=0;checked integer:=0;passed boolean:=true;detail text:='Restore rehearsal passed. All test changes rolled back.';labels_value text[];page_no integer:=greatest(1,least(10000,coalesce((payload->>'page')::int,1)));begin
 perform portfolio_api.require_admin();
 case action
 when 'attention' then
  return jsonb_build_object('email_failed',(select count(*) from portfolio_api.email_history where created_at>=now()-interval '30 days' and status='failed'),'email_uncertain',(select count(*) from portfolio_api.email_history where created_at>=now()-interval '30 days' and (status='unknown' or status='processing' and updated_at<now()-interval '5 minutes')),'mail_ready',(select mail_ready from portfolio_api.site_state where singleton='site'),'followups',(select count(*) from portfolio_api.messages where not deleted and not is_spam and not follow_up_done and follow_up_at<=now()),'upcoming',(select count(*) from portfolio_api.messages where not deleted and not is_spam and not follow_up_done and follow_up_at>now() and follow_up_at<=now()+interval '7 days'),'next_followup',(select min(follow_up_at) from portfolio_api.messages where not deleted and not is_spam and not follow_up_done and follow_up_at>now()),'backup',(select to_jsonb(b) from portfolio_api.backup_checks b order by created_at desc limit 1));
 when 'save_followup' then
  if not exists(select 1 from portfolio_api.messages where id=target and not deleted) then raise exception 'Message unavailable';end if;
  if jsonb_typeof(payload->'labels') is distinct from 'array' or jsonb_array_length(payload->'labels')>8 or length(coalesce(payload->>'notes',''))>4000 then raise exception 'Use up to 8 labels and 4000 characters of notes';end if;
  if exists(select 1 from jsonb_array_elements_text(payload->'labels') l where length(trim(l)) not between 1 and 32) then raise exception 'Labels must contain 1–32 characters';end if;
  select coalesce(array_agg(distinct trim(l)),'{}') into labels_value from jsonb_array_elements_text(payload->'labels') l;
  update portfolio_api.messages set labels=labels_value,private_notes=coalesce(payload->>'notes',''),follow_up_at=nullif(payload->>'at','')::timestamptz,follow_up_done=coalesce((payload->>'done')::boolean,false),updated_at=now(),version=version+1 where id=target;
  return '{}';
 when 'retry_email' then
  select * into h from portfolio_api.email_history where id=target for update;
  if h.id is null or h.source<>'contact' or h.status<>'failed' or h.queue_id is null then raise exception 'Only failed contact emails can be retried. Request a fresh security code for Auth emails.';end if;
  select * into q from portfolio_api.mail_queue where id=h.queue_id for update;
  if q.status<>'failed' or q.sent_at is not null or q.manual_retries>=3 or q.last_manual_retry>now()-interval '60 seconds' or not exists(select 1 from portfolio_api.messages where id=q.message_id and not deleted and not is_spam) then raise exception 'Retry unavailable: already sent/queued, cooldown, retry limit, or message unavailable';end if;
  update portfolio_api.mail_queue set status='pending',attempts=0,claimed_at=null,last_error=null,manual_retries=manual_retries+1,last_manual_retry=now() where id=q.id;
  perform portfolio_api.dispatch_mail_queue();
  return jsonb_build_object('queued',true,'remaining',2-q.manual_retries);
 when 'email_types' then
  return (select coalesce(jsonb_agg(to_jsonb(t) order by total desc,kind),'[]') from(select k.kind,count(email_count.id) total,count(email_count.id) filter(where email_count.status='accepted') accepted,count(email_count.id) filter(where email_count.status='failed') failed from (select distinct kind from (values ('recovery'),('email_change'),('password_changed_notification'),('magiclink'),('notification'),('reply')) defaults(kind) union select kind from portfolio_api.email_history where created_at>=now()-interval '30 days') k left join portfolio_api.email_history email_count on email_count.kind=k.kind and email_count.created_at>=now()-interval '30 days' group by k.kind)t);
 when 'journey' then
  if target is not null and not exists(select 1 from portfolio_api.recruiter_links where id=target) then raise exception 'Recruiter link unavailable';end if;
  with sessions as(select session_id,max(created_at) last_seen,count(*) activity from portfolio_api.events where created_at>=now()-interval '30 days' and (target is null or recruiter_id=target) group by session_id),picked as(select * from sessions order by last_seen desc,session_id offset (page_no-1)*10 limit 10)
  select jsonb_build_object('total',(select count(*) from sessions),'page',page_no,'items',coalesce((select jsonb_agg(jsonb_build_object('session',p.session_id,'last_seen',p.last_seen,'activity',p.activity,'location',(select concat_ws(', ',v.city,v.country) from portfolio_api.visitor_locations v where v.session_id=p.session_id),'device',(select e.device from portfolio_api.events e where e.session_id=p.session_id order by e.created_at desc limit 1),'events',(select coalesce(jsonb_agg(to_jsonb(e) order by e.created_at,e.id),'[]') from(select e.id,e.created_at,e.type,e.label,l.company from portfolio_api.events e left join portfolio_api.recruiter_links l on l.id=e.recruiter_id where e.session_id=p.session_id and e.created_at>=now()-interval '30 days' and (target is null or e.recruiter_id=target) order by e.created_at desc,e.id limit 100)e)) order by p.last_seen desc,p.session_id) from picked p),'[]')) into result;
  return result;
 when 'backup_check' then
  data:=case when payload ? 'backup' then payload->'backup' else public.portfolio_studio('backup') end;
  if coalesce(data->>'format','') not in ('portfolio-backup-v1','portfolio-backup-v2') or length(data::text)>10000000 then raise exception 'Choose a valid backup up to 10 MB';end if;
  perform pg_advisory_xact_lock(90210420);
  before_data:=public.portfolio_studio('backup')-'exported_at';
  begin
   result:=public.portfolio_studio('restore_backup',data);
   foreach section in array array['profile','focus_items','jobs','projects','skill_groups','education','certificates','testimonials','blog_posts'] loop
    if data ? section then
     for entry in select value from jsonb_array_elements(data->section) loop
      expected:=expected+1;
      if exists(select 1 from jsonb_array_elements(portfolio_api.content_rows(section)) actual where (actual->'data') @> (entry->'data') and coalesce((actual->>'position')::int,0)=coalesce((entry->>'position')::int,0)) then checked:=checked+1;end if;
     end loop;
    end if;
   end loop;
   after_data:=public.portfolio_studio('backup');
   if data ? 'layout' then passed:=passed and ((after_data->'layout')-array['id','version','theme_id','theme']) @> ((data->'layout')-array['id','version','theme_id','theme']);end if;
   if data ? 'themes' then for entry in select value from jsonb_array_elements(data->'themes') loop passed:=passed and exists(select 1 from jsonb_array_elements(after_data->'themes') a where a->>'name'=entry->>'name' and a->'dark'=entry->'dark' and a->'light'=entry->'light');end loop;end if;
   passed:=passed and expected>0 and checked=expected;
   if not passed then detail:='Restore completed, but some saved values did not round-trip exactly. Review before restoring.';end if;
   raise exception using errcode='PZ001',message='Rollback restore rehearsal';
  exception when sqlstate 'PZ001' then null;
   when others then passed:=false;detail:='Restore rehearsal failed: '||left(sqlerrm,240);
  end;
  if (public.portfolio_studio('backup')-'exported_at') is distinct from before_data then raise exception 'Restore rehearsal isolation check failed';end if;
  insert into portfolio_api.backup_checks(passed,records,detail)values(passed,checked,detail);
  return jsonb_build_object('passed',passed,'checked',checked,'expected',expected,'detail',detail,'checked_at',now(),'scope','Content, layout and palettes only. Uploaded bytes, messages and private workflow records are not restored.');
 when 'backup_checks' then return (select coalesce(jsonb_agg(to_jsonb(t) order by created_at desc),'[]') from(select * from portfolio_api.backup_checks order by created_at desc limit 5)t);
 else raise exception 'Unknown workspace action';end case;
end $$;
create or replace function public.portfolio_workspace(action text,payload jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select portfolio_api.workspace(action,payload)$$;
revoke all on function portfolio_api.workspace(text,jsonb),public.portfolio_workspace(text,jsonb) from public,anon,authenticated;
grant execute on function portfolio_api.workspace(text,jsonb),public.portfolio_workspace(text,jsonb) to authenticated;
-- Retain only 30 days of verification summaries, using the existing cleanup.
do $$declare d text;begin d:=pg_get_functiondef('portfolio_api.expire_history()'::regprocedure);if d not like '%delete from portfolio_api.backup_checks%' then d:=replace(d,'begin','begin delete from portfolio_api.backup_checks where created_at<now()-interval ''30 days'';');execute d;end if;end $$;
notify pgrst,'reload schema';
