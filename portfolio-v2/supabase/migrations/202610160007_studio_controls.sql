-- Published presentation controls, an inbox, recruiter attribution and private admin session activity.
alter table portfolio_api.layouts add column if not exists loader_enabled boolean not null default true;
alter table portfolio_api.layouts add column if not exists maintenance_enabled boolean not null default false;
alter table portfolio_api.layouts add column if not exists maintenance_title text not null default 'We will be right back.' check(length(maintenance_title) between 1 and 120);
alter table portfolio_api.layouts add column if not exists maintenance_message text not null default 'Abhi website par kaam chal raha hai. Kuch time baad wapas aaiyega. Tab tak khao, piyo aur enjoy karo 😆' check(length(maintenance_message)<=2000);
alter table portfolio_api.site_state add column if not exists contact_enabled boolean not null default true;
alter table portfolio_api.site_state add column if not exists mail_last_run timestamptz;
alter table portfolio_api.site_state add column if not exists mail_ready boolean not null default false;
alter table portfolio_api.messages add column if not exists is_spam boolean not null default false;
alter table portfolio_api.messages add column if not exists replied_at timestamptz;
create table if not exists portfolio_api.recruiter_links(id uuid primary key default gen_random_uuid(),company text not null check(length(company) between 1 and 120),slug text unique not null check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug)<=80),note text not null default '' check(length(note)<=500),created_at timestamptz not null default now());
alter table portfolio_api.events add column if not exists recruiter_id uuid references portfolio_api.recruiter_links(id) on delete set null;
create index if not exists events_recruiter_date on portfolio_api.events(recruiter_id,created_at);
create table if not exists portfolio_api.session_activity(session_id uuid primary key,user_id uuid not null,created_at timestamptz not null,last_seen timestamptz not null,ip inet,user_agent text,recognized boolean not null default false,revoked_at timestamptz);
create index if not exists session_activity_user on portfolio_api.session_activity(user_id,created_at desc);
create table if not exists portfolio_api.mail_queue(id uuid primary key default gen_random_uuid(),message_id uuid not null references portfolio_api.messages(id),kind text not null check(kind in ('notification','reply')),subject text not null check(length(subject) between 1 and 200),body text not null check(length(body)<=8000),status text not null default 'pending' check(status in ('pending','sending','sent','failed')),attempts integer not null default 0,created_at timestamptz not null default now(),claimed_at timestamptz,sent_at timestamptz,last_error text);
create unique index if not exists mail_notification_once on portfolio_api.mail_queue(message_id) where kind='notification';
do $$ declare t text; begin foreach t in array array['recruiter_links','session_activity','mail_queue'] loop
 execute format('alter table portfolio_api.%I enable row level security',t);
 execute format('revoke all on portfolio_api.%I from public,anon,authenticated',t);
 execute format('drop policy if exists admin_only on portfolio_api.%I',t);
 execute format('create policy admin_only on portfolio_api.%I for all to authenticated using (portfolio_api.is_admin()) with check (portfolio_api.is_admin())',t);
 end loop; end $$;
-- Revoke access immediately, including still-unexpired JWTs, without touching the owner's password.
create or replace function portfolio_api.is_admin() returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from portfolio_api.admins a where a.user_id=auth.uid())
and not exists(select 1 from portfolio_api.session_activity s where s.session_id::text=auth.jwt()->>'session_id' and s.revoked_at is not null)
and (coalesce(auth.jwt()->>'aal','aal1')='aal2' or not exists(select 1 from auth.mfa_factors f where f.user_id=auth.uid() and f.status='verified')) $$;
create or replace function portfolio_api.capture_admin_session() returns trigger language plpgsql security definer set search_path='' as $$ begin
if exists(select 1 from portfolio_api.admins where user_id=new.user_id) then
 insert into portfolio_api.session_activity(session_id,user_id,created_at,last_seen,ip,user_agent) values(new.id,new.user_id,new.created_at,coalesce(new.updated_at,new.created_at),new.ip,new.user_agent)
 on conflict(session_id) do update set last_seen=excluded.last_seen,ip=coalesce(excluded.ip,portfolio_api.session_activity.ip),user_agent=coalesce(excluded.user_agent,portfolio_api.session_activity.user_agent);
