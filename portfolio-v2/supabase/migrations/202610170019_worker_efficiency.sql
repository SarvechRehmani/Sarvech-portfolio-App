-- Avoid idle Edge/SMTP calls. This does not disable or erase security logs.
create or replace function portfolio_api.mail_work_due() returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from portfolio_api.mail_queue q join portfolio_api.messages m on m.id=q.message_id
 where q.attempts<5 and not m.deleted and not m.is_spam and
 ((q.status in ('pending','failed') and (q.claimed_at is null or q.claimed_at<now()-make_interval(secs=>30*q.attempts)))
 or(q.status='sending' and q.claimed_at<now()-interval '10 minutes')))
 or exists(select 1 from portfolio_api.visitor_locations where country is null and ip is not null and attempts<3 and (checked_at is null or checked_at<now()-interval '1 hour'))
 or exists(select 1 from portfolio_api.session_activity s join portfolio_api.admins a on a.user_id=s.user_id where s.ip is not null and s.location_checked_at is null and (select admin_geo_enabled from portfolio_api.site_state where singleton='site'))
 or exists(select 1 from portfolio_api.site_state where singleton='site' and (mail_last_run is null or mail_last_run<now()-interval '30 minutes'));
$$;
revoke all on function portfolio_api.mail_work_due() from public,anon,authenticated;
create or replace function portfolio_api.dispatch_mail_queue() returns void language plpgsql security definer set search_path='' as $$
declare endpoint text;gateway text;begin
 if not portfolio_api.mail_work_due() then return;end if;
 -- Serialize wake-ups and coalesce simultaneous form submissions/cron runs.
 if not pg_try_advisory_xact_lock(hashtextextended('portfolio-worker-dispatch',0)) then return;end if;
 select mail_dispatch_url,mail_gateway_anon into endpoint,gateway from portfolio_api.site_state where singleton='site';
 if exists(select 1 from portfolio_api.site_state where singleton='site' and mail_last_run>now()-interval '30 seconds') then return;end if;
 if endpoint ~ '^https://[a-z0-9]+[.]supabase[.]co/functions/v1/portfolio-mail$' and gateway ~ '^eyJ[A-Za-z0-9_-]+[.][A-Za-z0-9_-]+[.][A-Za-z0-9_-]+$' then
 perform net.http_post(url:=endpoint,body:='{"action":"dispatch"}'::jsonb,headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||gateway),timeout_milliseconds:=5000);
 end if;
end $$;
revoke all on function portfolio_api.dispatch_mail_queue() from public,anon,authenticated;
-- Keep JSON as an RPC transport only; message fields already have separate columns.
do $$declare definition text;begin
 definition:=pg_get_functiondef('portfolio_api.mail_jobs(text,jsonb)'::regprocedure);
 if definition not like '%''sender_name''%' then
 definition:=replace(definition,'''kind'',j.kind,''to''','''kind'',j.kind,''sender_name'',j.name,''sender_email'',j.email,''message_subject'',j.message_subject,''message_body'',j.message,''to''');
 execute definition;
 end if;
end $$;
notify pgrst,'reload schema';
