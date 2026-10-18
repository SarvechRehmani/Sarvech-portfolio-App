begin;
update portfolio_api.layouts set theme_transition='none' where revision_kind='DRAFT';
do $$declare selected uuid;copied uuid;begin
 select id into selected from portfolio_api.layouts where revision_kind='DRAFT' limit 1;
 if selected is null then raise exception 'Draft layout missing';end if;
 if portfolio_api.layout_data(selected)->>'theme_transition' is distinct from 'none' then raise exception 'No effect did not serialize';end if;
 copied:=portfolio_api.copy_layout(selected,'HISTORY');
 if (select theme_transition from portfolio_api.layouts where id=copied) is distinct from 'none' then raise exception 'History lost instant choice';end if;
end $$;
rollback;