end if;return new;end $$;
drop trigger if exists portfolio_admin_session_audit on auth.sessions;
create trigger portfolio_admin_session_audit after insert or update of ip,user_agent,updated_at on auth.sessions for each row execute function portfolio_api.capture_admin_session();
insert into portfolio_api.session_activity(session_id,user_id,created_at,last_seen,ip,user_agent)
 select s.id,s.user_id,s.created_at,coalesce(s.updated_at,s.created_at),s.ip,s.user_agent from auth.sessions s join portfolio_api.admins a on a.user_id=s.user_id on conflict do nothing;
-- Preserve presentation settings through draft, history, backup and publish.
do $$ declare d text;begin
 d:=pg_get_functiondef('portfolio_api.layout_data(uuid)'::regprocedure);
 if d not like '%''loader_enabled''%' then d:=replace(d,'''default_mode'',l.default_mode','''loader_enabled'',l.loader_enabled,''maintenance_enabled'',l.maintenance_enabled,''maintenance_title'',l.maintenance_title,''maintenance_message'',l.maintenance_message,''contact_enabled'',(select contact_enabled from portfolio_api.site_state where singleton=''site''),''default_mode'',l.default_mode');execute d;end if;
 d:=pg_get_functiondef('portfolio_api.copy_layout(uuid,text)'::regprocedure);
 d:=replace(d,'layouts(revision_kind,theme_id,default_mode) select kind,theme_id,default_mode','layouts(revision_kind,theme_id,default_mode,loader_enabled,maintenance_enabled,maintenance_title,maintenance_message) select kind,theme_id,default_mode,loader_enabled,maintenance_enabled,maintenance_title,maintenance_message');execute d;
 d:=pg_get_functiondef('portfolio_api.rpc_studio(text,jsonb)'::regprocedure);
 if d not like '%loader_enabled=coalesce%' then d:=replace(d,'default_mode=coalesce(payload->>''default_mode'',''dark'')','default_mode=coalesce(payload->>''default_mode'',''dark''),loader_enabled=coalesce((payload->>''loader_enabled'')::boolean,loader_enabled),maintenance_enabled=coalesce((payload->>''maintenance_enabled'')::boolean,maintenance_enabled),maintenance_title=coalesce(nullif(payload->>''maintenance_title'',''''),maintenance_title),maintenance_message=coalesce(payload->>''maintenance_message'',maintenance_message)');execute d;end if;
 if d not like '%loader_enabled=coalesce%' then raise exception 'Layout settings patch failed';end if;
end $$;
-- Maintenance responses omit portfolio content, including public blog bodies.
do $$begin
 if to_regprocedure('portfolio_api.site_without_maintenance()') is null then alter function portfolio_api.rpc_site() rename to site_without_maintenance;end if;
 if to_regprocedure('portfolio_api.blog_without_maintenance(text)') is null then alter function portfolio_api.rpc_blog(text) rename to blog_without_maintenance;end if;
end $$;
create or replace function portfolio_api.rpc_site() returns jsonb language plpgsql stable security definer set search_path='' as $$declare s jsonb;begin
 s:=portfolio_api.site_without_maintenance();
 if coalesce((s->'layout'->>'maintenance_enabled')::boolean,false) then return jsonb_build_object('profile',jsonb_build_object('name',s->'profile'->>'name','email',s->'profile'->>'email','initial',s->'profile'->>'initial','website',s->'profile'->>'website'),'layout',s->'layout');end if;return s;end $$;
create or replace function portfolio_api.rpc_blog(post_slug text default null) returns jsonb language plpgsql stable security definer set search_path='' as $$ begin
if exists(select 1 from portfolio_api.layouts where revision_kind='LIVE' and maintenance_enabled) then return '[]';end if;return portfolio_api.blog_without_maintenance(post_slug);end $$;
-- Attribute only existing recruiter links. Unknown query parameters never create database rows.
do $$declare d text;begin
 d:=pg_get_functiondef('portfolio_api.rpc_event(jsonb)'::regprocedure);
 if d not like '%recruiter_id)%' then
 d:=replace(d,'type,label,session_id,referrer,device) values','type,label,session_id,referrer,device,recruiter_id) values');
 d:=replace(d,'payload->>''device''); end', 'payload->>''device'',(select id from portfolio_api.recruiter_links where slug=left(lower(payload->>''recruiter_ref''),80))); end');
 if d not like '%select id from portfolio_api.recruiter_links%' then raise exception 'Event attribution patch failed';end if;execute d;
 end if;end $$;
create or replace function portfolio_api.inbox_guard() returns trigger language plpgsql security definer set search_path='' as $$begin
 if not (select contact_enabled from portfolio_api.site_state where singleton='site') or exists(select 1 from portfolio_api.layouts where revision_kind='LIVE' and maintenance_enabled) then raise exception 'The contact form is temporarily unavailable. Please email the owner directly.';end if;return new;end $$;
drop trigger if exists portfolio_inbox_guard on portfolio_api.messages;
create trigger portfolio_inbox_guard before insert on portfolio_api.messages for each row execute function portfolio_api.inbox_guard();
create or replace function portfolio_api.queue_contact_notification() returns trigger language plpgsql security definer set search_path='' as $$begin
insert into portfolio_api.mail_queue(message_id,kind,subject,body) values(new.id,'notification',left('Portfolio message: '||new.subject,200),'') on conflict do nothing;return new;end $$;
drop trigger if exists portfolio_contact_notification on portfolio_api.messages;
create trigger portfolio_contact_notification after insert on portfolio_api.messages for each row execute function portfolio_api.queue_contact_notification();
-- Additional administrator commands; all return values come from named relational columns.
create or replace function portfolio_api.manage(action text,payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb:='{}';section text;target uuid:=nullif(payload->>'id','')::uuid; amount bigint;begin
perform portfolio_api.require_admin();
case action
when 'counts' then
 foreach section in array array['focus_items','jobs','projects','skill_groups','education','certificates','testimonials','blog_posts'] loop result:=result||jsonb_build_object(section,jsonb_array_length(portfolio_api.content_rows(section)));end loop;
 return result||jsonb_build_object('messages',(select count(*) from portfolio_api.messages where not deleted and not read and not is_spam),'recruiters',(select count(*) from portfolio_api.recruiter_links));
when 'messages' then return (select coalesce(jsonb_agg(to_jsonb(t) order by created_at desc),'[]') from (select id,name,email,subject,message,read as is_read,is_spam,replied_at,created_at from portfolio_api.messages where not deleted)t);
when 'contact_state' then return (select jsonb_build_object('enabled',contact_enabled,'mail_ready',mail_ready,'mail_last_run',mail_last_run,'pending',(select count(*) from portfolio_api.mail_queue where status in ('pending','sending')),'failed',(select count(*) from portfolio_api.mail_queue where status='failed')) from portfolio_api.site_state where singleton='site');
when 'contact_toggle' then update portfolio_api.site_state set contact_enabled=(payload->>'enabled')::boolean where singleton='site';return '{}';
when 'message_action' then
 if payload->>'operation' not in ('read','unread','spam','unspam','delete') then raise exception 'Unknown message action';end if;
 update portfolio_api.messages set read=case when payload->>'operation'='read' then true when payload->>'operation'='unread' then false else read end,is_spam=case when payload->>'operation'='spam' then true when payload->>'operation'='unspam' then false else is_spam end,deleted=case when payload->>'operation'='delete' then true else deleted end,updated_at=now(),version=version+1 where id in (select value::uuid from jsonb_array_elements_text(payload->'ids')) and not deleted;
 return '{}';
when 'queue_reply' then
 if length(trim(coalesce(payload->>'subject',''))) not between 1 and 200 or length(trim(coalesce(payload->>'body',''))) not between 1 and 8000 then raise exception 'Enter a subject and reply (maximum 8000 characters)';end if;
 if not exists(select 1 from portfolio_api.messages where id=target and not deleted and not is_spam) then raise exception 'Message unavailable';end if;
 if exists(select 1 from portfolio_api.mail_queue where message_id=target and kind='reply' and status in ('pending','sending') and created_at>now()-interval '5 minutes') then raise exception 'A reply is already queued for this message';end if;
 insert into portfolio_api.mail_queue(message_id,kind,subject,body)values(target,'reply',trim(payload->>'subject'),trim(payload->>'body'));return '{}';
when 'recruiters' then return (select coalesce(jsonb_agg(to_jsonb(t) order by created_at desc),'[]') from (select l.*,(select count(*) from portfolio_api.events e where e.recruiter_id=l.id and type='visit') visits,(select count(*) from portfolio_api.events e where e.recruiter_id=l.id and type='resume') resume,(select count(*) from portfolio_api.events e where e.recruiter_id=l.id and type='project') projects,(select count(*) from portfolio_api.events e where e.recruiter_id=l.id and type='message') messages,(select count(distinct label) from portfolio_api.events e where e.recruiter_id=l.id and type='visit') pages,(select max(e.created_at) from portfolio_api.events e where e.recruiter_id=l.id) last_seen from portfolio_api.recruiter_links l)t);
when 'create_recruiter' then insert into portfolio_api.recruiter_links(company,slug,note)values(trim(payload->>'company'),lower(trim(payload->>'slug')),coalesce(payload->>'note',''));return '{}';
when 'delete_recruiter' then delete from portfolio_api.recruiter_links where id=target;return '{}';
when 'activity' then return (select coalesce(jsonb_agg(to_jsonb(t) order by created_at desc),'[]') from (select s.session_id as id,s.created_at,s.last_seen,s.ip::text,s.user_agent,s.recognized,s.revoked_at,s.session_id::text=auth.jwt()->>'session_id' as current,exists(select 1 from auth.sessions a where a.id=s.session_id and (a.not_after is null or a.not_after>now())) and s.revoked_at is null as active from portfolio_api.session_activity s where s.user_id=auth.uid() order by created_at desc limit 100)t);
when 'recognize_session' then update portfolio_api.session_activity set recognized=true where session_id=target and user_id=auth.uid();return '{}';
when 'revoke_session' then
 update portfolio_api.session_activity set revoked_at=now() where session_id=target and user_id=auth.uid();
 if not found then raise exception 'Session not found';end if;
 delete from auth.refresh_tokens where session_id=target and user_id=auth.uid()::text;
 update auth.sessions set not_after=now() where id=target and user_id=auth.uid();return '{}';
when 'health' then return jsonb_build_object('mfa',exists(select 1 from auth.mfa_factors where user_id=auth.uid() and status='verified'),'linkedin',exists(select 1 from portfolio_api.profiles_socials s join portfolio_api.profiles p on p.id=s.profile_id where p.revision_kind='DRAFT' and s.url ilike '%linkedin.com%'),'unrecognized',(select count(*) from portfolio_api.session_activity where user_id=auth.uid() and not recognized and revoked_at is null and session_id::text<>coalesce(auth.jwt()->>'session_id','')),'mail_ready',(select mail_ready from portfolio_api.site_state where singleton='site'),'maintenance',exists(select 1 from portfolio_api.layouts where revision_kind='LIVE' and maintenance_enabled));
when 'socials' then
 return (select coalesce(jsonb_agg(to_jsonb(t) order by count desc,label),'[]') from (select coalesce(nullif(s.title,''),s.url) label,s.url url,(select count(*) from portfolio_api.events e where e.type='social' and e.label=s.url and e.created_at>=now()-make_interval(days=>case when (payload->>'days')::integer in (7,30,90) then (payload->>'days')::integer else 30 end)) count from portfolio_api.profiles_socials s join portfolio_api.profiles p on p.id=s.profile_id where p.revision_kind='LIVE')t);
else raise exception 'Unknown management command';end case;end $$;
create or replace function public.portfolio_manage(action text,payload jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select portfolio_api.manage(action,payload)$$;
revoke all on function portfolio_api.manage(text,jsonb),public.portfolio_manage(text,jsonb) from public,anon,authenticated;
grant execute on function portfolio_api.manage(text,jsonb),public.portfolio_manage(text,jsonb) to authenticated;
revoke all on function portfolio_api.site_without_maintenance(),portfolio_api.blog_without_maintenance(text),portfolio_api.capture_admin_session(),portfolio_api.inbox_guard(),portfolio_api.queue_contact_notification() from public,anon,authenticated;
grant execute on function portfolio_api.rpc_site(),portfolio_api.rpc_blog(text) to anon,authenticated;
notify pgrst,'reload schema';

