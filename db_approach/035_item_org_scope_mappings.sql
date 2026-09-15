-- Item Master: organization-level scope with OU / location mappings (exclude system-derived stores in UI).

ALTER TABLE caits_local.inv_item_mst
    ADD COLUMN IF NOT EXISTS itm_entity_id_ent INTEGER,
    ADD COLUMN IF NOT EXISTS itm_bu_access_scope VARCHAR(20) DEFAULT 'ALL',
    ADD COLUMN IF NOT EXISTS itm_location_access_scope VARCHAR(20) DEFAULT 'SELECTED';

COMMENT ON COLUMN caits_local.inv_item_mst.itm_entity_id_ent IS 'Organization (entity) this catalog item belongs to';
COMMENT ON COLUMN caits_local.inv_item_mst.itm_bu_access_scope IS 'ALL or SELECTED operating units';
COMMENT ON COLUMN caits_local.inv_item_mst.itm_location_access_scope IS 'ALL or SELECTED locations';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_inv_item_mst_itm_entity_id_ent'
    ) THEN
        ALTER TABLE caits_local.inv_item_mst
            ADD CONSTRAINT fk_inv_item_mst_itm_entity_id_ent
            FOREIGN KEY (itm_entity_id_ent)
            REFERENCES caits_local.org_entity_mst(ent_entity_id);
    END IF;
END $$;

-- Backfill organization from current home location
UPDATE caits_local.inv_item_mst i
SET itm_entity_id_ent = l.loc_entity_id_ent,
    itm_location_access_scope = COALESCE(i.itm_location_access_scope, 'SELECTED')
FROM caits_local.org_location_mst l
WHERE i.itm_current_location_id_loc = l.loc_location_id
  AND i.itm_entity_id_ent IS NULL;

CREATE TABLE IF NOT EXISTS caits_local.inv_item_bu_mapping_dtl (
    iibm_item_bu_access_id SERIAL PRIMARY KEY,
    iibm_item_id_itm INTEGER NOT NULL REFERENCES caits_local.inv_item_mst(itm_item_id),
    iibm_bu_id_bu INTEGER NOT NULL REFERENCES caits_local.org_businessunit_mst(bu_bu_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_inv_item_bu_mapping
    ON caits_local.inv_item_bu_mapping_dtl (iibm_item_id_itm, iibm_bu_id_bu);

CREATE TABLE IF NOT EXISTS caits_local.inv_item_location_mapping_dtl (
    ilim_item_loc_access_id SERIAL PRIMARY KEY,
    ilim_item_id_itm INTEGER NOT NULL REFERENCES caits_local.inv_item_mst(itm_item_id),
    ilim_location_id_loc INTEGER NOT NULL REFERENCES caits_local.org_location_mst(loc_location_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_inv_item_location_mapping
    ON caits_local.inv_item_location_mapping_dtl (ilim_item_id_itm, ilim_location_id_loc);

-- Backfill location mappings from legacy single home store
INSERT INTO caits_local.inv_item_location_mapping_dtl (ilim_item_id_itm, ilim_location_id_loc)
SELECT i.itm_item_id, i.itm_current_location_id_loc
FROM caits_local.inv_item_mst i
JOIN caits_local.org_location_mst l ON l.loc_location_id = i.itm_current_location_id_loc
WHERE i.itm_current_location_id_loc IS NOT NULL
  AND COALESCE(l.loc_is_system_location, false) = false
ON CONFLICT (ilim_item_id_itm, ilim_location_id_loc) DO NOTHING;
