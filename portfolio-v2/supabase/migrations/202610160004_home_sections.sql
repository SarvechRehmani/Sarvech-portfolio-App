-- Give testimonials and the blog their own home-section controls while preserving
-- the previous combined extras group's order and visibility.
alter table portfolio_api.home_sections drop constraint if exists home_sections_section_key_check;
alter table portfolio_api.home_sections add constraint home_sections_section_key_check check(section_key in ('about','experience','education','skills','projects','certificates','contact','additional','testimonials','blog'));
do $$ declare layout record; anchor integer; enabled_state boolean; definition text;begin
for layout in select id from portfolio_api.layouts where not exists(select 1 from portfolio_api.home_sections where layout_id=layouts.id and section_key='testimonials') loop
select position,enabled into anchor,enabled_state from portfolio_api.home_sections where layout_id=layout.id and section_key='additional';
anchor:=coalesce(anchor,7);enabled_state:=coalesce(enabled_state,true);
update portfolio_api.home_sections set position=position+2 where layout_id=layout.id and position>anchor;
insert into portfolio_api.home_sections values(layout.id,'testimonials',anchor+1,enabled_state),(layout.id,'blog',anchor+2,enabled_state);
end loop;
definition:=pg_get_functiondef('portfolio_api.rpc_studio(text,jsonb)'::regprocedure);
definition:=replace(definition,'jsonb_array_length(sections)<>8','jsonb_array_length(sections)<>10');
definition:=replace(definition,'count(distinct s->>''key'') from jsonb_array_elements(sections) s)<>8','count(distinct s->>''key'') from jsonb_array_elements(sections) s)<>10');
definition:=replace(definition,$old$'certificates','contact','additional')$old$,$new$'certificates','contact','additional','testimonials','blog')$new$);
-- Accept existing v1/v2 backups that grouped all extras together.
definition:=replace(definition,$old$sections:=payload->'sections';$old$,$new$sections:=payload->'sections';
if jsonb_typeof(sections)='array' and jsonb_array_length(sections)=8 then
sections:=sections||jsonb_build_array(jsonb_build_object('key','testimonials','enabled',coalesce((select (s->>'enabled')::boolean from jsonb_array_elements(sections) s where s->>'key'='additional'),true)),jsonb_build_object('key','blog','enabled',coalesce((select (s->>'enabled')::boolean from jsonb_array_elements(sections) s where s->>'key'='additional'),true)));
end if;$new$);
execute definition;
end $$;
notify pgrst,'reload schema';
