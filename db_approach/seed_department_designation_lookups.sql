-- CAITS — Department + Designation General Types/Masters
-- Schema: caits_local
-- Safe to re-run: inserts only when the type / value code is missing
-- NOTE: gmst_value_code is UNIQUE globally — all codes are prefixed per type
--
-- Backs the Store Requisition dropdowns:
--   Department  -> txn_header_mst.txh_department_id_gmst (FK to genmaster_mst)
--   Designation -> txn_header_mst.txh_designation (stores the value name)
--
-- API: GET  /api/v1/general-types/GTY-DEPT/values
--      GET  /api/v1/general-types/GTY-DESIG/values
--      POST /api/v1/general-types/{typeCode}/values   (inline "+ Add option")
--
-- DataSeeder applies the same data on a fresh boot; this script is for
-- environments seeded before those lookups existed.

SET search_path TO caits_local;

-- ---------------------------------------------------------------------------
-- 1) General Types
-- ---------------------------------------------------------------------------
INSERT INTO gentype_mst (
    gtyp_type_code, gtyp_type_name, gtyp_desc,
    gtyp_isactive, gtyp_created_by, gtyp_created_on
)
SELECT v.code, v.name, v.descr, TRUE, 'system', NOW()
FROM (VALUES
    ('GTY-DEPT',  'Department',  'Departments raising requisitions'),
    ('GTY-DESIG', 'Designation', 'Employee designations')
) AS v(code, name, descr)
WHERE NOT EXISTS (
    SELECT 1 FROM gentype_mst g WHERE UPPER(g.gtyp_type_code) = UPPER(v.code)
);

-- ---------------------------------------------------------------------------
-- 2) Department values
-- ---------------------------------------------------------------------------
INSERT INTO genmaster_mst (
    gmst_value_code, gmst_value_name, gmst_gentype_id_gtyp,
    gmst_sort_order, gmst_isactive, gmst_created_by, gmst_created_on
)
SELECT v.code, v.name, t.gtyp_gentype_id, v.sort, TRUE, 'system', NOW()
FROM (VALUES
    ('DEPT-IT',     'IT',          1),
    ('DEPT-STORES', 'Stores',      2),
    ('DEPT-OPS',    'Operations',  3),
    ('DEPT-ADMIN',  'Admin',       4),
    ('DEPT-FIN',    'Finance',     5),
    ('DEPT-HR',     'HR',          6),
    ('DEPT-MAINT',  'Maintenance', 7),
    ('DEPT-PROD',   'Production',  8)
) AS v(code, name, sort)
JOIN gentype_mst t ON UPPER(t.gtyp_type_code) = 'GTY-DEPT'
WHERE NOT EXISTS (
    SELECT 1 FROM genmaster_mst m WHERE UPPER(m.gmst_value_code) = UPPER(v.code)
);

-- ---------------------------------------------------------------------------
-- 3) Designation values
-- ---------------------------------------------------------------------------
INSERT INTO genmaster_mst (
    gmst_value_code, gmst_value_name, gmst_gentype_id_gtyp,
    gmst_sort_order, gmst_isactive, gmst_created_by, gmst_created_on
)
SELECT v.code, v.name, t.gtyp_gentype_id, v.sort, TRUE, 'system', NOW()
FROM (VALUES
    ('DESIG-SYSADMIN',  'System Administrator', 1),
    ('DESIG-STRMGR',    'Store Manager',        2),
    ('DESIG-ASSETMGR',  'Asset Manager',        3),
    ('DESIG-SUPVR',     'Supervisor',           4),
    ('DESIG-STRKEEP',   'Store Keeper',         5),
    ('DESIG-MGR',       'Manager',              6),
    ('DESIG-EXEC',      'Executive',            7),
    ('DESIG-OFFICER',   'Officer',              8)
) AS v(code, name, sort)
JOIN gentype_mst t ON UPPER(t.gtyp_type_code) = 'GTY-DESIG'
WHERE NOT EXISTS (
    SELECT 1 FROM genmaster_mst m WHERE UPPER(m.gmst_value_code) = UPPER(v.code)
);

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
SELECT t.gtyp_type_code, m.gmst_value_code, m.gmst_value_name, m.gmst_sort_order
FROM genmaster_mst m
JOIN gentype_mst t ON t.gtyp_gentype_id = m.gmst_gentype_id_gtyp
WHERE t.gtyp_type_code IN ('GTY-DEPT', 'GTY-DESIG')
ORDER BY t.gtyp_type_code, m.gmst_sort_order;
