-- A writable CTE must be a top-level SELECT, not a scalar RETURN expression.
do $$declare d text;begin
 d:=pg_get_functiondef('portfolio_api.mail_jobs(text,jsonb)'::regprocedure);
 d:=replace(d,'return (with picked as','with picked as');
 d:=replace(d,')from marked);',') into result from marked;return result;');
 if d like '%return (with picked%' then raise exception 'Location claim patch failed';end if;
 execute d;
end $$;
