-- Global system-derived locations per Organization (entity), shared across all OUs.
-- Operational (non-system) locations remain OU-specific.

SET search_path TO caits_local;

ALTER TABLE org_location_mst
    ALTER COLUMN loc_bu_id_bu DROP NOT NULL;

DO $$
DECLARE
    ent RECORD;
    role_code TEXT;
    role_name TEXT;
    loc_code TEXT;
    suffix TEXT;
BEGIN
    FOR ent IN
        SELECT e.ent_entity_id
        FROM org_entity_mst e
        WHERE e.ent_isactive = TRUE
    LOOP
        FOR role_code, role_name IN
            SELECT * FROM (
                VALUES
                    ('MAIN_STORE', 'Main Store'),
                    ('REJECTED', 'Rejected'),
                    ('QUARANTINE', 'Quarantine'),
                    ('DAMAGED', 'Damaged'),
                    ('SCRAP', 'Scrap')
            ) AS roles(code, name)
        LOOP
            IF EXISTS (
                SELECT 1
                FROM org_location_mst l
                WHERE l.loc_entity_id_ent = ent.ent_entity_id
                  AND l.loc_system_role = role_code
                  AND l.loc_is_system_location = TRUE
                  AND l.loc_bu_id_bu IS NULL
            ) THEN
                CONTINUE;
            END IF;

            suffix := CASE role_code
                WHEN 'MAIN_STORE' THEN 'MAIN'
                WHEN 'REJECTED' THEN 'REJ'
                WHEN 'QUARANTINE' THEN 'QRT'
                WHEN 'DAMAGED' THEN 'DMG'
                WHEN 'SCRAP' THEN 'SCR'
            END;

            loc_code := 'SYS-ENT-' || ent.ent_entity_id || '-' || suffix;

            INSERT INTO org_location_mst (
                loc_location_code,
                loc_location_name,
                loc_location_type,
                loc_entity_id_ent,
                loc_bu_id_bu,
                loc_isactive,
                loc_is_system_location,
                loc_system_role,
                loc_print_location_name,
                loc_created_by,
                loc_created_on
            )
            VALUES (
                loc_code,
                role_name,
                'System',
                ent.ent_entity_id,
                NULL,
                TRUE,
                TRUE,
                role_code,
                role_name,
                'migration-036',
                NOW()
            )
            ON CONFLICT DO NOTHING;
        END LOOP;

        -- Deactivate legacy per-OU system locations for this entity (global rows replace them)
        UPDATE org_location_mst l
        SET loc_isactive = FALSE,
            loc_modified_by = 'migration-036',
            loc_modified_on = NOW()
        WHERE l.loc_entity_id_ent = ent.ent_entity_id
          AND l.loc_is_system_location = TRUE
          AND l.loc_bu_id_bu IS NOT NULL;
    END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_org_location_entity_system_role
    ON org_location_mst (loc_entity_id_ent, loc_system_role)
    WHERE loc_is_system_location = TRUE AND loc_bu_id_bu IS NULL;
