-- Count rows without assembling their HTML and media payloads on every tab switch.
do $$declare d text;begin
 d:=pg_get_functiondef('portfolio_api.manage(text,jsonb)'::regprocedure);
 d:=replace(d,'result:=result||jsonb_build_object(section,jsonb_array_length(portfolio_api.content_rows(section)));','execute format(''select count(*) from portfolio_api.%I where revision_kind=''''DRAFT'''''',portfolio_api.content_table(section)) into amount;result:=result||jsonb_build_object(section,amount);');
 if d not like '%''new_login''%' then d:=replace(d,'jsonb_build_object(''mfa'',','jsonb_build_object(''new_login'',exists(select 1 from portfolio_api.session_activity where session_id::text=auth.jwt()->>''session_id'' and not recognized and created_at>now()-interval ''24 hours''),''mfa'',');end if;
 d:=replace(d,'e.label=s.url and e.created_at','split_part(regexp_replace(lower(e.label),''^https?://(www[.])?'',''''),''/'',1)=split_part(regexp_replace(lower(s.url),''^https?://(www[.])?'',''''),''/'',1) and e.created_at');
 execute d;
end $$;
