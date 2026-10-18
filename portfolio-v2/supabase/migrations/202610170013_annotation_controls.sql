-- Distinguish current live/draft/history references; deletion safety stays unchanged.
create or replace function portfolio_api.asset_usage(asset_url text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare section_name text; tbl text; kind text; used boolean; result jsonb:='[]';begin
foreach kind in array array['LIVE','DRAFT','HISTORY'] loop
 foreach section_name in array array['profile','focus_items','jobs','projects','skill_groups','education','certificates','testimonials','blog_posts'] loop
  tbl:=portfolio_api.content_table(section_name);
  execute format('select exists(select 1 from portfolio_api.%I t where t.revision_kind=$1 and strpos(portfolio_api.content_data($2,t.id)::text,$3)>0)',tbl) into used using kind,section_name,asset_url;
  if used then result:=result||jsonb_build_array(case kind when 'LIVE' then 'Live site' when 'DRAFT' then 'Current draft' else 'Saved history' end);exit;end if;
 end loop;
end loop;
if exists(select 1 from portfolio_api.protected_assets where asset_url like '%/portfolio/'||storage_path||'%')then result:=result||'"Protected site asset"'::jsonb;end if;
return result;end $$;
revoke all on function portfolio_api.asset_usage(text) from public,anon,authenticated;
do $$declare d text;begin
d:=pg_get_functiondef('portfolio_api.rpc_studio(text,jsonb)'::regprocedure);
d:=replace(d,'''unused'',portfolio_api.asset_unused(m.url)', '''unused'',portfolio_api.asset_unused(m.url),''usage'',portfolio_api.asset_usage(m.url)');execute d;
d:=pg_get_functiondef('portfolio_api.manage(text,jsonb)'::regprocedure);
d:=replace(d,'when ''health'' then return jsonb_build_object(', 'when ''health'' then return jsonb_build_object(''contact_enabled'',(select contact_enabled from portfolio_api.site_state where singleton=''site''),''unread_messages'',(select count(*) from portfolio_api.messages where not is_read and not is_spam),''unpublished'',(select published_at is null or draft_updated_at>published_at from portfolio_api.site_state where singleton=''site''),''scheduled_at'',(select scheduled_at from portfolio_api.site_state where singleton=''site''),');execute d;
end $$;
notify pgrst,'reload schema';
