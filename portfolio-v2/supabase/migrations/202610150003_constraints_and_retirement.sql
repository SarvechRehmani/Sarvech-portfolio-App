-- Spring authentication is replaced by Supabase Auth. Content is untouched.
drop table if exists portfolio_api.refresh_tokens;
drop table if exists portfolio_api.admin_users;
create index if not exists events_created_at_idx on portfolio_api.events(created_at);
create index if not exists events_session_time_idx on portfolio_api.events(session_id,created_at);
create index if not exists messages_email_time_idx on portfolio_api.messages(lower(email),created_at);
create index if not exists history_created_at_idx on portfolio_api.content_history(created_at desc);
do $$ begin
if not exists(select 1 from pg_constraint where conrelid='portfolio_api.events'::regclass and conname='event_type_valid') then alter table portfolio_api.events add constraint event_type_valid check(type in ('visit','resume','project','social','message')); end if;
if not exists(select 1 from pg_constraint where conrelid='portfolio_api.events'::regclass and conname='event_device_valid') then alter table portfolio_api.events add constraint event_device_valid check(device in ('desktop','mobile','tablet')); end if;
if not exists(select 1 from pg_constraint where conrelid='portfolio_api.events'::regclass and conname='event_session_valid') then alter table portfolio_api.events add constraint event_session_valid check(length(session_id) between 16 and 80); end if;
if not exists(select 1 from pg_constraint where conrelid='portfolio_api.messages'::regclass and conname='message_nonempty') then alter table portfolio_api.messages add constraint message_nonempty check(length(trim(name))>0 and length(trim(message))>0); end if;
end $$;
-- New empty projects need a singleton even before importing their first profile.
insert into portfolio_api.site_state(id,created_at,updated_at,version,singleton,draft_updated_at)
select gen_random_uuid(),now(),now(),0,'site',now() where not exists(select 1 from portfolio_api.site_state where singleton='site');
notify pgrst,'reload schema';
