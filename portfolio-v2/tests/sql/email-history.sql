begin;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select user_id from portfolio_api.admins limit 1),'role','authenticated','aal','aal2')::text,true);
do $$declare snapshot jsonb;begin snapshot:=public.portfolio_email_history('{}');if not snapshot?'items' or not snapshot?'stats' then raise exception 'History response incomplete';end if;if snapshot->'items'->0 ? 'preview_html' then raise exception 'List leaked full HTML';end if;end $$;
select set_config('request.jwt.claims','{"role":"service_role"}',true);
do $$declare receipt jsonb;again jsonb;begin
 receipt:=public.portfolio_email_worker('prepare','{"event_key":"rollback:auth-receipt","source":"auth","kind":"recovery","recipient":"test@example.com","sender":"studio@example.com","subject":"Rollback test","html":"<p>•••••• — REDACTED</p>","template_version":"auth-v1","redacted":true}');
 if not (receipt->>'send')::boolean then raise exception 'New receipt blocked';end if;
 again:=public.portfolio_email_worker('prepare','{"event_key":"rollback:auth-receipt","source":"auth","kind":"recovery","recipient":"test@example.com","sender":"studio@example.com","subject":"Rollback test","html":"<p>redacted</p>","template_version":"auth-v1","redacted":true}');if (again->>'send')::boolean then raise exception 'Concurrent Auth replay accepted';end if;
 perform public.portfolio_email_worker('accepted',jsonb_build_object('id',receipt->>'id','provider_id','rollback-only'));
 again:=public.portfolio_email_worker('prepare','{"event_key":"rollback:auth-receipt","source":"auth","kind":"recovery","recipient":"test@example.com","sender":"studio@example.com","subject":"Rollback test","html":"<p>different</p>","template_version":"auth-v1","redacted":true}');
 if (again->>'send')::boolean or not (again->>'accepted')::boolean then raise exception 'Accepted Auth email resent';end if;
 if (select preview_html from portfolio_api.email_history where id=(receipt->>'id')::uuid)<>'<p>•••••• — REDACTED</p>' then raise exception 'Accepted snapshot changed';end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select user_id from portfolio_api.admins limit 1),'role','authenticated','aal','aal2')::text,true);
do $$declare result jsonb;begin
 result:=public.portfolio_email_history('{"search":"Rollback test","source":"auth","status":"accepted"}');if (result->>'total')::int<>1 then raise exception 'History filters failed';end if;
 if not (public.portfolio_email_history(jsonb_build_object('id',result->'items'->0->>'id'))->>'redacted')::boolean then raise exception 'Redacted preview flag lost';end if;
 begin perform public.portfolio_email_worker('prepare','{}');raise exception 'Admin could write server receipts';exception when insufficient_privilege then null;end;
end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}',true);
do $$begin begin perform public.portfolio_email_history('{}');raise exception 'Non-admin history access accepted';exception when insufficient_privilege then null;end;end $$;
reset role;
-- A stale queue claim must never erase an ambiguous or accepted SMTP outcome.
do $$declare q uuid;begin
 select id into q from portfolio_api.mail_queue limit 1;
 if q is not null then
  update portfolio_api.email_history set status='unknown',last_error='SMTP outcome uncertain.' where queue_id=q;
  update portfolio_api.mail_queue set status='sending',attempts=attempts+1 where id=q;
  if (select status from portfolio_api.email_history where queue_id=q)<>'unknown' then raise exception 'Stale claim erased uncertain receipt';end if;
  update portfolio_api.email_history set status='accepted',last_error=null where queue_id=q;
  update portfolio_api.mail_queue set status='failed' where id=q;
  if (select status from portfolio_api.email_history where queue_id=q)<>'accepted' then raise exception 'Queue update erased accepted receipt';end if;
 end if;
end $$;
do $$begin if has_function_privilege('anon','public.portfolio_email_history(jsonb)','execute') or has_table_privilege('authenticated','portfolio_api.email_history','select') then raise exception 'Email history exposed';end if;end $$;
rollback;
