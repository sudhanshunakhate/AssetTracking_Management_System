-- Seed system locations per Operating Unit (OU), not per organization.
-- Safe to re-run: skips when bu + system_role already exists.
SET search_path TO caits_local;

DO $$
DECLARE
    bu RECORD;
    role_code TEXT;
    role_name TEXT;
    loc_code TEXT;
    suffix TEXT;
BEGIN
    FOR bu IN
        SELECT b.bu_bu_id, b.bu_entity_id_ent
        FROM org_businessunit_mst b
        WHERE b.bu_isactive = TRUE
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
                WHERE l.loc_bu_id_bu = bu.bu_bu_id
                  AND l.loc_system_role = role_code
                  AND l.loc_is_system_location = TRUE
            ) THEN
                CONTINUE;
            END IF;

            suffix := CASE role_code
                WHEN 'MAIN_STORE' THEN 'MAIN'
                WHEN 'REJECTED' THEN 'REJ'
                WHEN 'QUARANTINE' THEN 'QRT'
                WHEN 'DAMAGED' THEN 'DMG'
                WHEN 'SCRAP' THEN 'SCR'
                ELSE LEFT(role_code, 4)
            END;

            loc_code := 'SYS-' || bu.bu_bu_id::TEXT || '-' || suffix;

            IF EXISTS (
                SELECT 1 FROM org_location_mst l WHERE UPPER(l.loc_location_code) = loc_code
            ) THEN
                loc_code := loc_code || '-OU';
            END IF;

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
            ) VALUES (
                loc_code,
                role_name,
                'System',
                bu.bu_entity_id_ent,
                bu.bu_bu_id,
                TRUE,
                TRUE,
                role_code,
                role_name,
                'system',
                NOW()
            );
        END LOOP;
    END LOOP;
END $$;
