-- Preserve the function's existing gateway JWT verification. Only the server attaches the public anon JWT.
alter table portfolio_api.site_state add column if not exists mail_gateway_anon text;
create or replace function portfolio_api.dispatch_mail_queue() returns void language plpgsql security definer set search_path='' as $$declare endpoint text;gateway text;begin
 select mail_dispatch_url,mail_gateway_anon into endpoint,gateway from portfolio_api.site_state where singleton='site';
 if endpoint ~ '^https://[a-z0-9]+[.]supabase[.]co/functions/v1/portfolio-mail$' and gateway ~ '^eyJ[A-Za-z0-9_-]+[.][A-Za-z0-9_-]+[.][A-Za-z0-9_-]+$' then
 perform net.http_post(url:=endpoint,body:='{"action":"dispatch"}'::jsonb,headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||gateway),timeout_milliseconds:=5000);
 end if;end $$;
do $$declare d text;begin
 d:=pg_get_functiondef('portfolio_api.manage(text,jsonb)'::regprocedure);
 if d not like '%when ''dispatch_worker''%' then d:=replace(d,'when ''health'' then','when ''dispatch_worker'' then perform portfolio_api.dispatch_mail_queue();return ''{"scheduled":true}''; when ''health'' then');execute d;end if;
end $$;
notify pgrst,'reload schema';
