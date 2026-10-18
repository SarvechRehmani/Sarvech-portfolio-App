-- Only these six RPCs are reachable through the public Data API.
-- All content is relational. JSON arguments/results are transport only.
create or replace function public.portfolio_is_admin() returns boolean language sql stable security definer set search_path='' as $$ select portfolio_api.is_admin() $$;
create or replace function public.portfolio_site() returns jsonb language sql stable security definer set search_path='' as $$ select portfolio_api.assemble('LIVE') $$;
create or replace function public.portfolio_blog(post_slug text default null) returns jsonb language sql stable security definer set search_path='' as $$
select coalesce(jsonb_agg(jsonb_build_object('id',b.id,'published_at',b.published_at,'data',portfolio_api.content_data('blog_posts',b.id)) order by b.published_at desc,b.position),'[]') from portfolio_api.blog_posts b where b.revision_kind='DRAFT' and b.published and (post_slug is null or b.slug=post_slug) $$;

create or replace function portfolio_api.save_draft(section text, payload jsonb, item uuid, sort_order integer, expected_version bigint default null) returns jsonb language plpgsql set search_path='' as $$
declare tbl text:=portfolio_api.content_table(section); before_data jsonb; before_id uuid; after_id uuid; target uuid; row_version bigint; old_position integer; required text; operation text; begin
if tbl is null then raise exception 'Unknown section'; end if;
-- Serialize all writes, publication and restores to prevent lost updates.
perform pg_advisory_xact_lock(90210420);
if item is not null then
execute format('select version,position from portfolio_api.%I where id=$1 and revision_kind=''DRAFT'' for update',tbl) into row_version,old_position using item;
if row_version is null then raise exception 'Item not found'; end if;
if expected_version is not null and expected_version<>row_version then raise exception 'Item changed. Reload before saving.' using errcode='40001'; end if;
before_data:=portfolio_api.content_data(section,item);
before_id:=portfolio_api.write_content(section,before_data,null,old_position,'HISTORY',item);
elsif section='profile' and exists(select 1 from portfolio_api.profiles where revision_kind='DRAFT') then raise exception 'The profile already exists'; end if;
if jsonb_typeof(payload)<>'object' or length(payload::text)>500000 then raise exception 'Invalid content'; end if;
required:=case when section in ('profile','testimonials') then 'name' else 'title' end;
if length(trim(coalesce(payload->>required,'')))=0 then raise exception '% is required',required; end if;
if section in ('projects','blog_posts') then
if nullif(payload->>'slug','') is null then payload:=payload||jsonb_build_object('slug',trim(both '-' from regexp_replace(lower(payload->>'title'),'[^a-z0-9]+','-','g'))); end if;
if (payload->>'slug') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(payload->>'slug')>200 then raise exception 'Invalid URL slug'; end if;
execute format('select version from portfolio_api.%I where revision_kind=''DRAFT'' and slug=$1 and id<>$2 limit 1',tbl) into row_version using payload->>'slug',coalesce(item,'00000000-0000-0000-0000-000000000000'::uuid);
if row_version is not null then raise exception 'This URL slug is already in use'; end if;
end if;
if section='blog_posts' and coalesce((payload->>'published')::boolean,false) then payload:=payload||jsonb_build_object('published_at',coalesce(before_data->>'published_at',now()::text)); end if;
target:=portfolio_api.write_content(section,payload,item,sort_order,'DRAFT',null);
after_id:=portfolio_api.write_content(section,portfolio_api.content_data(section,target),null,sort_order,'HISTORY',target);
insert into portfolio_api.content_history(id,created_at,updated_at,version,section,operation,record_id,before_record_id,after_record_id,position,actor) values(gen_random_uuid(),now(),now(),0,section,case when item is null then 'CREATE' else 'UPDATE' end,target,before_id,after_id,sort_order,auth.uid()::text);
update portfolio_api.site_state set draft_updated_at=clock_timestamp(),updated_at=now(),version=version+1 where singleton='site';
return (select v from jsonb_array_elements(portfolio_api.content_rows(section)) v where v->>'id'=target::text); end $$;

create or replace function portfolio_api.delete_draft(section text,item uuid) returns void language plpgsql set search_path='' as $$
declare tbl text:=portfolio_api.content_table(section); data jsonb; old_position integer; history_id uuid; begin
perform pg_advisory_xact_lock(90210420);
if tbl is null or section='profile' then raise exception 'This item cannot be deleted'; end if;
execute format('select position from portfolio_api.%I where id=$1 and revision_kind=''DRAFT'' for update',tbl) into old_position using item;
if old_position is null then raise exception 'Item not found'; end if;
data:=portfolio_api.content_data(section,item); history_id:=portfolio_api.write_content(section,data,null,old_position,'HISTORY',item);
insert into portfolio_api.content_history(id,created_at,updated_at,version,section,operation,record_id,before_record_id,position,actor) values(gen_random_uuid(),now(),now(),0,section,'DELETE',item,history_id,old_position,auth.uid()::text);
perform portfolio_api.remove_content(section,item);
update portfolio_api.site_state set draft_updated_at=clock_timestamp(),updated_at=now(),version=version+1 where singleton='site'; end $$;

