-- Email receipts contain template snapshots, never Auth OTPs or verification hashes.
create table if not exists portfolio_api.email_history(
 id uuid primary key default gen_random_uuid(),event_key text not null unique,
 queue_id uuid references portfolio_api.mail_queue(id) on delete set null,
 source text not null check(source in ('contact','auth')),kind text not null,
 recipient text not null,sender text,reply_to text,subject text not null,
 preview_html text,template_version text not null default 'legacy-reconstructed',
 status text not null check(status in ('queued','processing','accepted','failed','unknown')),
 attempts integer not null default 0,created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),accepted_at timestamptz,last_error text,
 provider_id text,redacted boolean not null default false
);
alter table portfolio_api.email_history enable row level security;
revoke all on portfolio_api.email_history from public,anon,authenticated;
create index if not exists email_history_recent on portfolio_api.email_history(created_at desc,id desc);
create or replace function portfolio_api.capture_email_queue() returns trigger language plpgsql security definer set search_path='' as $$declare m record;owner_address text;begin
 select name,email,subject,message into m from portfolio_api.messages where id=new.message_id;
 select email into owner_address from portfolio_api.profiles where revision_kind='LIVE' limit 1;
 insert into portfolio_api.email_history(event_key,queue_id,source,kind,recipient,reply_to,subject,status,attempts,created_at,accepted_at,last_error)
 values('queue:'||new.id,new.id,'contact',new.kind,coalesce(case when new.kind='notification' then owner_address else m.email end,''),case when new.kind='notification' then m.email else owner_address end,new.subject,case new.status when 'sent' then 'accepted' when 'sending' then 'processing' when 'pending' then 'queued' else 'failed' end,new.attempts,new.created_at,new.sent_at,new.last_error)
 on conflict(event_key) do update set status=excluded.status,attempts=excluded.attempts,updated_at=now(),accepted_at=excluded.accepted_at,last_error=excluded.last_error;
 return new;end $$;
revoke all on function portfolio_api.capture_email_queue() from public,anon,authenticated;
drop trigger if exists portfolio_email_receipt on portfolio_api.mail_queue;
create trigger portfolio_email_receipt after insert or update of status,attempts on portfolio_api.mail_queue for each row execute function portfolio_api.capture_email_queue();
-- Older receipts have no immutable HTML snapshot; their preview is explicitly labelled reconstructed.
insert into portfolio_api.email_history(event_key,queue_id,source,kind,recipient,reply_to,subject,status,attempts,created_at,accepted_at,last_error)
 select 'queue:'||q.id,q.id,'contact',q.kind,coalesce(case when q.kind='notification' then p.email else m.email end,''),case when q.kind='notification' then m.email else p.email end,q.subject,case q.status when 'sent' then 'accepted' when 'sending' then 'processing' when 'pending' then 'queued' else 'failed' end,q.attempts,q.created_at,q.sent_at,q.last_error
 from portfolio_api.mail_queue q join portfolio_api.messages m on m.id=q.message_id left join portfolio_api.profiles p on p.revision_kind='LIVE' where q.created_at>=now()-interval '30 days' on conflict(event_key) do nothing;
