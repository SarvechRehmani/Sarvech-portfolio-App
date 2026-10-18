-- Content Studio: relational brand/layout, expiring shared drafts, history pruning,
-- additive backup restore and database-side scheduled publication.
create table if not exists portfolio_api.themes(id uuid primary key default gen_random_uuid(),name text not null check(length(name) between 1 and 80),builtin boolean not null default false,created_at timestamptz not null default now());
create table if not exists portfolio_api.theme_colors(theme_id uuid references portfolio_api.themes(id) on delete cascade,mode text check(mode in ('dark','light')),token text not null,value text not null,primary key(theme_id,mode,token));
create table if not exists portfolio_api.layouts(id uuid primary key default gen_random_uuid(),revision_kind text not null check(revision_kind in ('DRAFT','LIVE','HISTORY')),theme_id uuid references portfolio_api.themes(id),created_at timestamptz not null default now());
create unique index if not exists one_layout_revision on portfolio_api.layouts(revision_kind) where revision_kind in ('DRAFT','LIVE');
create table if not exists portfolio_api.home_sections(layout_id uuid references portfolio_api.layouts(id) on delete cascade,section_key text not null check(section_key in ('about','experience','education','skills','projects','certificates','contact','additional')),position integer not null,enabled boolean not null default true,primary key(layout_id,section_key));
create table if not exists portfolio_api.draft_links(id uuid primary key default gen_random_uuid(),token_hash text unique not null,label text not null check(length(label) between 1 and 100),created_at timestamptz not null default now(),expires_at timestamptz not null check(expires_at>created_at),revoked_at timestamptz);
create table if not exists portfolio_api.protected_assets(storage_path text primary key,reason text not null);
insert into portfolio_api.protected_assets values('site/71ead6dc1bb20410-favicon.ico','Website favicon'),('site/d073e73ec47f713a-favicon.png','Website favicon') on conflict do nothing;
alter table portfolio_api.site_state add column if not exists scheduled_at timestamptz;
create index if not exists draft_links_expiry on portfolio_api.draft_links(expires_at);

-- Once an authenticator is verified, password-only JWTs cannot access any admin RPC.
create or replace function portfolio_api.is_admin() returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from portfolio_api.admins a where a.user_id=auth.uid()) and (coalesce(auth.jwt()->>'aal','aal1')='aal2' or not exists(select 1 from auth.mfa_factors f where f.user_id=auth.uid() and f.status='verified')) $$;

create or replace function portfolio_api.layout_data(item uuid) returns jsonb language sql stable set search_path='' as $$
select jsonb_build_object('id',l.id,'theme_id',l.theme_id,'sections',coalesce((select jsonb_agg(jsonb_build_object('key',s.section_key,'enabled',s.enabled) order by s.position) from portfolio_api.home_sections s where s.layout_id=l.id),'[]'),'theme',(select jsonb_build_object('id',t.id,'name',t.name,'dark',coalesce((select jsonb_object_agg(token,value) from portfolio_api.theme_colors where theme_id=t.id and mode='dark'),'{}'),'light',coalesce((select jsonb_object_agg(token,value) from portfolio_api.theme_colors where theme_id=t.id and mode='light'),'{}')) from portfolio_api.themes t where t.id=l.theme_id)) from portfolio_api.layouts l where l.id=item $$;

create or replace function portfolio_api.copy_layout(item uuid,kind text) returns uuid language plpgsql set search_path='' as $$ declare target uuid; begin
insert into portfolio_api.layouts(revision_kind,theme_id) select kind,theme_id from portfolio_api.layouts where id=item returning id into target;
insert into portfolio_api.home_sections select target,section_key,position,enabled from portfolio_api.home_sections where layout_id=item; return target; end $$;

-- Preserve the existing content assembler and add only the published/draft layout.
do $$ begin if to_regprocedure('portfolio_api.assemble_content(text)') is null then alter function portfolio_api.assemble(text) rename to assemble_content; end if; end $$;
create or replace function portfolio_api.assemble(kind text) returns jsonb language sql stable set search_path='' as $$ select portfolio_api.assemble_content(kind)||jsonb_build_object('layout',portfolio_api.layout_data((select id from portfolio_api.layouts where revision_kind=kind)))||case when kind='DRAFT' then jsonb_build_object('draft_blog',portfolio_api.content_rows('blog_posts')) else '{}'::jsonb end $$;
do $$ begin if to_regprocedure('portfolio_api.publish_content()') is null then alter function portfolio_api.publish() rename to publish_content; end if; end $$;
create or replace function portfolio_api.publish() returns void language plpgsql set search_path='' as $$ begin
perform pg_advisory_xact_lock(90210420);perform portfolio_api.publish_content();
delete from portfolio_api.layouts where revision_kind='LIVE';perform portfolio_api.copy_layout((select id from portfolio_api.layouts where revision_kind='DRAFT'),'LIVE');
update portfolio_api.site_state set scheduled_at=null where singleton='site'; end $$;

