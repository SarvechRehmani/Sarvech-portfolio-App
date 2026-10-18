-- Re-copy active previews from any admin session without breaking older shared URLs.
-- The reusable token is private: the table has admin-only RLS and is not in the API schema.
-- Lists, snapshots, history and backups never expose it. Only the checked copy_link action does.
alter table portfolio_api.draft_links add column if not exists copy_token text
  check(copy_token is null or copy_token ~ '^[a-f0-9]{64}$');

do $$ declare definition text; begin
 definition:=pg_get_functiondef('portfolio_api.rpc_studio(text,jsonb)'::regprocedure);
 if definition not like '%when ''copy_link''%' then
  definition:=replace(definition,'when ''revoke_link'' then',
   'when ''copy_link'' then
    update portfolio_api.draft_links
    set copy_token=coalesce(copy_token,replace(gen_random_uuid()::text||gen_random_uuid()::text,''-'',''''))
    where id=item and revoked_at is null and expires_at>now()
    returning jsonb_build_object(''token'',copy_token) into v;
    if v is null then raise exception ''This private link has expired or was revoked.'' using errcode=''42501'';end if;
    return v;
   when ''revoke_link'' then');
  if definition not like '%when ''copy_link''%' then raise exception 'Shared-preview action signature changed';end if;
  execute definition;
 end if;
 definition:=pg_get_functiondef('portfolio_api.rpc_shared_draft(text)'::regprocedure);
 if definition not like '%copy_token=token%' then
  definition:=replace(definition,'where token_hash=encode(sha256(convert_to(token,''UTF8'')),''hex'') and',
   'where (token_hash=encode(sha256(convert_to(token,''UTF8'')),''hex'') or copy_token=token) and');
  if definition not like '%copy_token=token%' then raise exception 'Shared-preview validator signature changed';end if;
  execute definition;
 end if;
end $$;

