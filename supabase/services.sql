do $$
declare
  services_id_type text;
  service_reference_type text;
begin
  select data_type
    into services_id_type
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'services'
      and column_name = 'id';

  if services_id_type = 'uuid' then
    if to_regclass('public.services_legacy_uuid') is not null then
      raise exception 'Both public.services and public.services_legacy_uuid exist with UUID IDs. Inspect the tables before continuing.';
    end if;
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'services' and column_name = 'slug'
    ) then
      raise exception 'The existing UUID services table has no slug column; migrate it manually before continuing.';
    end if;
    if exists (
      select slug from public.services
      group by slug
      having slug is null or btrim(slug) = '' or count(*) > 1
    ) then
      raise exception 'The existing UUID services table has blank, null, or duplicate slugs; resolve them before continuing.';
    end if;

    foreach service_reference_type in array array['service_beneficiaries', 'gallery_images']
    loop
      if to_regclass(format('public.%I', service_reference_type)) is not null
        and exists (
          select 1 from information_schema.columns
          where table_schema = 'public'
            and table_name = service_reference_type
            and column_name = 'service_id'
            and data_type in ('text', 'character varying')
        ) then
        execute format(
          'update public.%I as content set service_id = services.slug from public.services as services where content.service_id = services.id::text',
          service_reference_type
        );
      elsif to_regclass(format('public.%I', service_reference_type)) is not null
        and exists (
          select 1 from information_schema.columns
          where table_schema = 'public'
            and table_name = service_reference_type
            and column_name = 'service_id'
        ) then
        raise exception 'public.% has a service_id column that is not text; migrate its references manually before continuing.', service_reference_type;
      end if;
    end loop;

    alter table public.services rename to services_legacy_uuid;
  elsif services_id_type is not null and services_id_type <> 'text' then
    raise exception 'public.services.id must be text; inspect and migrate the existing services table before rerunning this script.';
  end if;
end $$;

create table if not exists public.services (
  id text primary key,
  title text not null,
  short_description text not null default '',
  description text not null default '',
  image_url text,
  impact jsonb not null default '{}'::jsonb,
  gallery jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if to_regclass('public.services_legacy_uuid') is not null then
    insert into public.services (
      id,
      title,
      short_description,
      description,
      image_url,
      impact,
      sort_order,
      published,
      created_at,
      updated_at
    )
    select
      legacy.slug,
      legacy.title,
      legacy.short_description,
      legacy.description,
      legacy.image,
      legacy.impact,
      coalesce(array_position(
        array['trauma-recovery', 'practical-support', 'financial-support', 'community-building'],
        legacy.slug
      ) - 1, 0),
      true,
      legacy.created_at,
      legacy.updated_at
    from public.services_legacy_uuid as legacy
    on conflict (id) do nothing;
  end if;
end $$;

do $$
declare
  services_id_type text;
begin
  select data_type
    into services_id_type
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'services'
      and column_name = 'id';

  if services_id_type is distinct from 'text' then
    raise exception 'public.services.id must be text for the SHEMA service IDs. Inspect and migrate any existing services table before rerunning this script.';
  end if;

  if not exists (
    select 1
      from pg_constraint
      where conrelid = 'public.services'::regclass
        and contype = 'p'
  ) then
    if exists (
      select 1
        from public.services
        where id is null
    ) or exists (
      select id
        from public.services
        group by id
        having count(*) > 1
    ) then
      raise exception 'public.services.id contains null or duplicate values; resolve them before adding the primary key.';
    end if;

    alter table public.services
      add constraint services_pkey primary key (id);
  end if;
end $$;

alter table public.services
  add column if not exists title text not null default '',
  add column if not exists short_description text not null default '',
  add column if not exists description text not null default '',
  add column if not exists image_url text,
  add column if not exists impact jsonb not null default '{}'::jsonb,
  add column if not exists gallery jsonb not null default '[]'::jsonb,
  add column if not exists sort_order integer not null default 0,
  add column if not exists published boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists services_published_sort_order_idx
  on public.services (published, sort_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

alter table public.services enable row level security;

drop policy if exists "Public can read published services" on public.services;
create policy "Public can read published services"
  on public.services
  for select
  to anon, authenticated
  using (published = true);

revoke insert, update, delete on public.services from anon, authenticated;
grant select on public.services to anon, authenticated;
grant all on public.services to service_role;

do $$
begin
  if to_regclass('public.testimonies') is not null then
    alter table public.testimonies add column if not exists source_key text;
    create unique index if not exists testimonies_source_key_unique_idx
      on public.testimonies (source_key);

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'testimonies'
        and column_name = 'service_id'
    ) then
      if not exists (
        select 1
        from pg_constraint c
        where c.conrelid = 'public.testimonies'::regclass
          and c.conname = 'testimonies_service_id_fkey'
      ) and not exists (
        select 1
        from public.testimonies t
        left join public.services s on s.id = t.service_id
        where t.service_id is not null and s.id is null
      ) then
        alter table public.testimonies
          add constraint testimonies_service_id_fkey
          foreign key (service_id) references public.services(id) on update cascade;
      end if;
    end if;
  end if;

  if to_regclass('public.events') is not null and exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'events'
      and column_name = 'service_id'
  ) then
    if not exists (
      select 1
      from pg_constraint c
      where c.conrelid = 'public.events'::regclass
        and c.conname = 'events_service_id_fkey'
    ) and not exists (
      select 1
      from public.events e
      left join public.services s on s.id = e.service_id
      where e.service_id is not null and s.id is null
    ) then
      alter table public.events
        add constraint events_service_id_fkey
        foreign key (service_id) references public.services(id) on update cascade;
    end if;
  end if;
end $$;
