begin;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub','00000000-0000-0000-0000-000000000001','role','authenticated','aal','aal2')::text,true);
do $$begin
 begin perform public.portfolio_editor_review();raise exception 'Non-admin review accepted';exception when insufficient_privilege then null;end;
 begin perform public.portfolio_apply_review('publish','bad');raise exception 'Non-admin publish accepted';exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
