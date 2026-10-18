-- Preserve uncertain/accepted outcomes across automatic queue claims to prevent duplicate SMTP sends.
do $$declare definition text;begin
 definition:=pg_get_functiondef('portfolio_api.capture_email_queue()'::regprocedure);
 definition:=replace(definition,'status=excluded.status,attempts=excluded.attempts','status=case when email_history.status in (''unknown'',''accepted'') then email_history.status else excluded.status end,attempts=excluded.attempts');
 definition:=replace(definition,'last_error=excluded.last_error','last_error=case when email_history.status=''unknown'' then email_history.last_error when email_history.status=''accepted'' then null else excluded.last_error end');
 execute definition;
end $$;
-- Original notification recipients were not recorded at send time; never guess from today's profile.
update portfolio_api.email_history set recipient='' where source='contact' and kind='notification' and status='accepted' and template_version='legacy-reconstructed' and preview_html is null;
notify pgrst,'reload schema';