create or replace function portfolio_api.publish() returns void language plpgsql set search_path='' as $$
declare entry record; row record; begin
perform pg_advisory_xact_lock(90210420);
for entry in select * from (values ('profile','profiles'),('focus_items','focus_items'),('jobs','experiences'),('projects','projects'),('skill_groups','skill_categories'),('education','education'),('certificates','certificates'),('testimonials','testimonials')) s(section,tbl) loop
for row in execute format('select id from portfolio_api.%I where revision_kind=''LIVE''',entry.tbl) loop perform portfolio_api.remove_content(entry.section,row.id); end loop;
for row in execute format('select id,position from portfolio_api.%I where revision_kind=''DRAFT'' order by position',entry.tbl) loop
if coalesce((portfolio_api.content_data(entry.section,row.id)->>'visible')::boolean,true) then perform portfolio_api.write_content(entry.section,portfolio_api.content_data(entry.section,row.id),null,row.position,'LIVE',row.id); end if;
end loop; end loop;
update portfolio_api.site_state set published_at=clock_timestamp(),updated_at=now(),version=version+1 where singleton='site'; end $$;

create or replace function portfolio_api.analytics(days integer) returns jsonb language plpgsql stable set search_path='' as $$
declare result jsonb; since timestamptz; today date:=(now() at time zone 'UTC')::date; begin
if days not in (7,30,90) then raise exception 'Range must be 7, 30 or 90 days'; end if;
since:=(today-days+1)::timestamp at time zone 'UTC';
select jsonb_build_object('visits',count(*) filter(where type='visit'),'unique_visitors',count(distinct session_id) filter(where type='visit'),'resume',count(*) filter(where type='resume'),'projects',count(*) filter(where type='project'),'social',count(*) filter(where type='social'),'messages',count(*) filter(where type='message')) into result from portfolio_api.events where created_at>=since;
result:=result||jsonb_build_object('daily',(select jsonb_agg(jsonb_build_object('day',d::date,'count',(select count(*) from portfolio_api.events e where type='visit' and (created_at at time zone 'UTC')::date=d::date)) order by d) from generate_series(today-days+1,today,interval '1 day') d));
result:=result||jsonb_build_object(
'pages',coalesce((select jsonb_agg(to_jsonb(t)) from (select label,count(*) as count from portfolio_api.events where created_at>=since and type='visit' group by label order by count(*) desc,label limit 30)t),'[]'),
'devices',coalesce((select jsonb_agg(to_jsonb(t)) from (select device as label,count(*) as count from portfolio_api.events where created_at>=since and type='visit' group by device order by count(*) desc limit 30)t),'[]'),
'referrers',coalesce((select jsonb_agg(to_jsonb(t)) from (select coalesce(nullif(referrer,''),'Direct') as label,count(*) as count from portfolio_api.events where created_at>=since and type='visit' group by referrer order by count(*) desc limit 30)t),'[]'),
'items',coalesce((select jsonb_agg(to_jsonb(t)) from (select label,count(*) as count from portfolio_api.events where created_at>=since and type in ('resume','project','social') group by label order by count(*) desc,label limit 30)t),'[]'));
return result; end $$;

