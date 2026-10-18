-- Default public appearance is part of the private draft/published layout.
alter table portfolio_api.layouts add column if not exists default_mode text not null default 'dark' check(default_mode in ('dark','light'));
do $$ declare definition text; begin
 definition:=pg_get_functiondef('portfolio_api.layout_data(uuid)'::regprocedure);
 if definition not like '%''default_mode''%' then
  definition:=replace(definition,'''theme_id'',l.theme_id','''default_mode'',l.default_mode,''theme_id'',l.theme_id');
  if definition not like '%''default_mode'',l.default_mode%' then raise exception 'layout_data signature changed';end if;
  execute definition;
 end if;
 definition:=pg_get_functiondef('portfolio_api.copy_layout(uuid,text)'::regprocedure);
 definition:=replace(definition,'layouts(revision_kind,theme_id) select kind,theme_id','layouts(revision_kind,theme_id,default_mode) select kind,theme_id,default_mode');
 execute definition;
 definition:=pg_get_functiondef('portfolio_api.rpc_studio(text,jsonb)'::regprocedure);
 if definition not like '%default_mode=coalesce%' then
  definition:=replace(definition,'before_id:=portfolio_api.copy_layout(target,''HISTORY'');update portfolio_api.layouts set theme_id=theme where',
   'if coalesce(payload->>''default_mode'',''dark'') not in (''dark'',''light'') then raise exception ''Choose dark or light default appearance'';end if; before_id:=portfolio_api.copy_layout(target,''HISTORY'');update portfolio_api.layouts set theme_id=theme,default_mode=coalesce(payload->>''default_mode'',''dark'') where');
  if definition not like '%default_mode=coalesce%' then raise exception 'save_layout implementation changed';end if;
  execute definition;
 end if;
end $$;
