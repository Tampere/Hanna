UPDATE app."user"
SET permissions = array_remove(COALESCE(permissions, ARRAY[]::text[]), 'detailplanProject.write')
WHERE permissions @> ARRAY['detailplanProject.write']::text[];