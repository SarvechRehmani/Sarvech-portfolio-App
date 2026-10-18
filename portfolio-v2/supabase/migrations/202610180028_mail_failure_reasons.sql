-- Only allowlisted classifications enter receipt history, never raw SMTP errors.
create or replace function portfolio_api.email_failure_reason(code text) returns text language sql immutable set search_path='' as $$select case code
 when 'smtp_auth' then 'Gmail rejected SMTP authentication. Check the Gmail App Password and account settings.'
 when 'smtp_timeout' then 'SMTP connection timed out. The provider did not confirm submission; check the sending account before retrying.'
 when 'smtp_network' then 'The SMTP server could not be reached. Check its host, port and network availability.'
 when 'smtp_recipient' then 'The SMTP server rejected the recipient address. Check the address before retrying.'
 when 'smtp_temporary' then 'The SMTP provider temporarily refused sending. Wait before retrying.'
 else 'SMTP sending failed. Review provider settings or request a fresh verification email.' end$$;
revoke all on function portfolio_api.email_failure_reason(text) from public,anon,authenticated;
do $$declare d text;begin
 d:=pg_get_functiondef('portfolio_api.email_worker(text,jsonb)'::regprocedure);
 d:=replace(d,'''SMTP sending failed. Review provider settings or request a fresh verification email.''','portfolio_api.email_failure_reason(payload->>''error_code'')');
 d:=replace(d,'''SMTP acknowledgement could not be recorded. Check Gmail Sent before retrying.''','case when payload->>''error_code''=''smtp_timeout'' then portfolio_api.email_failure_reason(''smtp_timeout'') else ''SMTP acknowledgement could not be recorded. Check Gmail Sent before retrying.'' end');
 execute d;
end $$;
-- Ambiguous SMTP outcomes must not be picked up by the automatic retry queue.
do $$declare name text;d text;begin foreach name in array array['portfolio_api.mail_jobs(text,jsonb)','portfolio_api.mail_work_due()'] loop
 d:=pg_get_functiondef(name::regprocedure);
 if d not like '%uncertain_receipt%' then
 d:=replace(d,'q.attempts<5 and not m.deleted','q.attempts<5 and not exists(select 1 from portfolio_api.email_history uncertain_receipt where uncertain_receipt.queue_id=q.id and uncertain_receipt.status=''unknown'') and not m.deleted');
 execute d;end if;
end loop;end $$;
notify pgrst,'reload schema';
