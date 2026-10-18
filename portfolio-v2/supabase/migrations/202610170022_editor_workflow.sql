-- Blog changes now follow the same private-draft / explicit-Publish workflow.
do $$declare row record;definition text;begin
 if not exists(select 1 from portfolio_api.blog_posts where revision_kind='LIVE') then
  for row in select id,position from portfolio_api.blog_posts where revision_kind='DRAFT' and published loop
   perform portfolio_api.write_content('blog_posts',portfolio_api.content_data('blog_posts',row.id),null,row.position,'LIVE',row.id);
  end loop;
 end if;
 definition:=pg_get_functiondef('portfolio_api.publish_content()'::regprocedure);
 if definition not like '%(''blog_posts'',''blog_posts'')%' then
 definition:=replace(definition,'(''testimonials'',''testimonials''))','(''testimonials'',''testimonials''),(''blog_posts'',''blog_posts''))');
 definition:=replace(definition,'if coalesce((portfolio_api.content_data(entry.section,row.id)->>''visible'')::boolean,true) then','if coalesce((portfolio_api.content_data(entry.section,row.id)->>''visible'')::boolean,true) and (entry.section<>''blog_posts'' or coalesce((portfolio_api.content_data(entry.section,row.id)->>''published'')::boolean,false)) then');
 if definition not like '%(''blog_posts'',''blog_posts'')%' then raise exception 'Blog publish patch failed';end if;execute definition;
 end if;
end $$;
create or replace function portfolio_api.blog_without_maintenance(post_slug text default null) returns jsonb language sql stable security definer set search_path='' as $$
select coalesce(jsonb_agg(jsonb_build_object('id',b.id,'published_at',b.published_at,'data',portfolio_api.content_data('blog_posts',b.id)) order by b.published_at desc,b.position),'[]') from portfolio_api.blog_posts b where b.revision_kind='LIVE' and b.published and (post_slug is null or b.slug=post_slug)
$$;
revoke all on function portfolio_api.blog_without_maintenance(text) from public,anon,authenticated;
create or replace function portfolio_api.editor_review() returns jsonb language plpgsql stable set search_path='' as $$
declare section_name text;tbl text;sections jsonb:='{}';a jsonb;b jsonb;begin
 foreach section_name in array array['profile','focus_items','jobs','projects','skill_groups','education','certificates','testimonials','blog_posts'] loop
 tbl:=portfolio_api.content_table(section_name);
 execute format('select coalesce(jsonb_agg(jsonb_build_object(''id'',coalesce(source_id,id),''position'',position,''data'',portfolio_api.content_data($1,id)) order by position,id),''[]'') from portfolio_api.%I where revision_kind=''LIVE''',tbl) into a using section_name;
 execute format('select coalesce(jsonb_agg(jsonb_build_object(''id'',id,''position'',position,''data'',portfolio_api.content_data($1,id)) order by position,id),''[]'') from portfolio_api.%I where revision_kind=''DRAFT''',tbl) into b using section_name;
 sections:=sections||jsonb_build_object(section_name,jsonb_build_object('before',a,'after',b));end loop;
 return jsonb_build_object('sections',sections,'layout',jsonb_build_object('before',portfolio_api.layout_data((select id from portfolio_api.layouts where revision_kind='LIVE')),'after',portfolio_api.layout_data((select id from portfolio_api.layouts where revision_kind='DRAFT'))));
end $$;
revoke all on function portfolio_api.editor_review() from public,anon,authenticated;
create or replace function public.portfolio_editor_review() returns jsonb language plpgsql security definer set search_path='' as $$declare review jsonb;begin
 if not portfolio_api.is_admin() then raise exception 'Admin access required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(90210420);review:=portfolio_api.editor_review();return jsonb_build_object('review',review,'hash',encode(sha256(convert_to(review::text,'UTF8')),'hex'));
end $$;
create or replace function public.portfolio_save_layout_checked(expected jsonb,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$declare current_layout jsonb;begin
 if not portfolio_api.is_admin() then raise exception 'Admin access required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(90210420);current_layout:=portfolio_api.layout_data((select id from portfolio_api.layouts where revision_kind='DRAFT'));
 if current_layout is distinct from expected then raise exception 'Layout changed in another session. Reload before saving.' using errcode='40001';end if;
 return portfolio_api.rpc_studio('save_layout',payload);
end $$;
alter table portfolio_api.site_state add column if not exists scheduled_review_hash text;
alter table portfolio_api.site_state add column if not exists scheduled_blocked_reason text;
create or replace function public.portfolio_apply_review(action text,expected text,publish_at timestamptz default null) returns void language plpgsql security definer set search_path='' as $$declare current_hash text;begin
 if not portfolio_api.is_admin() then raise exception 'Admin access required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(90210420);current_hash:=encode(sha256(convert_to(portfolio_api.editor_review()::text,'UTF8')),'hex');
 if current_hash is distinct from expected then raise exception 'Draft changed after this comparison. Refresh the review before publishing.' using errcode='40001';end if;
 if action='publish' then perform portfolio_api.publish();update portfolio_api.site_state set scheduled_review_hash=null,scheduled_blocked_reason=null where singleton='site';
 elsif action='schedule' then
 if publish_at is null or publish_at<=now() then raise exception 'Choose a future publication time';end if;
 update portfolio_api.site_state set scheduled_at=publish_at,scheduled_review_hash=current_hash,scheduled_blocked_reason=null where singleton='site';
 else raise exception 'Unknown review action';end if;
end $$;
create or replace function portfolio_api.run_scheduled_publish() returns void language plpgsql security definer set search_path='' as $$declare current_hash text;expected text;begin
 perform pg_advisory_xact_lock(90210420);
 if exists(select 1 from portfolio_api.site_state where singleton='site' and scheduled_at<=now()) then
 select scheduled_review_hash into expected from portfolio_api.site_state where singleton='site';current_hash:=encode(sha256(convert_to(portfolio_api.editor_review()::text,'UTF8')),'hex');
 if expected is not null and expected<>current_hash then update portfolio_api.site_state set scheduled_at=null,scheduled_review_hash=null,scheduled_blocked_reason='The draft changed after scheduling. Review and schedule again.' where singleton='site';
 else perform portfolio_api.publish();update portfolio_api.site_state set scheduled_review_hash=null,scheduled_blocked_reason=null where singleton='site';end if;
 end if;
 delete from portfolio_api.draft_links where expires_at<now()-interval '7 days';
end $$;
create or replace function public.portfolio_schedule_notice() returns text language plpgsql stable security definer set search_path='' as $$begin
 if not portfolio_api.is_admin() then raise exception 'Admin access required' using errcode='42501';end if;
 return (select scheduled_blocked_reason from portfolio_api.site_state where singleton='site');end $$;
revoke all on function public.portfolio_editor_review(),public.portfolio_save_layout_checked(jsonb,jsonb),public.portfolio_apply_review(text,text,timestamptz),public.portfolio_schedule_notice() from public,anon;
grant execute on function public.portfolio_editor_review(),public.portfolio_save_layout_checked(jsonb,jsonb),public.portfolio_apply_review(text,text,timestamptz),public.portfolio_schedule_notice() to authenticated;
notify pgrst,'reload schema';
