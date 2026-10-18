-- Read-only checks to run in the Supabase SQL editor after migrations.
select tablename,rowsecurity from pg_tables where schemaname='portfolio_api' order by tablename;
select table_name,column_name from information_schema.columns where table_schema='portfolio_api' and data_type in ('json','jsonb'); -- must return no rows
select n.nspname,p.proname,p.prosecdef,p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where (n.nspname='portfolio_api' or (n.nspname='public' and p.proname like 'portfolio_%')) order by 1,2;
select grantee,table_name,privilege_type from information_schema.role_table_grants where table_schema='portfolio_api' and grantee in ('anon','authenticated','PUBLIC'); -- no raw-table grants
select schemaname,tablename,policyname,roles,cmd from pg_policies where schemaname='portfolio_api' or (schemaname='storage' and policyname like 'portfolio_%');
select public.portfolio_is_admin(); -- false in anonymous sessions
