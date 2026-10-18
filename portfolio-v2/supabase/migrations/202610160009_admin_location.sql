-- Owner-approved approximate admin-IP location lookup; never applied to visitor analytics.
alter table portfolio_api.site_state add column if not exists admin_geo_enabled boolean not null default true;
alter table portfolio_api.session_activity add column if not exists city text;
alter table portfolio_api.session_activity add column if not exists region text;
alter table portfolio_api.session_activity add column if not exists country text;
alter table portfolio_api.session_activity add column if not exists location_checked_at timestamptz;
do $$declare d text;begin
 d:=pg_get_functiondef('portfolio_api.manage(text,jsonb)'::regprocedure);
 d:=replace(d,'s.ip::text,s.user_agent','host(s.ip) as ip,s.city,s.region,s.country,s.location_checked_at,s.user_agent');
 if d not like '%when ''geo_settings''%' then d:=replace(d,'when ''health'' then', 'when ''geo_settings'' then return (select jsonb_build_object(''enabled'',admin_geo_enabled) from portfolio_api.site_state where singleton=''site'');
 when ''set_geo'' then update portfolio_api.site_state set admin_geo_enabled=(payload->>''enabled'')::boolean where singleton=''site'';return ''{}'';
 when ''health'' then');end if;execute d;
 d:=pg_get_functiondef('portfolio_api.mail_jobs(text,jsonb)'::regprocedure);
 if d not like '%when ''location_jobs''%' then d:=replace(d,'when ''ready'' then','when ''location_jobs'' then
 if not (select admin_geo_enabled from portfolio_api.site_state where singleton=''site'') then return ''[]'';end if;
 return (with picked as (select s.session_id from portfolio_api.session_activity s join portfolio_api.admins a on a.user_id=s.user_id where s.ip is not null and s.location_checked_at is null order by s.created_at desc limit 5 for update of s skip locked),marked as (update portfolio_api.session_activity s set location_checked_at=now() from picked where s.session_id=picked.session_id returning s.session_id,host(s.ip) as ip)select coalesce(jsonb_agg(jsonb_build_object(''id'',session_id,''ip'',ip)),''[]'')from marked);
 when ''geo_result'' then update portfolio_api.session_activity set city=left(payload->>''city'',120),region=left(payload->>''region'',120),country=left(payload->>''country'',100) where session_id=target;return ''{}'';
 when ''ready'' then');execute d;end if;
end $$;
notify pgrst,'reload schema';
