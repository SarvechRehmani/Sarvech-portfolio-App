-- Auth hook setup can rewrite a selected function's grants. The history reader
-- remains an admin-only application RPC, never a Send Email Postgres hook.
revoke all on function public.portfolio_email_history(jsonb),portfolio_api.email_history_read(jsonb) from public,anon,supabase_auth_admin;
grant execute on function public.portfolio_email_history(jsonb),portfolio_api.email_history_read(jsonb) to authenticated;
notify pgrst,'reload schema';
