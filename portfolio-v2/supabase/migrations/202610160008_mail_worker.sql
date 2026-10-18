-- Mail queue dispatch: only the server-side worker can claim/deliver jobs.
alter table portfolio_api.site_state add column if not exists mail_dispatch_url text not null default 'https://frvajnaukzkhcwzmarel.supabase.co/functions/v1/portfolio-mail';
create or replace function portfolio_api.mail_jobs(action text,payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb:='[]';j record;owner_email text;target uuid:=nullif(payload->>'id','')::uuid;begin
if auth.role() is distinct from 'service_role' then raise exception 'Server worker required' using errcode='42501';end if;
case action
when 'start' then update portfolio_api.site_state set mail_last_run=now() where singleton='site' and (mail_last_run is null or mail_last_run<now()-interval '30 seconds');return jsonb_build_object('run',found);
when 'ready' then update portfolio_api.site_state set mail_ready=coalesce((payload->>'ready')::boolean,false) where singleton='site';return '{}';
when 'claim' then
 select email into owner_email from portfolio_api.profiles where revision_kind='LIVE' limit 1;
 if owner_email is null then raise exception 'Publish an owner email first';end if;
 for j in with picked as (select q.id from portfolio_api.mail_queue q join portfolio_api.messages m on m.id=q.message_id where q.attempts<5 and not m.deleted and not m.is_spam and ((q.status in ('pending','failed') and (q.claimed_at is null or q.claimed_at<now()-make_interval(secs=>30*q.attempts))) or (q.status='sending' and q.claimed_at<now()-interval '10 minutes')) order by q.created_at limit 5 for update of q skip locked),claimed as (update portfolio_api.mail_queue q set status='sending',attempts=attempts+1,claimed_at=now() from picked where q.id=picked.id returning q.*) select c.*,m.name,m.email,m.subject as message_subject,m.message from claimed c join portfolio_api.messages m on m.id=c.message_id loop
 result:=result||jsonb_build_array(jsonb_build_object('id',j.id,'kind',j.kind,'to',case when j.kind='notification' then owner_email else j.email end,'reply_to',case when j.kind='notification' then j.email else owner_email end,'subject',j.subject,'text',case when j.kind='notification' then 'New portfolio message from '||j.name||E'\n'||j.email||E'\n\n'||j.message_subject||E'\n\n'||j.message else j.body end));end loop;return result;
when 'sent' then
 update portfolio_api.mail_queue set status='sent',sent_at=now(),last_error=null where id=target and status='sending';
 update portfolio_api.messages m set replied_at=now(),read=true where exists(select 1 from portfolio_api.mail_queue q where q.id=target and q.message_id=m.id and q.kind='reply' and q.status='sent');return '{}';
when 'failed' then update portfolio_api.mail_queue set status='failed',last_error=left(payload->>'error',500) where id=target and status='sending';return '{}';
else raise exception 'Unknown worker action';end case;end $$;
create or replace function public.portfolio_mail_jobs(action text,payload jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select portfolio_api.mail_jobs(action,payload)$$;
revoke all on function portfolio_api.mail_jobs(text,jsonb),public.portfolio_mail_jobs(text,jsonb) from public,anon,authenticated;
grant execute on function portfolio_api.mail_jobs(text,jsonb),public.portfolio_mail_jobs(text,jsonb) to service_role;
create extension if not exists pg_net with schema extensions;
create or replace function portfolio_api.dispatch_mail_queue() returns void language plpgsql security definer set search_path='' as $$declare endpoint text;begin
 select mail_dispatch_url into endpoint from portfolio_api.site_state where singleton='site';
 if endpoint ~ '^https://[a-z0-9]+[.]supabase[.]co/functions/v1/portfolio-mail$' then perform net.http_post(url:=endpoint,body:='{"action":"dispatch"}'::jsonb,headers:='{"Content-Type":"application/json"}'::jsonb,timeout_milliseconds:=5000);end if;
end $$;
create or replace function portfolio_api.wake_mail_worker() returns trigger language plpgsql security definer set search_path='' as $$begin perform portfolio_api.dispatch_mail_queue();return new;end $$;
drop trigger if exists portfolio_mail_worker on portfolio_api.mail_queue;
create trigger portfolio_mail_worker after insert on portfolio_api.mail_queue for each statement execute function portfolio_api.wake_mail_worker();
revoke all on function portfolio_api.dispatch_mail_queue(),portfolio_api.wake_mail_worker() from public,anon,authenticated;
do $$begin if not exists(select 1 from cron.job where jobname='portfolio-mail-dispatch') then perform cron.schedule('portfolio-mail-dispatch','* * * * *','select portfolio_api.dispatch_mail_queue()');end if;end $$;
notify pgrst,'reload schema';
grant usage on schema portfolio_api to service_role;