create or replace function public.portfolio_shared_draft(token text) returns jsonb language plpgsql security definer set search_path='' as $$ begin
perform set_config('response.headers','[{"Cache-Control":"no-store, private"},{"X-Robots-Tag":"noindex, nofollow"}]',true);
if length(token)<>64 or token !~ '^[a-f0-9]+$' or not exists(select 1 from portfolio_api.draft_links where token_hash=encode(sha256(convert_to(token,'UTF8')),'hex') and revoked_at is null and expires_at>now()) then raise exception 'This private link has expired or was revoked.' using errcode='42501'; end if;
return portfolio_api.assemble('DRAFT'); end $$;

create or replace function portfolio_api.asset_unused(asset_url text) returns boolean language plpgsql stable security definer set search_path='' as $$ declare section_name text; tbl text; used boolean; begin
if exists(select 1 from portfolio_api.protected_assets where asset_url like '%/portfolio/'||storage_path||'%') then return false;end if;
foreach section_name in array array['profile','focus_items','jobs','projects','skill_groups','education','certificates','testimonials','blog_posts'] loop
tbl:=portfolio_api.content_table(section_name);
execute format('select exists(select 1 from portfolio_api.%I t where strpos(portfolio_api.content_data($1,t.id)::text,$2)>0)',tbl) into used using section_name,asset_url;
if used then return false; end if; end loop;return true; end $$;

create or replace function portfolio_api.history_rows() returns jsonb language plpgsql stable set search_path='' as $$ declare result jsonb:='[]'; h record; data jsonb; begin
for h in select * from portfolio_api.content_history order by created_at desc,id desc loop
if h.section='layout' then data:=jsonb_build_object('title','Layout & brand');
else data:=portfolio_api.content_data(h.section,coalesce(h.after_record_id,h.before_record_id,h.record_id)); end if;
result:=result||jsonb_build_array(jsonb_build_object('id',h.id,'operation',h.operation,'table_name',h.section,'created_at',h.created_at,'title',coalesce(data->>'title',data->>'name',data->>'company',h.section)));end loop;return result;end $$;

create or replace function portfolio_api.prune_history(item uuid) returns void language plpgsql set search_path='' as $$ declare h portfolio_api.content_history; candidate uuid; begin
perform pg_advisory_xact_lock(90210420);select * into h from portfolio_api.content_history where id=item for update;
if h.id is null then raise exception 'History entry not found'; end if;
delete from portfolio_api.content_history where id=item;
foreach candidate in array array[h.before_record_id,h.after_record_id] loop
if candidate is not null and not exists(select 1 from portfolio_api.content_history where before_record_id=candidate or after_record_id=candidate) then
if h.section='layout' then delete from portfolio_api.layouts where id=candidate and revision_kind='HISTORY';
else if exists(select 1 from jsonb_array_elements(portfolio_api.content_rows(h.section,'HISTORY')) r where r->>'id'=candidate::text) then perform portfolio_api.remove_content(h.section,candidate);end if;end if;end if;end loop;end $$;