create or replace function portfolio_api.email_worker(action text,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$declare receipt portfolio_api.email_history;key text:=payload->>'event_key';begin
 if auth.role() is distinct from 'service_role' then raise exception 'Server worker required' using errcode='42501';end if;
 if action='prepare' then
 if length(coalesce(key,'')) not between 1 and 200 or length(coalesce(payload->>'html','')) not between 1 and 150000 then raise exception 'Invalid email receipt';end if;
 insert into portfolio_api.email_history(event_key,queue_id,source,kind,recipient,sender,reply_to,subject,preview_html,template_version,status,redacted,attempts)
 values(key,nullif(payload->>'queue_id','')::uuid,payload->>'source',payload->>'kind',left(payload->>'recipient',320),left(payload->>'sender',400),left(payload->>'reply_to',320),left(payload->>'subject',200),payload->>'html',payload->>'template_version','processing',coalesce((payload->>'redacted')::boolean,false),1)
 on conflict(event_key) do nothing returning * into receipt;
 if receipt.id is null then
 select * into receipt from portfolio_api.email_history where event_key=key for update;
 if receipt.status='accepted' then return jsonb_build_object('id',receipt.id,'send',false,'accepted',true);end if;
 if receipt.status='unknown' or receipt.source='auth' and receipt.status='processing' then return jsonb_build_object('id',receipt.id,'send',false,'accepted',false);end if;
 update portfolio_api.email_history set sender=payload->>'sender',recipient=payload->>'recipient',reply_to=payload->>'reply_to',preview_html=payload->>'html',template_version=payload->>'template_version',status='processing',attempts=greatest(attempts,coalesce((payload->>'attempts')::int,1)),updated_at=now(),last_error=null where id=receipt.id;
 end if;
 return jsonb_build_object('id',receipt.id,'send',true);
 elsif action in ('accepted','failed','unknown') then
 update portfolio_api.email_history set status=action,updated_at=now(),accepted_at=case when action='accepted' then now() else accepted_at end,last_error=case when action='accepted' then null else case when action='unknown' then 'SMTP acknowledgement could not be recorded. Check Gmail Sent before retrying.' else 'SMTP sending failed. Review provider settings or request a fresh verification email.' end end,provider_id=left(payload->>'provider_id',300) where id=(payload->>'id')::uuid;
 return '{}';
 else raise exception 'Unknown email worker action';end if;
end $$;
create or replace function public.portfolio_email_worker(action text,payload jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select portfolio_api.email_worker(action,payload)$$;
revoke all on function portfolio_api.email_worker(text,jsonb),public.portfolio_email_worker(text,jsonb) from public,anon,authenticated;
grant execute on function portfolio_api.email_worker(text,jsonb),public.portfolio_email_worker(text,jsonb) to service_role;
create or replace function portfolio_api.email_history_read(payload jsonb) returns jsonb language plpgsql stable security definer set search_path='' as $$declare target uuid:=nullif(payload->>'id','')::uuid;term text:=left(coalesce(payload->>'search',''),200);src text:=coalesce(payload->>'source','all');state text:=coalesce(payload->>'status','all');page_no int:=greatest(1,coalesce((payload->>'page')::int,1));amount int:=20;result jsonb;begin
 perform portfolio_api.require_admin();
 if target is not null then
 select to_jsonb(h)||jsonb_build_object('legacy_job',case when h.preview_html is null then jsonb_build_object('kind',q.kind,'sender_name',m.name,'sender_email',m.email,'message_subject',m.subject,'message_body',m.message,'text',q.body,'reply_to',h.reply_to,'subject',h.subject) else null end) into result from portfolio_api.email_history h left join portfolio_api.mail_queue q on q.id=h.queue_id left join portfolio_api.messages m on m.id=q.message_id where h.id=target and h.created_at>=now()-interval '30 days';
 if result is null then raise exception 'Email history item unavailable';end if;return result;
 end if;
 with filtered as(select h.* from portfolio_api.email_history h where created_at>=now()-interval '30 days' and (src='all' or source=src) and (state='all' or status=state or state='active' and status in ('queued','processing')) and (term='' or strpos(lower(recipient||' '||subject||' '||kind),lower(term))>0)),items as(select id,source,kind,recipient,sender,subject,status,attempts,created_at,accepted_at,last_error,redacted,template_version from filtered order by created_at desc,id desc offset (page_no-1)*amount limit amount)
 select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(i)) from items i),'[]'),'total',(select count(*) from filtered),'page',page_no,'size',amount,'stats',(select jsonb_build_object('total',count(*),'accepted',count(*) filter(where status='accepted'),'failed',count(*) filter(where status='failed'),'active',count(*) filter(where status in ('queued','processing')),'unknown',count(*) filter(where status='unknown')) from portfolio_api.email_history where created_at>=now()-interval '30 days')) into result;
 return result;
end $$;
create or replace function public.portfolio_email_history(payload jsonb default '{}') returns jsonb language sql stable security invoker set search_path='' as $$select portfolio_api.email_history_read(payload)$$;
revoke all on function portfolio_api.email_history_read(jsonb),public.portfolio_email_history(jsonb) from public,anon;
grant execute on function portfolio_api.email_history_read(jsonb),public.portfolio_email_history(jsonb) to authenticated;
-- Use the existing history-retention job; no new polling or Edge wakeups.
do $$declare definition text;begin
 definition:=pg_get_functiondef('portfolio_api.expire_history()'::regprocedure);
 if definition not like '%delete from portfolio_api.email_history%' then definition:=replace(definition,'begin','begin delete from portfolio_api.email_history where created_at<now()-interval ''30 days'';');execute definition;end if;
end $$;
notify pgrst,'reload schema';
