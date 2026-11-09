-- Import Taiwan's current 115 academic-year elementary and junior-high school directories.
-- Official sources:
-- Elementary: https://stats.moe.gov.tw/files/school/115/e1_new.json
-- Junior high: https://stats.moe.gov.tw/files/opendata/j1_new.json (filter 學年度=115)
-- Source datasets: https://data.gov.tw/dataset/6087 and https://data.gov.tw/dataset/6088
-- Run as a trusted database administrator. This transaction creates the HTTP extension
-- only for the import and drops it before committing, so the application cannot call it.
begin;

create extension if not exists http with schema extensions;

with source_payloads as materialized (
  select
    replace((extensions.http_get('https://stats.moe.gov.tw/files/school/115/e1_new.json')).content, chr(65279), '')::jsonb as elementary_data,
    replace((extensions.http_get('https://stats.moe.gov.tw/files/opendata/j1_new.json')).content, chr(65279), '')::jsonb as junior_high_data
),
raw as (
  select value, 'elementary'::text as school_level,
         '教育部統計處 115學年度國民小學名錄'::text as source_name
  from source_payloads, jsonb_array_elements(elementary_data)
  union all
  select value, 'junior_high'::text,
         '教育部統計處 115學年度國民中學名錄'::text
  from source_payloads, jsonb_array_elements(junior_high_data)
  where value->>'學年度' = '115'
),
normalized as (
  select
    nullif(trim(value->>'代碼'), '') as school_code,
    nullif(trim(value->>'學校名稱'), '') as name,
    regexp_replace(coalesce(value->>'縣市名稱',''), '^\\[[^]]+\\]', '') as city,
    (regexp_match(
      trim(regexp_replace(
        regexp_replace(coalesce(value->>'地址',''), '^\\[[^]]+\\]', ''),
        '^' || regexp_replace(coalesce(value->>'縣市名稱',''), '^\\[[^]]+\\]', ''),
        ''
      )),
      '^(.+?(區|鄉|鎮|市))'
    ))[1] as district,
    nullif(trim(regexp_replace(coalesce(value->>'地址',''), '^\\[[^]]+\\]', '')), '') as address,
    nullif(trim(value->>'電話'), '') as phone,
    nullif(trim(value->>'網址'), '') as website,
    nullif(trim(value->>'公/私立'), '') as ownership,
    115::smallint as academic_year,
    source_name as data_source,
    school_level
  from raw
)
insert into public.schools
  (school_code, name, city, district, address, phone, website, ownership, academic_year, data_source, school_level, is_active)
select
  school_code, name, city, district, address, phone, website, ownership, academic_year, data_source, school_level, true
from normalized
where school_code is not null and name is not null
on conflict (school_code) do update set
  name = excluded.name,
  city = excluded.city,
  district = excluded.district,
  address = excluded.address,
  phone = excluded.phone,
  website = excluded.website,
  ownership = excluded.ownership,
  academic_year = excluded.academic_year,
  data_source = excluded.data_source,
  school_level = excluded.school_level,
  is_active = true;

drop extension http;
commit;