create or replace function public.portfolio_studio(action text,payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; item uuid:=nullif(payload->>'id','')::uuid; before_id uuid; after_id uuid; target uuid; theme uuid; r record; v jsonb; sections jsonb; section_name text; current_id uuid; old_version bigint; h portfolio_api.content_history; count_rows integer:=0; old_published timestamptz; begin
perform portfolio_api.require_admin();
case action
when 'state' then return (select jsonb_build_object('published_at',published_at,'draft_updated_at',draft_updated_at,'scheduled_at',scheduled_at) from portfolio_api.site_state where singleton='site');
when 'history' then
result:=portfolio_api.history_rows();
return jsonb_build_object('total',jsonb_array_length(result),'items',coalesce((select jsonb_agg(e.value order by e.n) from jsonb_array_elements(result) with ordinality e(value,n) where e.n>(greatest(1,coalesce((payload->>'page')::integer,1))-1)*least(100,greatest(1,coalesce((payload->>'size')::integer,5))) and e.n<=greatest(1,coalesce((payload->>'page')::integer,1))*least(100,greatest(1,coalesce((payload->>'size')::integer,5)))),'[]'));
when 'delete_history' then perform portfolio_api.prune_history(item);return '{}';
when 'links' then return (select coalesce(jsonb_agg(jsonb_build_object('id',id,'label',label,'created_at',created_at,'expires_at',expires_at,'revoked_at',revoked_at) order by created_at desc),'[]') from portfolio_api.draft_links);
when 'create_link' then
if (payload->>'token') !~ '^[a-f0-9]{64}$' or length(coalesce(payload->>'label','')) not between 1 and 100 or (payload->>'hours')::integer not between 1 and 168 then raise exception 'Choose a label and expiry between 1 and 168 hours'; end if;
insert into portfolio_api.draft_links(token_hash,label,expires_at) values(encode(sha256(convert_to(payload->>'token','UTF8')),'hex'),payload->>'label',now()+make_interval(hours=>(payload->>'hours')::integer)) returning id into target;return jsonb_build_object('id',target);
when 'revoke_link' then delete from portfolio_api.draft_links where id=item;return '{}';
when 'layout' then return portfolio_api.layout_data((select id from portfolio_api.layouts where revision_kind='DRAFT'));
when 'save_layout' then
perform pg_advisory_xact_lock(90210420);target:=(select id from portfolio_api.layouts where revision_kind='DRAFT');theme:=(payload->>'theme_id')::uuid;
if not exists(select 1 from portfolio_api.themes where id=theme) then raise exception 'Choose an existing theme'; end if;
sections:=payload->'sections';
if jsonb_typeof(sections)<>'array' or jsonb_array_length(sections)<>8 or (select count(distinct s->>'key') from jsonb_array_elements(sections) s)<>8 or exists(select 1 from jsonb_array_elements(sections) s where s->>'key' not in ('about','experience','education','skills','projects','certificates','contact','additional') or s->>'key' is null or jsonb_typeof(s->'enabled') is distinct from 'boolean') then raise exception 'Provide every home section exactly once';end if;
before_id:=portfolio_api.copy_layout(target,'HISTORY');update portfolio_api.layouts set theme_id=theme where id=target;
delete from portfolio_api.home_sections where layout_id=target;
insert into portfolio_api.home_sections select target,s.value->>'key',(s.n-1)::integer,(s.value->>'enabled')::boolean from jsonb_array_elements(sections) with ordinality s(value,n);
after_id:=portfolio_api.copy_layout(target,'HISTORY');
insert into portfolio_api.content_history(id,created_at,updated_at,version,section,operation,record_id,before_record_id,after_record_id,position,actor) values(gen_random_uuid(),now(),now(),0,'layout','UPDATE',target,before_id,after_id,0,auth.uid()::text);
update portfolio_api.site_state set draft_updated_at=clock_timestamp() where singleton='site';return portfolio_api.layout_data(target);
when 'restore_layout' then
select * into h from portfolio_api.content_history where id=item and section='layout';if h.before_record_id is null then raise exception 'Layout history not found';end if;
return public.portfolio_studio('save_layout',portfolio_api.layout_data(h.before_record_id));
when 'themes' then return (select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'builtin',builtin,'dark',coalesce((select jsonb_object_agg(token,value) from portfolio_api.theme_colors where theme_id=t.id and mode='dark'),'{}'),'light',coalesce((select jsonb_object_agg(token,value) from portfolio_api.theme_colors where theme_id=t.id and mode='light'),'{}')) order by created_at),'[]') from portfolio_api.themes t);
when 'import_theme' then
if payload->>'format' is distinct from 'portfolio-theme-v1' or length(trim(coalesce(payload->>'name',''))) not between 1 and 80 or length(payload::text)>15000 then raise exception 'Invalid theme file';end if;
foreach section_name in array array['dark','light'] loop
if jsonb_typeof(payload->section_name) is distinct from 'object' or not (payload->section_name ?& array['bg','surface','hover','border','text','muted','accent','accent-hover','link','glass','glow','on-accent','shadow']) then raise exception 'Both modes need all required theme tokens';end if;
for r in select * from jsonb_each_text(payload->section_name) loop
if r.key not in ('bg','surface','hover','border','text','muted','accent','accent-hover','link','error','success','glass','glow','on-accent','shadow','loader-bg','loader-text') or length(r.value)>160 or r.value !~ '^[a-zA-Z0-9#(),.% /-]+$' or r.value ~* 'url|expression|javascript|var\(' then raise exception 'Invalid theme token: %',r.key;end if;
if r.key<>'shadow' and r.value !~* '^(#[0-9a-f]{3,8}|rgba?\([0-9.,% /]+\)|hsla?\([0-9.,% /]+\))$' then raise exception 'Use a CSS hex/rgb/hsl color for %',r.key;end if;end loop;end loop;
insert into portfolio_api.themes(name) values(trim(payload->>'name')) returning id into target;
foreach section_name in array array['dark','light'] loop insert into portfolio_api.theme_colors select target,section_name,key,value from jsonb_each_text(payload->section_name);end loop;return jsonb_build_object('id',target);
when 'delete_theme' then
if exists(select 1 from portfolio_api.layouts where theme_id=item) then raise exception 'Theme is used by a draft, live layout or saved history. Switch themes, publish and remove its old layout history first.';end if;
delete from portfolio_api.themes where id=item;return '{}';
when 'schedule' then
if nullif(payload->>'at','') is null or (payload->>'at')::timestamptz<=now()+interval '1 minute' or (payload->>'at')::timestamptz>now()+interval '365 days' then raise exception 'Choose a future time between one minute and one year';end if;
update portfolio_api.site_state set scheduled_at=(payload->>'at')::timestamptz where singleton='site';return '{}';
when 'cancel_schedule' then update portfolio_api.site_state set scheduled_at=null where singleton='site';return '{}';
when 'media' then return (select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'url',m.url,'storage_path',m.storage_path,'filename',m.filename,'content_type',m.content_type,'size',m.size,'created_at',m.created_at,'unused',portfolio_api.asset_unused(m.url)) order by m.created_at desc),'[]') from portfolio_api.media_assets m where exists(select 1 from storage.objects o where o.bucket_id='portfolio' and o.name=m.storage_path));
when 'delete_media_record' then
select * into r from portfolio_api.media_assets where id=item for update;if r.id is null then return '{}';end if;
if not portfolio_api.asset_unused(r.url) then raise exception 'This file is still referenced';end if;
if exists(select 1 from storage.objects where bucket_id='portfolio' and name=r.storage_path) then raise exception 'Remove the Storage object first';end if;
delete from portfolio_api.media_assets where id=item;return '{}';
when 'backup' then
result:=jsonb_build_object('format','portfolio-backup-v2','exported_at',now(),'layout',portfolio_api.layout_data((select id from portfolio_api.layouts where revision_kind='DRAFT')),'themes',public.portfolio_studio('themes'));
foreach section_name in array array['profile','focus_items','jobs','projects','skill_groups','education','certificates','testimonials','blog_posts'] loop result:=result||jsonb_build_object(section_name,portfolio_api.content_rows(section_name));end loop;
return result||jsonb_build_object('media',public.portfolio_studio('media'),'messages',(select coalesce(jsonb_agg(to_jsonb(m)-'deleted'),'[]') from portfolio_api.messages m where not deleted));
when 'restore_backup' then
perform pg_advisory_xact_lock(90210420);
if coalesce(payload->>'format','') not in ('portfolio-backup-v1','portfolio-backup-v2') or length(payload::text)>10000000 then raise exception 'Invalid portfolio backup';end if;
foreach section_name in array array['profile','focus_items','jobs','projects','skill_groups','education','certificates','testimonials','blog_posts'] loop
if payload ? section_name then
if jsonb_typeof(payload->section_name)<>'array' or jsonb_array_length(payload->section_name)>2000 then raise exception 'Invalid backup section: %',section_name;end if;
for v in select value from jsonb_array_elements(payload->section_name) loop
current_id:=null;old_version:=null;
if section_name='profile' then select id,version into current_id,old_version from portfolio_api.profiles where revision_kind='DRAFT' limit 1;
else
execute format('select id,version from portfolio_api.%I t where revision_kind=''DRAFT'' and (id=$1 or (nullif($2,'''') is not null and slug=$2) or (nullif($3,'''') is not null and coalesce(portfolio_api.content_data($4,t.id)->>''title'',portfolio_api.content_data($4,t.id)->>''name'')=$3)) limit 1',portfolio_api.content_table(section_name)) into current_id,old_version using nullif(v->>'id','')::uuid,v->'data'->>'slug',coalesce(v->'data'->>'title',v->'data'->>'name'),section_name;end if;
perform portfolio_api.save_draft(section_name,v->'data',current_id,coalesce((v->>'position')::integer,0),old_version);count_rows:=count_rows+1;
end loop;end if;end loop;
-- Layout and palettes are restored additively; uploaded bytes and messages are not imported.
if jsonb_typeof(payload->'themes')='array' then
for v in select value from jsonb_array_elements(payload->'themes') loop
if not exists(select 1 from jsonb_array_elements(public.portfolio_studio('themes')) t where t->'dark'=v->'dark' and t->'light'=v->'light' and t->>'name'=v->>'name') then perform public.portfolio_studio('import_theme',v||jsonb_build_object('format','portfolio-theme-v1'));end if;
end loop;end if;
if payload->'layout'->'theme' is not null and jsonb_typeof(payload->'layout'->'theme')='object' then
v:=payload->'layout'->'theme';select (t->>'id')::uuid into theme from jsonb_array_elements(public.portfolio_studio('themes')) t where t->'dark'=v->'dark' and t->'light'=v->'light' and t->>'name'=v->>'name' limit 1;
if theme is null then theme:=(public.portfolio_studio('import_theme',v||jsonb_build_object('format','portfolio-theme-v1'))->>'id')::uuid;end if;
perform public.portfolio_studio('save_layout',(payload->'layout')||jsonb_build_object('theme_id',theme));end if;
return jsonb_build_object('restored',count_rows);
else raise exception 'Unknown studio command';end case;end $$;

