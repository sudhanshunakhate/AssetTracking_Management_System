-- Multi-location access for user logins (parallel to sysm_user_bu_mapping_dtl)
-- Schema: caits_local
-- Safe to re-run

SET search_path TO caits_local;

ALTER TABLE sysm_userlogin_mst
    ADD COLUMN IF NOT EXISTS usr_location_access_scope varchar(20) NOT NULL DEFAULT 'ALL';

COMMENT ON COLUMN sysm_userlogin_mst.usr_location_access_scope IS
    'ALL = every location in org (filtered by OU scope); SELECTED = rows in sysm_user_location_mapping_dtl';

CREATE TABLE IF NOT EXISTS sysm_user_location_mapping_dtl (
    uloc_user_loc_access_id serial PRIMARY KEY,
    uloc_user_id_usr        integer NOT NULL
        REFERENCES sysm_userlogin_mst (usr_user_id) ON DELETE CASCADE,
    uloc_location_id_loc    integer NOT NULL
        REFERENCES org_location_mst (loc_location_id),
    CONSTRAINT uq_user_location UNIQUE (uloc_user_id_usr, uloc_location_id_loc)
);

CREATE INDEX IF NOT EXISTS ix_uloc_user ON sysm_user_location_mapping_dtl (uloc_user_id_usr);

-- Seed existing default location into mapping when present (scope stays ALL unless already SELECTED)
INSERT INTO sysm_user_location_mapping_dtl (uloc_user_id_usr, uloc_location_id_loc)
SELECT u.usr_user_id, u.usr_location_id_loc
FROM sysm_userlogin_mst u
WHERE u.usr_location_id_loc IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM sysm_user_location_mapping_dtl m
      WHERE m.uloc_user_id_usr = u.usr_user_id
        AND m.uloc_location_id_loc = u.usr_location_id_loc
  );
