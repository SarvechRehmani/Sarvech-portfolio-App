-- Preserve selected effects; allow an explicit instant switch for future saves.
alter table portfolio_api.layouts drop constraint if exists layouts_theme_transition_check;
alter table portfolio_api.layouts alter column theme_transition set default 'none';
alter table portfolio_api.layouts add constraint layouts_theme_transition_check check(theme_transition in('none','blur','portal','slide'));
