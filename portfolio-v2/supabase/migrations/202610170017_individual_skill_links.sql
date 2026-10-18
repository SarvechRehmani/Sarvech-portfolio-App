create table if not exists portfolio_api.skill_connections(
 category_id uuid not null references portfolio_api.skill_categories(id) on delete cascade,
 source_skill varchar(120) not null,target_skill varchar(120) not null,position integer not null default 0,
 primary key(category_id,source_skill,target_skill),check(source_skill<>target_skill));
alter table portfolio_api.skill_connections enable row level security;
revoke all on portfolio_api.skill_connections from public,anon,authenticated;
do $$begin
if to_regprocedure('portfolio_api.content_data_before_skill_links(text,uuid)')is null then alter function portfolio_api.content_data(text,uuid)rename to content_data_before_skill_links;end if;
if to_regprocedure('portfolio_api.write_content_before_skill_links(text,jsonb,uuid,integer,text,uuid)')is null then alter function portfolio_api.write_content(text,jsonb,uuid,integer,text,uuid)rename to write_content_before_skill_links;end if;
end $$;
create or replace function portfolio_api.content_data(section text,item uuid)returns jsonb language plpgsql stable set search_path='' as $$declare result jsonb;begin
result:=portfolio_api.content_data_before_skill_links(section,item);
if section='skill_groups' then result:=result||jsonb_build_object('connections_by_skill',coalesce((select jsonb_object_agg(source_skill,targets)from(select source_skill,jsonb_agg(target_skill order by position)targets from portfolio_api.skill_connections where category_id=item group by source_skill)x),'{}'));
end if;return result;end $$;
create or replace function portfolio_api.write_content(section text,payload jsonb,item uuid default null,sort_order integer default 0,kind text default 'DRAFT',source uuid default null)returns uuid language plpgsql set search_path='' as $$declare target uuid;entry record;link record;begin
target:=portfolio_api.write_content_before_skill_links(section,payload,item,sort_order,kind,source);
if section='skill_groups' and payload?'connections_by_skill' then
 if jsonb_typeof(payload->'connections_by_skill')<>'object' then raise exception 'Choose connections for an individual skill';end if;
 delete from portfolio_api.skill_connections where category_id=target;
 for entry in select * from jsonb_each(payload->'connections_by_skill')loop
  if not exists(select 1 from jsonb_array_elements_text(payload->'names')name where name=entry.key)then raise exception 'Connection source must belong to this category';end if;
  if jsonb_typeof(entry.value)<>'array' or jsonb_array_length(entry.value)>7 then raise exception 'Choose up to 7 individual connected skills';end if;
  for link in select value as name,ordinality as n from jsonb_array_elements_text(entry.value)with ordinality loop
   if entry.key=link.name then raise exception 'A skill cannot connect to itself';end if;
   if length(trim(link.name))not between 1 and 120 then raise exception 'Choose a valid individual connected skill';end if;
   insert into portfolio_api.skill_connections values(target,entry.key,link.name,link.n::integer)on conflict do nothing;
  end loop;
 end loop;
end if;return target;end $$;
revoke all on function portfolio_api.content_data(text,uuid),portfolio_api.write_content(text,jsonb,uuid,integer,text,uuid) from public,anon,authenticated;
notify pgrst,'reload schema';