-- Database runner runs even when the website/admin/browser is closed.
create extension if not exists pg_cron;
create or replace function portfolio_api.run_scheduled_publish() returns void language plpgsql security definer set search_path='' as $$ begin
perform pg_advisory_xact_lock(90210420);
if exists(select 1 from portfolio_api.site_state where singleton='site' and scheduled_at<=now()) then perform portfolio_api.publish();end if;
delete from portfolio_api.draft_links where expires_at<now()-interval '7 days';end $$;
select cron.schedule('portfolio-publish-schedule','* * * * *','select portfolio_api.run_scheduled_publish()');

do $$ declare t text;begin foreach t in array array['themes','theme_colors','layouts','home_sections','draft_links','protected_assets'] loop
execute format('alter table portfolio_api.%I enable row level security',t);
execute format('revoke all on portfolio_api.%I from public,anon,authenticated',t);
execute format('drop policy if exists admin_only on portfolio_api.%I',t);
execute format('create policy admin_only on portfolio_api.%I for all to authenticated using ((select portfolio_api.is_admin())) with check ((select portfolio_api.is_admin()))',t);end loop;end $$;
revoke all on all functions in schema portfolio_api from public,anon,authenticated;
grant execute on function portfolio_api.is_admin() to authenticated;
revoke all on function public.portfolio_studio(text,jsonb) from public,anon;
grant execute on function public.portfolio_studio(text,jsonb) to authenticated;
revoke all on function public.portfolio_shared_draft(text) from public;
grant execute on function public.portfolio_shared_draft(text) to anon,authenticated;
drop policy if exists portfolio_admin_delete_unused on storage.objects;
create policy portfolio_admin_delete_unused on storage.objects for delete to authenticated using(bucket_id='portfolio' and (select portfolio_api.is_admin()) and exists(select 1 from portfolio_api.media_assets m where m.storage_path=name and portfolio_api.asset_unused(m.url)));
-- DELETE policy helper hides raw media metadata from the client.
create or replace function portfolio_api.can_delete_asset(object_name text) returns boolean language sql stable security definer set search_path='' as $$ select portfolio_api.is_admin() and exists(select 1 from portfolio_api.media_assets m where m.storage_path=object_name and portfolio_api.asset_unused(m.url)) $$;
drop policy portfolio_admin_delete_unused on storage.objects;
create policy portfolio_admin_delete_unused on storage.objects for delete to authenticated using(bucket_id='portfolio' and (select portfolio_api.can_delete_asset(name)));
revoke all on function portfolio_api.can_delete_asset(text) from public,anon;
grant execute on function portfolio_api.can_delete_asset(text) to authenticated;
notify pgrst,'reload schema';

