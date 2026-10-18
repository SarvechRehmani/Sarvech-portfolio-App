-- Run as the database owner. Disposable tests are always rolled back.
begin;
do $$ declare original text:=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-',''); target uuid; copied text; blocked boolean:=false; begin
 perform set_config('request.jwt.claims',jsonb_build_object('sub',(select user_id from portfolio_api.admins limit 1),'role','authenticated','aal','aal2')::text,true);
 target:=(public.portfolio_studio('create_link',jsonb_build_object('token',original,'label','Rollback copy verification','hours',1))->>'id')::uuid;
 copied:=public.portfolio_studio('copy_link',jsonb_build_object('id',target))->>'token';
 if length(copied)<>64 or copied !~ '^[a-f0-9]+$' then raise exception 'Invalid copied token';end if;
 if public.portfolio_studio('copy_link',jsonb_build_object('id',target))->>'token'<>copied then raise exception 'Re-copy invalidates an existing copy';end if;
 if public.portfolio_studio('links')::text like '%'||copied||'%' then raise exception 'Token leaked in list';end if;
 if public.portfolio_studio('backup')::text like '%'||copied||'%' then raise exception 'Token leaked in backup';end if;
 perform set_config('test.preview_original',original,true);
 perform set_config('test.preview_copy',copied,true);
 perform set_config('test.preview_id',target::text,true);
 perform set_config('request.jwt.claims','{"role":"anon"}',true);
 begin perform public.portfolio_studio('copy_link',jsonb_build_object('id',target));exception when insufficient_privilege then blocked:=true;end;
 if not blocked then raise exception 'Anonymous caller copied a private link';end if;
end $$;
set local role anon;
do $$ declare blocked boolean:=false; begin
 if public.portfolio_shared_draft(current_setting('test.preview_original'))->'profile' is null then raise exception 'Original link broke';end if;
 if public.portfolio_shared_draft(current_setting('test.preview_copy'))->'profile' is null then raise exception 'Copied link failed';end if;
 begin perform copy_token from portfolio_api.draft_links;exception when insufficient_privilege then blocked:=true;end;
 if not blocked then raise exception 'Anonymous caller read private tokens';end if;
end $$;
reset role;
do $$ declare blocked boolean:=false; begin
 perform set_config('request.jwt.claims',jsonb_build_object('sub',(select user_id from portfolio_api.admins limit 1),'role','authenticated','aal','aal2')::text,true);
 update portfolio_api.draft_links set expires_at=now()-interval '1 minute',created_at=now()-interval '2 minutes' where id=current_setting('test.preview_id')::uuid;
 begin perform public.portfolio_studio('copy_link',jsonb_build_object('id',current_setting('test.preview_id')));exception when insufficient_privilege then blocked:=true;end;
 if not blocked then raise exception 'Expired link could be copied';end if;
 blocked:=false;
 begin perform public.portfolio_shared_draft(current_setting('test.preview_copy'));exception when insufficient_privilege then blocked:=true;end;
 if not blocked then raise exception 'Expired copy could be opened';end if;
 perform public.portfolio_studio('revoke_link',jsonb_build_object('id',current_setting('test.preview_id')));
end $$;
set local role anon;
do $$ declare blocked boolean; token text; begin
 foreach token in array array[current_setting('test.preview_original'),current_setting('test.preview_copy')] loop
  blocked:=false;
  begin perform public.portfolio_shared_draft(token);exception when insufficient_privilege then blocked:=true;end;
  if not blocked then raise exception 'Revoked link still opens';end if;
 end loop;
end $$;
reset role;
rollback;
