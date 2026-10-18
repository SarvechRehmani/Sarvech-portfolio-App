alter table portfolio_api.layouts add column if not exists maintenance_until timestamptz;
do $$declare definition text;begin
 definition:=pg_get_functiondef('portfolio_api.layout_data(uuid)'::regprocedure);
 if definition not like '%''maintenance_until''%' then
 definition:=replace(definition,'''maintenance_message'',l.maintenance_message','''maintenance_message'',l.maintenance_message,''maintenance_until'',l.maintenance_until');execute definition;end if;
 definition:=pg_get_functiondef('portfolio_api.copy_layout(uuid,text)'::regprocedure);
 if definition not like '%maintenance_until%' then
 definition:=replace(definition,'theme_transition) select kind','theme_transition,maintenance_until) select kind');
 definition:=replace(definition,'theme_transition from portfolio_api.layouts','theme_transition,maintenance_until from portfolio_api.layouts');execute definition;end if;
 definition:=pg_get_functiondef('portfolio_api.rpc_studio(text,jsonb)'::regprocedure);
 if definition not like '%maintenance_until=case%' then
 definition:=replace(definition,'maintenance_message=coalesce(payload->>''maintenance_message'',maintenance_message)','maintenance_message=coalesce(payload->>''maintenance_message'',maintenance_message),maintenance_until=case when payload ? ''maintenance_until'' then nullif(payload->>''maintenance_until'','''')::timestamptz else maintenance_until end');
 if definition not like '%maintenance_until=case%' then raise exception 'Maintenance save patch failed';end if;execute definition;end if;
end $$;
-- Expiry is computed at read time, with no additional cron or idle worker calls.
create or replace function portfolio_api.maintenance_active() returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from portfolio_api.layouts where revision_kind='LIVE' and maintenance_enabled and (maintenance_until is null or maintenance_until>now()))
$$;
revoke all on function portfolio_api.maintenance_active() from public,anon,authenticated;
create or replace function portfolio_api.rpc_site() returns jsonb language plpgsql stable security definer set search_path='' as $$declare s jsonb;active boolean;begin
 s:=portfolio_api.site_without_maintenance();active:=portfolio_api.maintenance_active();
 s:=jsonb_set(s,'{layout,maintenance_enabled}',to_jsonb(active));
 if active then return jsonb_build_object('profile',jsonb_build_object('name',s->'profile'->>'name','email',s->'profile'->>'email','initial',s->'profile'->>'initial','website',s->'profile'->>'website'),'layout',s->'layout');end if;return s;
end $$;
create or replace function portfolio_api.rpc_blog(post_slug text default null) returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 if portfolio_api.maintenance_active() then return '[]';end if;return portfolio_api.blog_without_maintenance(post_slug);
end $$;
create or replace function portfolio_api.inbox_guard() returns trigger language plpgsql security definer set search_path='' as $$begin
 if not(select contact_enabled from portfolio_api.site_state where singleton='site') or portfolio_api.maintenance_active() then raise exception 'The contact form is temporarily unavailable. Please email the owner directly.';end if;return new;
end $$;
do $$declare definition text;begin
 definition:=pg_get_functiondef('portfolio_api.manage(text,jsonb)'::regprocedure);
 definition:=replace(definition,'exists(select 1 from portfolio_api.layouts where revision_kind=''LIVE'' and maintenance_enabled)','portfolio_api.maintenance_active()');execute definition;
end $$;
notify pgrst,'reload schema';
