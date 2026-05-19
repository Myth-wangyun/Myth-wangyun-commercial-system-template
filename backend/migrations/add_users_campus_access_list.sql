ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS campus_access_list JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.users.campus_access_list IS '可访问校区列表(JSON数组)';

UPDATE public.users
SET campus_access_list = jsonb_build_array(campus)
WHERE (campus_access_list IS NULL OR campus_access_list = '[]'::jsonb)
  AND campus IS NOT NULL
  AND btrim(campus) <> ''
  AND campus NOT LIKE '%/%';
