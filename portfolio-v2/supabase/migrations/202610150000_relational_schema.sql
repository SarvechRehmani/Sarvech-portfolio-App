-- Relational baseline; no JSON content columns.
create schema if not exists portfolio_api;
create table if not exists portfolio_api.admins(
  "user_id" uuid not null,
  "created_at" timestamp with time zone not null default now()
);
create table if not exists portfolio_api.blog_posts(
  "id" uuid not null,
  "created_at" timestamp(6) with time zone not null,
  "updated_at" timestamp(6) with time zone not null,
  "version" bigint not null,
  "position" integer not null,
  "published" boolean not null,
  "published_at" timestamp(6) with time zone,
  "revision_kind" character varying(12) not null,
  "slug" character varying(200),
  "source_id" uuid,
  "content" text,
  "cover" text,
  "excerpt" text,
  "seo_description" text,
  "seo_title" text,
  "title" text
);
create table if not exists portfolio_api.blog_posts_tags(
  "blog_post_id" uuid not null,
  "item_text" text,
  "position" integer not null
);
create table if not exists portfolio_api.certificates(
  "id" uuid not null,
  "created_at" timestamp(6) with time zone not null,
  "updated_at" timestamp(6) with time zone not null,
  "version" bigint not null,
  "position" integer not null,
  "published" boolean not null,
  "published_at" timestamp(6) with time zone,
  "revision_kind" character varying(12) not null,
  "slug" character varying(200),
  "source_id" uuid,
  "alt" text,
  "date" text,
  "description" text,
  "image" text,
  "issuer" text,
  "theme" text,
  "title" text,
  "url" text
);
create table if not exists portfolio_api.content_history(
  "id" uuid not null,
  "created_at" timestamp(6) with time zone not null,
  "updated_at" timestamp(6) with time zone not null,
  "version" bigint not null,
  "actor" character varying(255),
  "after_record_id" uuid,
  "before_record_id" uuid,
  "operation" character varying(20) not null,
  "position" integer not null,
  "record_id" uuid,
  "section" character varying(50) not null
);
create table if not exists portfolio_api.education(
  "id" uuid not null,
  "created_at" timestamp(6) with time zone not null,
  "updated_at" timestamp(6) with time zone not null,
  "version" bigint not null,
  "position" integer not null,
  "published" boolean not null,
  "published_at" timestamp(6) with time zone,
  "revision_kind" character varying(12) not null,
  "slug" character varying(200),
  "source_id" uuid,
  "cgpa" text,
  "date" text,
  "degree" text,
  "gpa" text,
  "institution" text,
  "institution_url" text,
  "location" text,
  "title" text,
  "url" text,
  "graduation_year" text
);
create table if not exists portfolio_api.events(
  "id" uuid not null,
  "created_at" timestamp(6) with time zone not null,
  "updated_at" timestamp(6) with time zone not null,
  "version" bigint not null,
  "device" character varying(12) not null,
  "label" character varying(300) not null,
  "referrer" character varying(253),
  "session_id" character varying(80) not null,
  "type" character varying(20) not null
);
create table if not exists portfolio_api.experiences(
  "id" uuid not null,
  "created_at" timestamp(6) with time zone not null,
  "updated_at" timestamp(6) with time zone not null,
  "version" bigint not null,
  "position" integer not null,
  "published" boolean not null,
  "published_at" timestamp(6) with time zone,
  "revision_kind" character varying(12) not null,
  "slug" character varying(200),
  "source_id" uuid,
  "company" text,
  "company_url" text,
  "contribution" text,
  "date" text,
  "location" text,
  "title" text,
  "vendor" text
);
create table if not exists portfolio_api.experiences_contributions(
  "experience_id" uuid not null,
  "item_text" text,
  "position" integer not null
);
create table if not exists portfolio_api.experiences_responsibilities(
  "experience_id" uuid not null,
  "item_text" text,
  "position" integer not null
);
create table if not exists portfolio_api.focus_items(
  "id" uuid not null,
  "created_at" timestamp(6) with time zone not null,
  "updated_at" timestamp(6) with time zone not null,
  "version" bigint not null,
  "position" integer not null,
  "published" boolean not null,
  "published_at" timestamp(6) with time zone,
  "revision_kind" character varying(12) not null,
  "slug" character varying(200),
  "source_id" uuid,
  "description" text,
  "icon" text,
  "image" text,
  "image_alt" text,
  "title" text
);
create table if not exists portfolio_api.focus_items_tags(
  "focus_item_id" uuid not null,
  "item_text" text,
  "position" integer not null
);
create table if not exists portfolio_api.media_assets(
  "id" uuid not null,
  "created_at" timestamp(6) with time zone not null,
  "updated_at" timestamp(6) with time zone not null,
  "version" bigint not null,
  "content_type" character varying(255),
  "deleted" boolean not null,
  "filename" character varying(255),
  "size" bigint not null,
  "storage_path" character varying(255) not null,
  "url" character varying(2000) not null
);
create table if not exists portfolio_api.messages(
  "id" uuid not null,
  "created_at" timestamp(6) with time zone not null,
  "updated_at" timestamp(6) with time zone not null,
  "version" bigint not null,
  "deleted" boolean not null,
  "email" character varying(150) not null,
  "message" character varying(3000) not null,
  "name" character varying(100) not null,
  "read" boolean not null,
  "subject" character varying(200) not null
);
create table if not exists portfolio_api.profile_site_copy(
  "profile_id" uuid not null,
  "alt_value" text,
  "href_value" text,
  "html_value" text,
  "src_value" text,
  "text_value" text,
  "title_value" text,
  "selector" character varying(500) not null
);
create table if not exists portfolio_api.profiles(
  "id" uuid not null,
  "created_at" timestamp(6) with time zone not null,
  "updated_at" timestamp(6) with time zone not null,
  "version" bigint not null,
  "position" integer not null,
  "published" boolean not null,
  "published_at" timestamp(6) with time zone,
  "revision_kind" character varying(12) not null,
  "slug" character varying(200),
  "source_id" uuid,
  "brand" text,
  "brand_suffix" text,
  "cta_href" text,
  "cta_target" text,
  "cta_text" text,
  "email" text,
  "hero_description" text,
  "hero_title" text,
  "image_alt" text,
  "image_src" text,
  "initial" text,
  "location" text,
  "location_map" text,
  "name" text,
  "name_with_break" text,
  "og_image" text,
  "phone" text,
  "resume_link" text,
  "resume_mode" text,
  "resume_summary" text,
  "resume_url" text,
  "seo_description" text,
  "seo_title" text,
  "specialization" text,
  "teaser" text,
  "website" text
);
create table if not exists portfolio_api.profiles_description(
  "profile_id" uuid not null,
  "item_text" text,
  "position" integer not null
);
create table if not exists portfolio_api.profiles_languages(
  "profile_id" uuid not null,
  "item_text" text,
  "position" integer not null
);
create table if not exists portfolio_api.profiles_roles(
  "profile_id" uuid not null,
  "item_text" text,
  "position" integer not null
);
create table if not exists portfolio_api.profiles_socials(
  "profile_id" uuid not null,
  "icon" text,
  "title" text,
  "url" text,
  "position" integer not null
);
create table if not exists portfolio_api.profiles_soft_skills(
  "profile_id" uuid not null,
  "item_text" text,
  "position" integer not null
);
create table if not exists portfolio_api.profiles_stats(
  "profile_id" uuid not null,
  "description" text,
  "stat_number" text,
  "position" integer not null
);
create table if not exists portfolio_api.projects(
  "id" uuid not null,
  "created_at" timestamp(6) with time zone not null,
  "updated_at" timestamp(6) with time zone not null,
  "version" bigint not null,
  "position" integer not null,
  "published" boolean not null,
  "published_at" timestamp(6) with time zone,
  "revision_kind" character varying(12) not null,
  "slug" character varying(200),
  "source_id" uuid,
  "category" text,
  "client" text,
  "coming_soon" boolean not null,
  "date" text,
  "description" text,
  "featured" boolean not null,
  "in_resume" boolean not null,
  "legacy_id" text,
  "link" text,
  "github_url" text,
  "github_frontend_url" text,
  "live_url" text,
  "long_description" text,
  "name" text,
  "overview" text,
  "status" text,
  "summary" text,
  "title" text,
  "visible" boolean not null
);
create table if not exists portfolio_api.projects_extra_features(
  "project_id" uuid not null,
  "item_text" text,
  "position" integer not null
);
create table if not exists portfolio_api.projects_features(
  "project_id" uuid not null,
  "item_text" text,
  "position" integer not null
);
create table if not exists portfolio_api.projects_images(
  "project_id" uuid not null,
  "item_text" text,
  "position" integer not null
);
create table if not exists portfolio_api.projects_tags(
  "project_id" uuid not null,
  "item_text" text,
  "position" integer not null
);
create table if not exists portfolio_api.projects_technologies(
  "project_id" uuid not null,
  "item_text" text,
  "position" integer not null
);
create table if not exists portfolio_api.site_state(
  "id" uuid not null,
  "created_at" timestamp(6) with time zone not null,
  "updated_at" timestamp(6) with time zone not null,
  "version" bigint not null,
  "draft_updated_at" timestamp(6) with time zone,
  "published_at" timestamp(6) with time zone,
  "singleton" character varying(255) not null
);
create table if not exists portfolio_api.skill_categories(
  "id" uuid not null,
  "created_at" timestamp(6) with time zone not null,
  "updated_at" timestamp(6) with time zone not null,
  "version" bigint not null,
  "position" integer not null,
  "published" boolean not null,
  "published_at" timestamp(6) with time zone,
  "revision_kind" character varying(12) not null,
  "slug" character varying(200),
  "source_id" uuid,
  "description" text,
  "icon" text,
  "title" text
);
create table if not exists portfolio_api.skill_categories_connections(
  "skill_categorie_id" uuid not null,
  "item_text" text,
  "position" integer not null
);
create table if not exists portfolio_api.skill_categories_names(
  "skill_categorie_id" uuid not null,
  "item_text" text,
  "position" integer not null
);
create table if not exists portfolio_api.testimonials(
  "id" uuid not null,
  "created_at" timestamp(6) with time zone not null,
  "updated_at" timestamp(6) with time zone not null,
  "version" bigint not null,
  "position" integer not null,
  "published" boolean not null,
  "published_at" timestamp(6) with time zone,
  "revision_kind" character varying(12) not null,
  "slug" character varying(200),
  "source_id" uuid,
  "avatar" text,
  "name" text,
  "quote" text,
  "role" text,
  "visible" boolean not null
);
do $$ begin if not exists(select 1 from pg_constraint where conname='admins_pkey' and conrelid='portfolio_api.admins'::regclass) then alter table portfolio_api.admins add constraint "admins_pkey" PRIMARY KEY (user_id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='blog_posts_pkey' and conrelid='portfolio_api.blog_posts'::regclass) then alter table portfolio_api.blog_posts add constraint "blog_posts_pkey" PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='blog_posts_tags_pkey' and conrelid='portfolio_api.blog_posts_tags'::regclass) then alter table portfolio_api.blog_posts_tags add constraint "blog_posts_tags_pkey" PRIMARY KEY (blog_post_id, "position"); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='certificates_pkey' and conrelid='portfolio_api.certificates'::regclass) then alter table portfolio_api.certificates add constraint "certificates_pkey" PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='content_history_pkey' and conrelid='portfolio_api.content_history'::regclass) then alter table portfolio_api.content_history add constraint "content_history_pkey" PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='education_pkey' and conrelid='portfolio_api.education'::regclass) then alter table portfolio_api.education add constraint "education_pkey" PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='events_pkey' and conrelid='portfolio_api.events'::regclass) then alter table portfolio_api.events add constraint "events_pkey" PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='experiences_contributions_pkey' and conrelid='portfolio_api.experiences_contributions'::regclass) then alter table portfolio_api.experiences_contributions add constraint "experiences_contributions_pkey" PRIMARY KEY (experience_id, "position"); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='experiences_pkey' and conrelid='portfolio_api.experiences'::regclass) then alter table portfolio_api.experiences add constraint "experiences_pkey" PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='experiences_responsibilities_pkey' and conrelid='portfolio_api.experiences_responsibilities'::regclass) then alter table portfolio_api.experiences_responsibilities add constraint "experiences_responsibilities_pkey" PRIMARY KEY (experience_id, "position"); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='focus_items_pkey' and conrelid='portfolio_api.focus_items'::regclass) then alter table portfolio_api.focus_items add constraint "focus_items_pkey" PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='focus_items_tags_pkey' and conrelid='portfolio_api.focus_items_tags'::regclass) then alter table portfolio_api.focus_items_tags add constraint "focus_items_tags_pkey" PRIMARY KEY (focus_item_id, "position"); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='media_assets_pkey' and conrelid='portfolio_api.media_assets'::regclass) then alter table portfolio_api.media_assets add constraint "media_assets_pkey" PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='messages_pkey' and conrelid='portfolio_api.messages'::regclass) then alter table portfolio_api.messages add constraint "messages_pkey" PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='profile_site_copy_pkey' and conrelid='portfolio_api.profile_site_copy'::regclass) then alter table portfolio_api.profile_site_copy add constraint "profile_site_copy_pkey" PRIMARY KEY (profile_id, selector); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='profiles_description_pkey' and conrelid='portfolio_api.profiles_description'::regclass) then alter table portfolio_api.profiles_description add constraint "profiles_description_pkey" PRIMARY KEY (profile_id, "position"); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='profiles_languages_pkey' and conrelid='portfolio_api.profiles_languages'::regclass) then alter table portfolio_api.profiles_languages add constraint "profiles_languages_pkey" PRIMARY KEY (profile_id, "position"); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='profiles_pkey' and conrelid='portfolio_api.profiles'::regclass) then alter table portfolio_api.profiles add constraint "profiles_pkey" PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='profiles_roles_pkey' and conrelid='portfolio_api.profiles_roles'::regclass) then alter table portfolio_api.profiles_roles add constraint "profiles_roles_pkey" PRIMARY KEY (profile_id, "position"); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='profiles_socials_pkey' and conrelid='portfolio_api.profiles_socials'::regclass) then alter table portfolio_api.profiles_socials add constraint "profiles_socials_pkey" PRIMARY KEY (profile_id, "position"); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='profiles_soft_skills_pkey' and conrelid='portfolio_api.profiles_soft_skills'::regclass) then alter table portfolio_api.profiles_soft_skills add constraint "profiles_soft_skills_pkey" PRIMARY KEY (profile_id, "position"); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='profiles_stats_pkey' and conrelid='portfolio_api.profiles_stats'::regclass) then alter table portfolio_api.profiles_stats add constraint "profiles_stats_pkey" PRIMARY KEY (profile_id, "position"); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='projects_extra_features_pkey' and conrelid='portfolio_api.projects_extra_features'::regclass) then alter table portfolio_api.projects_extra_features add constraint "projects_extra_features_pkey" PRIMARY KEY (project_id, "position"); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='projects_features_pkey' and conrelid='portfolio_api.projects_features'::regclass) then alter table portfolio_api.projects_features add constraint "projects_features_pkey" PRIMARY KEY (project_id, "position"); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='projects_images_pkey' and conrelid='portfolio_api.projects_images'::regclass) then alter table portfolio_api.projects_images add constraint "projects_images_pkey" PRIMARY KEY (project_id, "position"); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='projects_pkey' and conrelid='portfolio_api.projects'::regclass) then alter table portfolio_api.projects add constraint "projects_pkey" PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='projects_tags_pkey' and conrelid='portfolio_api.projects_tags'::regclass) then alter table portfolio_api.projects_tags add constraint "projects_tags_pkey" PRIMARY KEY (project_id, "position"); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='projects_technologies_pkey' and conrelid='portfolio_api.projects_technologies'::regclass) then alter table portfolio_api.projects_technologies add constraint "projects_technologies_pkey" PRIMARY KEY (project_id, "position"); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='site_state_pkey' and conrelid='portfolio_api.site_state'::regclass) then alter table portfolio_api.site_state add constraint "site_state_pkey" PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='skill_categories_connections_pkey' and conrelid='portfolio_api.skill_categories_connections'::regclass) then alter table portfolio_api.skill_categories_connections add constraint "skill_categories_connections_pkey" PRIMARY KEY (skill_categorie_id, "position"); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='skill_categories_names_pkey' and conrelid='portfolio_api.skill_categories_names'::regclass) then alter table portfolio_api.skill_categories_names add constraint "skill_categories_names_pkey" PRIMARY KEY (skill_categorie_id, "position"); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='skill_categories_pkey' and conrelid='portfolio_api.skill_categories'::regclass) then alter table portfolio_api.skill_categories add constraint "skill_categories_pkey" PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='testimonials_pkey' and conrelid='portfolio_api.testimonials'::regclass) then alter table portfolio_api.testimonials add constraint "testimonials_pkey" PRIMARY KEY (id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='uk8bgn09eltbkjhdu8d728cpwd1' and conrelid='portfolio_api.site_state'::regclass) then alter table portfolio_api.site_state add constraint "uk8bgn09eltbkjhdu8d728cpwd1" UNIQUE (singleton); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='uksboficqt4g2d4mrg45krwmt6j' and conrelid='portfolio_api.media_assets'::regclass) then alter table portfolio_api.media_assets add constraint "uksboficqt4g2d4mrg45krwmt6j" UNIQUE (storage_path); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='admins_user_id_fkey' and conrelid='portfolio_api.admins'::regclass) then alter table portfolio_api.admins add constraint "admins_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='event_device_valid' and conrelid='portfolio_api.events'::regclass) then alter table portfolio_api.events add constraint "event_device_valid" CHECK (((device)::text = ANY ((ARRAY['desktop'::character varying, 'mobile'::character varying, 'tablet'::character varying])::text[]))); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='event_session_valid' and conrelid='portfolio_api.events'::regclass) then alter table portfolio_api.events add constraint "event_session_valid" CHECK (((length((session_id)::text) >= 16) AND (length((session_id)::text) <= 80))); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='event_type_valid' and conrelid='portfolio_api.events'::regclass) then alter table portfolio_api.events add constraint "event_type_valid" CHECK (((type)::text = ANY ((ARRAY['visit'::character varying, 'resume'::character varying, 'project'::character varying, 'social'::character varying, 'message'::character varying])::text[]))); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='fk4gvcjoxv2low7bdv0vdothwbq' and conrelid='portfolio_api.experiences_responsibilities'::regclass) then alter table portfolio_api.experiences_responsibilities add constraint "fk4gvcjoxv2low7bdv0vdothwbq" FOREIGN KEY (experience_id) REFERENCES portfolio_api.experiences(id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='fk51wpbc81wjv8o01wyd8jdhfua' and conrelid='portfolio_api.projects_features'::regclass) then alter table portfolio_api.projects_features add constraint "fk51wpbc81wjv8o01wyd8jdhfua" FOREIGN KEY (project_id) REFERENCES portfolio_api.projects(id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='fk65ckcpnuwy7kc6kkp1yr4ltr' and conrelid='portfolio_api.projects_extra_features'::regclass) then alter table portfolio_api.projects_extra_features add constraint "fk65ckcpnuwy7kc6kkp1yr4ltr" FOREIGN KEY (project_id) REFERENCES portfolio_api.projects(id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='fk6x9p867deag6hw0blxralns43' and conrelid='portfolio_api.projects_technologies'::regclass) then alter table portfolio_api.projects_technologies add constraint "fk6x9p867deag6hw0blxralns43" FOREIGN KEY (project_id) REFERENCES portfolio_api.projects(id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='fk71ce8rryaw47aktr0nwasq26' and conrelid='portfolio_api.profiles_socials'::regclass) then alter table portfolio_api.profiles_socials add constraint "fk71ce8rryaw47aktr0nwasq26" FOREIGN KEY (profile_id) REFERENCES portfolio_api.profiles(id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='fk9f15i0k32n8ilskrvfi1jyr26' and conrelid='portfolio_api.profiles_stats'::regclass) then alter table portfolio_api.profiles_stats add constraint "fk9f15i0k32n8ilskrvfi1jyr26" FOREIGN KEY (profile_id) REFERENCES portfolio_api.profiles(id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='fkbooi52m5qxt44mk6o0jvygqqg' and conrelid='portfolio_api.profile_site_copy'::regclass) then alter table portfolio_api.profile_site_copy add constraint "fkbooi52m5qxt44mk6o0jvygqqg" FOREIGN KEY (profile_id) REFERENCES portfolio_api.profiles(id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='fkbotmp3isbgg97sejh2f6aue9k' and conrelid='portfolio_api.profiles_soft_skills'::regclass) then alter table portfolio_api.profiles_soft_skills add constraint "fkbotmp3isbgg97sejh2f6aue9k" FOREIGN KEY (profile_id) REFERENCES portfolio_api.profiles(id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='fkbsv0beie2itgeo7y7vxdhc3r' and conrelid='portfolio_api.blog_posts_tags'::regclass) then alter table portfolio_api.blog_posts_tags add constraint "fkbsv0beie2itgeo7y7vxdhc3r" FOREIGN KEY (blog_post_id) REFERENCES portfolio_api.blog_posts(id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='fkdq4h7rwvr9jg8lve9t0jx67xc' and conrelid='portfolio_api.focus_items_tags'::regclass) then alter table portfolio_api.focus_items_tags add constraint "fkdq4h7rwvr9jg8lve9t0jx67xc" FOREIGN KEY (focus_item_id) REFERENCES portfolio_api.focus_items(id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='fkh6jc2nna79ecxg3vpebopjcml' and conrelid='portfolio_api.skill_categories_names'::regclass) then alter table portfolio_api.skill_categories_names add constraint "fkh6jc2nna79ecxg3vpebopjcml" FOREIGN KEY (skill_categorie_id) REFERENCES portfolio_api.skill_categories(id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='fkhflroqxlvhdcq4qyhd1vgnf9t' and conrelid='portfolio_api.projects_tags'::regclass) then alter table portfolio_api.projects_tags add constraint "fkhflroqxlvhdcq4qyhd1vgnf9t" FOREIGN KEY (project_id) REFERENCES portfolio_api.projects(id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='fkkcjo3rxufw4rshalr9id4b7jd' and conrelid='portfolio_api.skill_categories_connections'::regclass) then alter table portfolio_api.skill_categories_connections add constraint "fkkcjo3rxufw4rshalr9id4b7jd" FOREIGN KEY (skill_categorie_id) REFERENCES portfolio_api.skill_categories(id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='fklp6hvoq8chkam4ib9ya13tqli' and conrelid='portfolio_api.profiles_roles'::regclass) then alter table portfolio_api.profiles_roles add constraint "fklp6hvoq8chkam4ib9ya13tqli" FOREIGN KEY (profile_id) REFERENCES portfolio_api.profiles(id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='fkmu9pflq83651pmfcdleb316o0' and conrelid='portfolio_api.projects_images'::regclass) then alter table portfolio_api.projects_images add constraint "fkmu9pflq83651pmfcdleb316o0" FOREIGN KEY (project_id) REFERENCES portfolio_api.projects(id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='fkn5crjl16tki0tgc3ngj9ah46x' and conrelid='portfolio_api.profiles_languages'::regclass) then alter table portfolio_api.profiles_languages add constraint "fkn5crjl16tki0tgc3ngj9ah46x" FOREIGN KEY (profile_id) REFERENCES portfolio_api.profiles(id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='fkp1ngulyg7nrf6ul2ahltfy0v7' and conrelid='portfolio_api.experiences_contributions'::regclass) then alter table portfolio_api.experiences_contributions add constraint "fkp1ngulyg7nrf6ul2ahltfy0v7" FOREIGN KEY (experience_id) REFERENCES portfolio_api.experiences(id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='fktps5y89g9o4m4bb1h397fho3s' and conrelid='portfolio_api.profiles_description'::regclass) then alter table portfolio_api.profiles_description add constraint "fktps5y89g9o4m4bb1h397fho3s" FOREIGN KEY (profile_id) REFERENCES portfolio_api.profiles(id); end if; end $$;
do $$ begin if not exists(select 1 from pg_constraint where conname='message_nonempty' and conrelid='portfolio_api.messages'::regclass) then alter table portfolio_api.messages add constraint "message_nonempty" CHECK (((length(TRIM(BOTH FROM name)) > 0) AND (length(TRIM(BOTH FROM message)) > 0))); end if; end $$;
