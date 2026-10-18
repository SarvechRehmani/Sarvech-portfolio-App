begin;
-- Isolate disposable state changes inside this rollback-only transaction.
update portfolio_api.mail_queue set status='sent';
update portfolio_api.visitor_locations set checked_at=now(),country=coalesce(country,'Unknown');
update portfolio_api.session_activity set location_checked_at=now();
update portfolio_api.site_state set mail_last_run=now() where singleton='site';
do $$begin
 if portfolio_api.mail_work_due() then raise exception 'Idle queue incorrectly wakes worker';end if;
 if has_function_privilege('anon','portfolio_api.mail_work_due()','execute') or has_function_privilege('authenticated','portfolio_api.mail_work_due()','execute') then raise exception 'Private worker function is exposed';end if;
end $$;
update portfolio_api.site_state set mail_last_run=now()-interval '31 minutes' where singleton='site';
do $$begin if not portfolio_api.mail_work_due() then raise exception 'Health heartbeat missing';end if;end $$;
update portfolio_api.site_state set mail_last_run=now() where singleton='site';
update portfolio_api.mail_queue set status='pending',attempts=0,claimed_at=null where id=(select id from portfolio_api.mail_queue limit 1);
do $$begin
 if exists(select 1 from portfolio_api.mail_queue q join portfolio_api.messages m on m.id=q.message_id where q.status='pending' and not m.deleted and not m.is_spam) and not portfolio_api.mail_work_due() then raise exception 'Pending mail did not wake worker';end if;
 if position('''sender_name''' in pg_get_functiondef('portfolio_api.mail_jobs(text,jsonb)'::regprocedure))=0 then raise exception 'Structured email fields missing';end if;
end $$;
rollback;
