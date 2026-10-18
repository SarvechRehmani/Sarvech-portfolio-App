alter table portfolio_api.layouts add column if not exists theme_transition text not null default 'blur' check(theme_transition in('blur','portal','slide'));
do $$declare d text;begin
d:=pg_get_functiondef('portfolio_api.layout_data(uuid)'::regprocedure);d:=replace(d,'''default_mode'',l.default_mode','''theme_transition'',l.theme_transition,''default_mode'',l.default_mode');execute d;
d:=pg_get_functiondef('portfolio_api.copy_layout(uuid,text)'::regprocedure);d:=replace(d,'maintenance_message) select kind','maintenance_message,theme_transition) select kind');d:=replace(d,'maintenance_message from portfolio_api.layouts','maintenance_message,theme_transition from portfolio_api.layouts');execute d;
d:=pg_get_functiondef('portfolio_api.rpc_studio(text,jsonb)'::regprocedure);d:=replace(d,'default_mode=coalesce(payload->>''default_mode'',''dark'')','theme_transition=coalesce(payload->>''theme_transition'',theme_transition),default_mode=coalesce(payload->>''default_mode'',''dark'')');execute d;
d:=pg_get_functiondef('portfolio_api.manage(text,jsonb)'::regprocedure);
d:=replace(d,'select l.*,(select count(*)','select l.*,(select coalesce(jsonb_agg(x order by x.count desc),''[]'') from(select coalesce(v.country,''Unknown'')as label,count(distinct e.session_id)as count from portfolio_api.events e left join portfolio_api.visitor_locations v using(session_id) where e.recruiter_id=l.id and e.type=''visit'' group by coalesce(v.country,''Unknown''))x) locations,(select concat_ws('', '',v.city,v.country) from portfolio_api.events e join portfolio_api.visitor_locations v using(session_id) where e.recruiter_id=l.id and v.country is not null order by e.created_at desc limit 1)last_location,(select count(*)');execute d;
end $$;
create or replace function portfolio_api.expire_history()returns integer language plpgsql security definer set search_path='' as $$declare item uuid;amount integer:=0;begin
for item in select id from portfolio_api.content_history where created_at<now()-interval '30 days' order by created_at limit 1000 loop
 perform portfolio_api.prune_history(item);amount:=amount+1;
end loop;return amount;end $$;
revoke all on function portfolio_api.expire_history() from public,anon,authenticated;
select cron.schedule('portfolio-history-retention','23 * * * *',$$select portfolio_api.expire_history()$$);
select portfolio_api.expire_history();
notify pgrst,'reload schema';