create or replace function public.portfolio_admin(action text,section text default '',payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare item uuid:=nullif(payload->>'id','')::uuid; entry record; row record; result jsonb; ids uuid[]; tbl text; h portfolio_api.content_history; target uuid; i integer; changed integer; begin
perform portfolio_api.require_admin();
case action
when 'draft' then return portfolio_api.assemble('DRAFT');
when 'publish' then perform portfolio_api.publish(); return '{}'::jsonb;
when 'analytics' then return portfolio_api.analytics(coalesce((payload->>'days')::integer,30));
when 'dashboard' then return jsonb_build_object('projects',(select count(*) from portfolio_api.projects where revision_kind='DRAFT'),'skills',(select count(*) from portfolio_api.skill_categories_names n join portfolio_api.skill_categories s on n.skill_categorie_id=s.id where s.revision_kind='DRAFT'),'certificates',(select count(*) from portfolio_api.certificates where revision_kind='DRAFT'),'messages',(select count(*) from portfolio_api.messages where not deleted),'unread',(select count(*) from portfolio_api.messages where not deleted and not read),'recent',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from (select log.id,log.operation,log.section as table_name,log.created_at from portfolio_api.content_history log order by log.created_at desc limit 8)t));
when 'list' then
case section
when 'site_state' then return (select coalesce(jsonb_agg(jsonb_build_object('id',id,'published_at',published_at,'draft_updated_at',draft_updated_at)),'[]') from portfolio_api.site_state where singleton='site');
when 'messages' then return (select coalesce(jsonb_agg(to_jsonb(t) order by created_at desc),'[]') from (select id,name,email,subject,message,read as is_read,created_at from portfolio_api.messages where not deleted)t);
when 'media' then return (select coalesce(jsonb_agg(to_jsonb(t) order by created_at desc),'[]') from (select id,url,filename,content_type,size,created_at from portfolio_api.media_assets where not deleted)t);
when 'content_history' then return (select coalesce(jsonb_agg(to_jsonb(t) order by created_at desc),'[]') from (select log.id,log.operation,log.section as table_name,log.created_at from portfolio_api.content_history log order by log.created_at desc limit 100)t);
else return portfolio_api.content_rows(section); end case;
when 'save' then
if section='messages' then update portfolio_api.messages set read=coalesce((payload->>'is_read')::boolean,false),updated_at=now(),version=version+1 where id=item; return '{}'; end if;
return portfolio_api.save_draft(section,payload->'data',item,coalesce((payload->>'position')::integer,0),(payload->>'version')::bigint);
when 'delete' then
if section='messages' then update portfolio_api.messages set deleted=true,updated_at=now(),version=version+1 where id=item; return '{}'; end if;
if section='media' then
-- Retain the actual object for published content and version history.
update portfolio_api.media_assets set deleted=true,updated_at=now(),version=version+1 where id=item; return '{}'; end if;
perform portfolio_api.delete_draft(section,item); return '{}';
when 'reorder' then
perform pg_advisory_xact_lock(90210420); tbl:=portfolio_api.content_table(section); if tbl is null then raise exception 'Unknown section'; end if;
select array_agg(v::uuid) into ids from jsonb_array_elements_text(payload->'ids') v;
if exists(select 1 from unnest(ids) v group by v having count(*)>1) then raise exception 'Duplicate item'; end if;
execute format('select count(*) from portfolio_api.%I where revision_kind=''DRAFT''',tbl) into i;
if coalesce(cardinality(ids),0)<>i then raise exception 'Provide every item exactly once'; end if;
for i in 1..coalesce(cardinality(ids),0) loop
execute format('update portfolio_api.%I set position=$1,updated_at=now(),version=version+1 where id=$2 and revision_kind=''DRAFT''',tbl) using i-1,ids[i];
get diagnostics changed=row_count; if changed<>1 then raise exception 'Unknown item'; end if; end loop;
update portfolio_api.site_state set draft_updated_at=clock_timestamp(),version=version+1 where singleton='site'; return '{}';
when 'restore' then
perform pg_advisory_xact_lock(90210420); select * into h from portfolio_api.content_history where id=item; if h.id is null then raise exception 'History not found'; end if;
tbl:=portfolio_api.content_table(h.section);
execute format('select id from portfolio_api.%I where id=$1 and revision_kind=''DRAFT''',tbl) into target using h.record_id;
if h.before_record_id is null then if target is not null then perform portfolio_api.delete_draft(h.section,target); end if;
else perform portfolio_api.save_draft(h.section,portfolio_api.content_data(h.section,h.before_record_id),target,h.position,null); end if; return '{}';
when 'register_media' then
if (payload->>'path') !~ ('^uploads/'||auth.uid()::text||'/[a-zA-Z0-9._-]+$') or (payload->>'size')::bigint not between 1 and 15728640 then raise exception 'Invalid media'; end if;
if not exists(select 1 from storage.objects where bucket_id='portfolio' and name=payload->>'path') then raise exception 'Upload not found'; end if;
insert into portfolio_api.media_assets(id,created_at,updated_at,version,storage_path,url,filename,content_type,size,deleted) values(gen_random_uuid(),now(),now(),0,payload->>'path',payload->>'url',left(payload->>'filename',255),payload->>'content_type',(payload->>'size')::bigint,false); return jsonb_build_object('url',payload->>'url');
else raise exception 'Unknown action'; end case; end $$;

