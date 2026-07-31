-- CAITS — Rename menus + migrate role permissions to menu FK
-- Schema: caits_local
-- rlpm_module_name (varchar menu code) → rlpm_menu_id_mtree (FK → mtree_menu_id)

SET search_path TO caits_local;

-- ---------------------------------------------------------------------------
-- 1) Menu label renames
-- ---------------------------------------------------------------------------
UPDATE sysm_menutree_mst
SET mtree_menu_label = 'Role & Menu Mapping',
    mtree_modified_by = 'system',
    mtree_modified_on = NOW()
WHERE UPPER(mtree_menu_code) = 'ARM';

UPDATE sysm_menutree_mst
SET mtree_menu_label = 'User Access Exception',
    mtree_modified_by = 'system',
    mtree_modified_on = NOW()
WHERE UPPER(mtree_menu_code) = 'UAE';

-- ---------------------------------------------------------------------------
-- 2) Add FK column (nullable until backfilled)
-- ---------------------------------------------------------------------------
ALTER TABLE sysm_rolepermission_dtl
    ADD COLUMN IF NOT EXISTS rlpm_menu_id_mtree integer;

-- Backfill from existing menu codes stored in rlpm_module_name (if column still exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'caits_local'
          AND table_name = 'sysm_rolepermission_dtl'
          AND column_name = 'rlpm_module_name'
    ) THEN
        UPDATE sysm_rolepermission_dtl p
        SET rlpm_menu_id_mtree = m.mtree_menu_id
        FROM sysm_menutree_mst m
        WHERE p.rlpm_menu_id_mtree IS NULL
          AND UPPER(m.mtree_menu_code) = UPPER(p.rlpm_module_name);

        -- Drop rows that could not be mapped
        DELETE FROM sysm_rolepermission_dtl WHERE rlpm_menu_id_mtree IS NULL;

        ALTER TABLE sysm_rolepermission_dtl DROP COLUMN rlpm_module_name;
    END IF;
END $$;

-- Enforce NOT NULL
ALTER TABLE sysm_rolepermission_dtl
    ALTER COLUMN rlpm_menu_id_mtree SET NOT NULL;

-- FK to menutree
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'caits_local'
          AND table_name = 'sysm_rolepermission_dtl'
          AND constraint_name = 'fk_rlpm_menu_id_mtree'
    ) THEN
        ALTER TABLE sysm_rolepermission_dtl
            ADD CONSTRAINT fk_rlpm_menu_id_mtree
            FOREIGN KEY (rlpm_menu_id_mtree)
            REFERENCES sysm_menutree_mst (mtree_menu_id);
    END IF;
END $$;

-- One permission row per role + menu
CREATE UNIQUE INDEX IF NOT EXISTS uq_rlpm_role_menu
    ON sysm_rolepermission_dtl (rlpm_role_id_rol, rlpm_menu_id_mtree);

-- Verification
SELECT mtree_menu_code, mtree_menu_label
FROM sysm_menutree_mst
WHERE mtree_menu_code IN ('ARM', 'UAE');

SELECT
    p.rlpm_role_permission_id,
    r.rol_role_code,
    m.mtree_menu_code,
    p.rlpm_menu_id_mtree,
    p.rlpm_can_view
FROM sysm_rolepermission_dtl p
JOIN sysm_roles_mst r ON r.rol_role_id = p.rlpm_role_id_rol
JOIN sysm_menutree_mst m ON m.mtree_menu_id = p.rlpm_menu_id_mtree
ORDER BY r.rol_role_code, m.mtree_menu_code
LIMIT 10;

\d caits_local.sysm_rolepermission_dtl
