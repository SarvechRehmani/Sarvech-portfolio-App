-- Owner-approved visitor analytics. Raw IP is private and expires after 30 days.
create table if not exists portfolio_api.visitor_locations(
 session_id varchar(80) primary key,ip inet,first_seen timestamptz not null default now(),last_seen timestamptz not null default now(),
 city varchar(120),region varchar(120),country varchar(100),country_code varchar(2),checked_at timestamptz,attempts integer not null default 0,
 check(length(session_id) between 16 and 80));
alter table portfolio_api.visitor_locations enable row level security;
revoke all on portfolio_api.visitor_locations from public,anon,authenticated;
create or replace function portfolio_api.visitor_event(payload jsonb,source_ip text) returns void language plpgsql security definer set search_path='' as $$
declare addr inet;begin
begin addr:=nullif(source_ip,'')::inet;exception when invalid_text_representation then addr:=null;end;
if addr is null or addr<<inet '127.0.0.0/8' or addr<<inet '10.0.0.0/8' or addr<<inet '172.16.0.0/12' or addr<<inet '192.168.0.0/16' or addr=inet '::1' then return;end if;
perform pg_advisory_xact_lock(hashtextextended(host(addr),1));
if(select count(*) from portfolio_api.events e join portfolio_api.visitor_locations v using(session_id) where v.ip=addr and e.created_at>now()-interval '1 hour')>=400 then return;end if;
perform portfolio_api.rpc_event(payload);
if not exists(select 1 from portfolio_api.events where session_id=payload->>'session_id') then return;end if;
insert into portfolio_api.visitor_locations(session_id,ip) values(payload->>'session_id',addr)
on conflict(session_id)do update set last_seen=now();
end $$;
create or replace function public.portfolio_visitor_event(payload jsonb,source_ip text)returns void language sql security invoker set search_path='' as $$select portfolio_api.visitor_event(payload,source_ip)$$;
revoke all on function portfolio_api.visitor_event(jsonb,text),public.portfolio_visitor_event(jsonb,text) from public,anon,authenticated;
grant execute on function portfolio_api.visitor_event(jsonb,text),public.portfolio_visitor_event(jsonb,text) to service_role;
do $$declare d text;begin
d:=pg_get_functiondef('portfolio_api.mail_jobs(text,jsonb)'::regprocedure);
d:=replace(d,'when ''location_jobs'' then', 'when ''visitor_location_jobs'' then
update portfolio_api.visitor_locations set ip=null where ip is not null and first_seen<now()-interval ''30 days'';
-- Reuse today''s lookup for repeat IPs without sending it again.
update portfolio_api.visitor_locations v set city=c.city,region=c.region,country=c.country,country_code=c.country_code,checked_at=now() from (select distinct on(ip) ip,city,region,country,country_code from portfolio_api.visitor_locations where country is not null and checked_at>now()-interval ''1 day'' order by ip,checked_at desc)c where v.ip=c.ip and v.country is null and v.checked_at is null;
if(select count(*) from portfolio_api.visitor_locations where checked_at>=current_date and attempts>0)>=500 then return ''[]'';end if;
with picked as(select session_id from portfolio_api.visitor_locations where country is null and ip is not null and attempts<3 and (checked_at is null or checked_at<now()-interval ''1 hour'') order by first_seen limit 10 for update skip locked),marked as(update portfolio_api.visitor_locations v set checked_at=now(),attempts=attempts+1 from picked where v.session_id=picked.session_id returning v.session_id,host(v.ip) as ip) select coalesce(jsonb_agg(jsonb_build_object(''id'',session_id,''ip'',ip)),''[]'') into result from marked;return result;
when ''visitor_geo_result'' then update portfolio_api.visitor_locations set city=left(payload->>''city'',120),region=left(payload->>''region'',120),country=left(payload->>''country'',100),country_code=left(payload->>''country_code'',2) where session_id=payload->>''session_id'';return ''{}'';
when ''location_jobs'' then');execute d;
d:=pg_get_functiondef('portfolio_api.manage(text,jsonb)'::regprocedure);
d:=replace(d,'when ''health'' then', 'when ''geography'' then return jsonb_build_object(
''countries'',(select coalesce(jsonb_agg(x order by x.count desc),''[]'') from(select coalesce(v.country,''Unknown'')as label,count(distinct e.session_id)as count from portfolio_api.events e left join portfolio_api.visitor_locations v using(session_id) where e.type=''visit'' and e.created_at>=now()-make_interval(days=>least(90,greatest(1,coalesce((payload->>''days'')::int,30)))) group by coalesce(v.country,''Unknown''))x),
''cities'',(select coalesce(jsonb_agg(x order by x.count desc),''[]'') from(select concat_ws('', '',v.city,v.country)as label,count(distinct e.session_id)as count from portfolio_api.events e join portfolio_api.visitor_locations v using(session_id) where e.type=''visit'' and v.country is not null and e.created_at>=now()-make_interval(days=>least(90,greatest(1,coalesce((payload->>''days'')::int,30)))) group by v.city,v.country order by count desc limit 10)x),
''recent'',(select coalesce(jsonb_agg(x order by x.last_seen desc),''[]'') from(select session_id,host(ip)as ip,city,country,last_seen from portfolio_api.visitor_locations where first_seen>=now()-make_interval(days=>least(90,greatest(1,coalesce((payload->>''days'')::int,30)))) order by last_seen desc limit 20)x));
when ''health'' then');execute d;
end $$;
-- Retention does not depend on the owner opening the dashboard.
select cron.schedule('portfolio-visitor-ip-retention','17 3 * * *',$$update portfolio_api.visitor_locations set ip=null where ip is not null and first_seen<now()-interval '30 days'$$);
notify pgrst,'reload schema';
