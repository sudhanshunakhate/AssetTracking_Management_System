-- Deactivate legacy per-OU system locations (SYS-{buId}-*) when org-global
-- rows (SYS-ENT-{entityId}-*, bu_id NULL) already exist for the same role.
-- Safe to re-run: only touches active system locations that still have a bu_id.

SET search_path TO caits_local;

DO $$
DECLARE
    deactivated INTEGER := 0;
BEGIN
    UPDATE org_location_mst legacy
    SET loc_isactive = FALSE,
        loc_modified_by = 'migration-047',
        loc_modified_on = NOW()
    WHERE legacy.loc_is_system_location = TRUE
      AND legacy.loc_isactive = TRUE
      AND legacy.loc_bu_id_bu IS NOT NULL
      AND EXISTS (
          SELECT 1
          FROM org_location_mst global_loc
          WHERE global_loc.loc_entity_id_ent = legacy.loc_entity_id_ent
            AND global_loc.loc_system_role = legacy.loc_system_role
            AND global_loc.loc_is_system_location = TRUE
            AND global_loc.loc_bu_id_bu IS NULL
            AND global_loc.loc_isactive = TRUE
      );

    GET DIAGNOSTICS deactivated = ROW_COUNT;
    RAISE NOTICE '047: deactivated % legacy OU-scoped system location(s)', deactivated;
END $$;
