-- The relational column is "read"; the API exposes it as is_read.
do $$declare d text;begin
d:=pg_get_functiondef('portfolio_api.manage(text,jsonb)'::regprocedure);
d:=replace(d,'where not is_read and not is_spam','where not deleted and not "read" and not is_spam');
d:=replace(d,'where not "read" and not is_spam','where not deleted and not "read" and not is_spam');execute d;
end $$;