-- Length/type constraints and a per-session event limit protect anonymous write paths.
create or replace function public.portfolio_event(payload jsonb) returns void language plpgsql security definer set search_path='' as $$ begin
if payload->>'type' not in ('visit','resume','project','social','message') or coalesce(payload->>'type','')='' or length(coalesce(payload->>'label','')) not between 1 and 300 or length(coalesce(payload->>'session_id','')) not between 16 and 80 or payload->>'device' not in ('desktop','mobile','tablet') or coalesce(payload->>'device','')='' or length(coalesce(payload->>'referrer',''))>253 then raise exception 'Invalid event'; end if;
if portfolio_api.is_admin() then return; end if;
if coalesce(payload->>'referrer','') ~* '(^|\.)localhost$|^127\.|^\[?::1\]?$' then return; end if;
perform pg_advisory_xact_lock(hashtextextended(payload->>'session_id',0));
if (select count(*) from portfolio_api.events where session_id=payload->>'session_id' and created_at>now()-interval '1 hour')>=120 then return; end if;
insert into portfolio_api.events(id,created_at,updated_at,version,type,label,session_id,referrer,device) values(gen_random_uuid(),now(),now(),0,payload->>'type',payload->>'label',payload->>'session_id',coalesce(payload->>'referrer',''),payload->>'device'); end $$;

create or replace function public.portfolio_contact(payload jsonb) returns void language plpgsql security definer set search_path='' as $$ begin
if length(trim(coalesce(payload->>'name',''))) not between 1 and 100 or length(coalesce(payload->>'email','')) not between 3 and 150 or (payload->>'email') !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' or length(trim(coalesce(payload->>'subject',''))) not between 1 and 200 or length(trim(coalesce(payload->>'message',''))) not between 1 and 3000 then raise exception 'Invalid contact message'; end if;
perform pg_advisory_xact_lock(hashtextextended(lower(payload->>'email'),1));
if (select count(*) from portfolio_api.messages where lower(email)=lower(payload->>'email') and created_at>now()-interval '1 hour')>=5 then raise exception 'Please try again later'; end if;
insert into portfolio_api.messages(id,created_at,updated_at,version,name,email,subject,message,read,deleted) values(gen_random_uuid(),now(),now(),0,trim(payload->>'name'),lower(payload->>'email'),trim(payload->>'subject'),trim(payload->>'message'),false,false);
if nullif(payload->>'session_id','') is not null then perform public.portfolio_event(payload||jsonb_build_object('type','message','label','Contact form')); end if; end $$;

-- All relational tables use RLS. Old Spring credential/session tables remain private.
do $$ declare t record; p record; begin
for t in select tablename from pg_tables where schemaname='portfolio_api' loop
execute format('alter table portfolio_api.%I enable row level security',t.tablename);
execute format('revoke all on portfolio_api.%I from public,anon,authenticated',t.tablename);
for p in select policyname from pg_policies where schemaname='portfolio_api' and tablename=t.tablename loop execute format('drop policy %I on portfolio_api.%I',p.policyname,t.tablename); end loop;
if t.tablename not in ('admin_users','refresh_tokens','admins') then
execute format('create policy admin_only on portfolio_api.%I for all to authenticated using ((select portfolio_api.is_admin())) with check ((select portfolio_api.is_admin()))',t.tablename);
end if; end loop; end $$;
revoke all on all functions in schema portfolio_api from public,anon,authenticated;
grant usage on schema portfolio_api to authenticated;
grant execute on function portfolio_api.is_admin() to authenticated;
-- Public RPCs check their own read scope or admin membership. No raw draft access.
revoke all on function public.portfolio_admin(text,text,jsonb) from public,anon;
grant execute on function public.portfolio_admin(text,text,jsonb) to authenticated;
revoke all on function public.portfolio_site(),public.portfolio_blog(text),public.portfolio_is_admin(),public.portfolio_contact(jsonb),public.portfolio_event(jsonb) from public;
grant execute on function public.portfolio_site(),public.portfolio_blog(text),public.portfolio_is_admin(),public.portfolio_contact(jsonb),public.portfolio_event(jsonb) to anon,authenticated;

-- Public read bucket, JWT/admin-only writes, restricted types and size.
insert into storage.buckets(id,name,public) values('portfolio','portfolio',true) on conflict(id) do nothing;
update storage.buckets set public=true,file_size_limit=15728640,allowed_mime_types=array['image/jpeg','image/png','image/webp','image/avif','image/gif','image/svg+xml','application/pdf'] where id='portfolio';
do $$ declare p record; begin
for p in select policyname from pg_policies where schemaname='storage' and tablename='objects' and (qual like '%portfolio%' or with_check like '%portfolio%') loop execute format('drop policy %I on storage.objects',p.policyname); end loop; end $$;
create policy portfolio_public_read on storage.objects for select to anon,authenticated using(bucket_id='portfolio');
create policy portfolio_admin_insert on storage.objects for insert to authenticated with check(bucket_id='portfolio' and (select portfolio_api.is_admin()) and name like 'uploads/'||auth.uid()::text||'/%');
-- Never overwrite/remove published assets; uploads get immutable random names.
notify pgrst,'reload schema';


