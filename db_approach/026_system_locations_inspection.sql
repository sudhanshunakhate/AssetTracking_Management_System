-- System-driven locations per organization + Inspection Approval menu
-- Schema: caits_local
-- Safe to re-run: IF NOT EXISTS / guarded inserts

SET search_path TO caits_local;

-- ---------------------------------------------------------------------------
-- 1) Location columns for system stores
-- ---------------------------------------------------------------------------
ALTER TABLE org_location_mst
    ADD COLUMN IF NOT EXISTS loc_is_system_location BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE org_location_mst
    ADD COLUMN IF NOT EXISTS loc_system_role VARCHAR(30);

ALTER TABLE org_location_mst
    ADD COLUMN IF NOT EXISTS loc_print_location_name VARCHAR(150);

-- ---------------------------------------------------------------------------
-- 2) Seed five system locations for every active entity (uses first active OU)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    ent RECORD;
    bu_id INTEGER;
    role_code TEXT;
    role_name TEXT;
    loc_code TEXT;
BEGIN
    FOR ent IN
        SELECT e.ent_entity_id, e.ent_entity_code
        FROM org_entity_mst e
        WHERE e.ent_isactive = TRUE
    LOOP
        SELECT b.bu_bu_id
        INTO bu_id
        FROM org_businessunit_mst b
        WHERE b.bu_entity_id_ent = ent.ent_entity_id
          AND b.bu_isactive = TRUE
        ORDER BY b.bu_bu_id
        LIMIT 1;

        IF bu_id IS NULL THEN
            RAISE NOTICE 'Skipping entity % — no active OU for system locations', ent.ent_entity_code;
            CONTINUE;
        END IF;

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
            ) THEN
                CONTINUE;
            END IF;

            loc_code := 'SYS-' || ent.ent_entity_id::TEXT || '-' ||
                CASE role_code
                    WHEN 'MAIN_STORE' THEN 'MAIN'
                    WHEN 'REJECTED' THEN 'REJ'
                    WHEN 'QUARANTINE' THEN 'QRT'
                    WHEN 'DAMAGED' THEN 'DMG'
                    WHEN 'SCRAP' THEN 'SCR'
                    ELSE LEFT(role_code, 4)
                END;

            IF EXISTS (
                SELECT 1 FROM org_location_mst l WHERE UPPER(l.loc_location_code) = loc_code
            ) THEN
                CONTINUE;
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
                ent.ent_entity_id,
                bu_id,
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

-- ---------------------------------------------------------------------------
-- 3) Inspection Approval menu + ADMIN permissions
-- ---------------------------------------------------------------------------
INSERT INTO sysm_menutree_mst (
    mtree_menu_code, mtree_menu_label, mtree_menu_group, mtree_sort_order, mtree_group_sort_order, mtree_icon, mtree_doc_type,
    mtree_supports_view, mtree_supports_create, mtree_supports_edit, mtree_supports_delete,
    mtree_supports_approve, mtree_supports_reject, mtree_supports_print, mtree_supports_export,
    mtree_is_system_menu, mtree_isactive, mtree_created_by, mtree_created_on
) VALUES
('IAPR', 'Inspection Approval', 'Transactions', 48, 4, 'IAPR', 'INSPECTION_APPROVAL',
 TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, TRUE, 'system', NOW())
ON CONFLICT (mtree_menu_code) DO UPDATE SET
    mtree_menu_label       = EXCLUDED.mtree_menu_label,
    mtree_menu_group       = EXCLUDED.mtree_menu_group,
    mtree_sort_order       = EXCLUDED.mtree_sort_order,
    mtree_group_sort_order = EXCLUDED.mtree_group_sort_order,
    mtree_icon             = EXCLUDED.mtree_icon,
    mtree_doc_type         = EXCLUDED.mtree_doc_type,
    mtree_supports_view    = EXCLUDED.mtree_supports_view,
    mtree_supports_create  = EXCLUDED.mtree_supports_create,
    mtree_supports_edit    = EXCLUDED.mtree_supports_edit,
    mtree_supports_delete  = EXCLUDED.mtree_supports_delete,
    mtree_supports_approve = EXCLUDED.mtree_supports_approve,
    mtree_supports_reject  = EXCLUDED.mtree_supports_reject,
    mtree_supports_print   = EXCLUDED.mtree_supports_print,
    mtree_supports_export  = EXCLUDED.mtree_supports_export,
    mtree_is_system_menu   = EXCLUDED.mtree_is_system_menu,
    mtree_isactive         = TRUE,
    mtree_modified_by      = 'system',
    mtree_modified_on      = NOW();

INSERT INTO sysm_rolepermission_dtl (
    rlpm_role_id_rol, rlpm_menu_id_mtree,
    rlpm_can_view, rlpm_can_create, rlpm_can_edit, rlpm_can_delete,
    rlpm_can_approve, rlpm_can_reject, rlpm_can_print, rlpm_can_export
)
SELECT
    r.rol_role_id,
    m.mtree_menu_id,
    TRUE,
    COALESCE(m.mtree_supports_create, FALSE),
    COALESCE(m.mtree_supports_edit, FALSE),
    COALESCE(m.mtree_supports_delete, FALSE),
    COALESCE(m.mtree_supports_approve, FALSE),
    COALESCE(m.mtree_supports_reject, FALSE),
    COALESCE(m.mtree_supports_print, FALSE),
    COALESCE(m.mtree_supports_export, FALSE)
FROM sysm_roles_mst r
CROSS JOIN sysm_menutree_mst m
WHERE UPPER(r.rol_role_code) = 'ADMIN'
  AND m.mtree_menu_code = 'IAPR'
  AND NOT EXISTS (
      SELECT 1
      FROM sysm_rolepermission_dtl rp
      WHERE rp.rlpm_role_id_rol = r.rol_role_id
        AND rp.rlpm_menu_id_mtree = m.mtree_menu_id
  );
