-- CAITS menu tree + ADMIN role access seed
-- Schema: caits_local
-- Safe to re-run: uses ON CONFLICT / NOT EXISTS guards

SET search_path TO caits_local;

-- ---------------------------------------------------------------------------
-- 1) All application menus (aligned with frontend navGroups)
--    mtree_menu_code is the business key used by rolepermission + access exceptions
-- ---------------------------------------------------------------------------
INSERT INTO sysm_menutree_mst (
    mtree_menu_code, mtree_menu_label, mtree_menu_group, mtree_sort_order, mtree_icon, mtree_doc_type,
    mtree_supports_view, mtree_supports_create, mtree_supports_edit, mtree_supports_delete,
    mtree_supports_approve, mtree_supports_reject, mtree_supports_print, mtree_supports_export,
    mtree_is_system_menu, mtree_isactive, mtree_created_by, mtree_created_on
) VALUES
-- Master Setup
('UOM',    'Unit Master',              'Master Setup',     10,  'UOM', NULL,                  true, true,  true,  true,  false, false, false, true,  true, true, 'system', NOW()),
('AIM',    'Item Master',              'Master Setup',     20,  'AIM', NULL,                  true, true,  true,  true,  false, false, false, true,  true, true, 'system', NOW()),
('ICM',    'Inventory Category',       'Master Setup',     30,  'ICM', NULL,                  true, true,  true,  true,  false, false, false, true,  true, true, 'system', NOW()),
('ISC',    'Inventory Sub-Category',   'Master Setup',     40,  'ISC', NULL,                  true, true,  true,  true,  false, false, false, true,  true, true, 'system', NOW()),
('GTY',    'General Type',             'Master Setup',     50,  'GTY', NULL,                  true, true,  true,  true,  false, false, false, true,  true, true, 'system', NOW()),
('GNM',    'General Master',           'Master Setup',     60,  'GNM', NULL,                  true, true,  true,  true,  false, false, false, true,  true, true, 'system', NOW()),
('VPM',    'Vendor / Party',           'Master Setup',     70,  'VPM', NULL,                  true, true,  true,  true,  false, false, false, true,  true, true, 'system', NOW()),
-- Organization
('ORG',    'Organization (Entity)',    'Organization',     110, 'ORG', NULL,                  true, true,  true,  true,  false, false, false, true,  true, true, 'system', NOW()),
('OU',     'Operating Unit',           'Organization',     120, 'OU',  NULL,                  true, true,  true,  true,  false, false, false, true,  true, true, 'system', NOW()),
('STR',    'Location',                 'Organization',     130, 'STR', NULL,                  true, true,  true,  true,  false, false, false, true,  true, true, 'system', NOW()),
-- Access & People
('ARM',    'Access Role',              'Access & People',  210, 'ARM', NULL,                  true, true,  true,  true,  false, false, false, true,  true, true, 'system', NOW()),
('EMP',    'Employee',                 'Access & People',  220, 'EMP', NULL,                  true, true,  true,  true,  false, false, false, true,  true, true, 'system', NOW()),
('USR',    'User Login',               'Access & People',  230, 'USR', NULL,                  true, true,  true,  true,  false, false, false, true,  true, true, 'system', NOW()),
('MNU',    'Menu Access',              'Access & People',  240, 'MNU', NULL,                  true, true,  true,  false, false, false, false, true,  true, true, 'system', NOW()),
('UAE',    'Access Exception',         'Access & People',  250, 'UAE', NULL,                  true, true,  true,  true,  false, false, false, true,  true, true, 'system', NOW()),
-- Transactions
('OPN',    'Opening Stock',            'Transactions',     310, 'OPN', 'OPENING_STOCK',        true, true,  true,  true,  false, false, true,  true,  true, true, 'system', NOW()),
('SR',     'Store Requisitions',       'Transactions',     320, 'SR',  'MATERIAL_REQUISITION', true, true,  true,  true,  true,  true,  true,  true,  true, true, 'system', NOW()),
('GRN',    'Goods Receipt Note',       'Transactions',     330, 'GRN', 'GRN',                  true, true,  true,  true,  true,  true,  true,  true,  true, true, 'system', NOW()),
('GP',     'Gatepass',                 'Transactions',     340, 'GP',  NULL,                  true, true,  true,  true,  true,  false, true,  true,  true, true, 'system', NOW()),
('ISS',    'Store Issue',              'Transactions',     350, 'ISS', 'MATERIAL_ISSUE',       true, true,  true,  true,  false, false, true,  true,  true, true, 'system', NOW()),
('TRF',    'Material Transfer',        'Transactions',     360, 'TRF', 'MATERIAL_TRANSFER',    true, true,  true,  true,  false, false, true,  true,  true, true, 'system', NOW()),
('RTN',    'Material Return',          'Transactions',     370, 'RTN', 'MATERIAL_RETURN',      true, true,  true,  true,  false, false, true,  true,  true, true, 'system', NOW()),
-- Reports
('DASH',   'Dashboard',                'Reports',          410, NULL,  NULL,                  true, false, false, false, false, false, false, true,  true, true, 'system', NOW()),
('STKREG', 'Stock Register',           'Reports',          420, NULL,  NULL,                  true, false, false, false, false, false, false, true,  true, true, 'system', NOW()),
('FULLRPT','Full Report',              'Reports',          430, NULL,  NULL,                  true, false, false, false, false, false, false, true,  true, true, 'system', NOW())
ON CONFLICT (mtree_menu_code) DO UPDATE SET
    mtree_menu_label       = EXCLUDED.mtree_menu_label,
    mtree_menu_group       = EXCLUDED.mtree_menu_group,
    mtree_sort_order       = EXCLUDED.mtree_sort_order,
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

-- ---------------------------------------------------------------------------
-- 2) ADMIN role → full access on every menu (rlpm_module_name = mtree_menu_code)
-- ---------------------------------------------------------------------------
INSERT INTO sysm_rolepermission_dtl (
    rlpm_role_id_rol, rlpm_module_name,
    rlpm_can_view, rlpm_can_create, rlpm_can_edit, rlpm_can_delete,
    rlpm_can_approve, rlpm_can_reject, rlpm_can_print, rlpm_can_export
)
SELECT
    r.rol_role_id,
    m.mtree_menu_code,
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
  AND m.mtree_isactive = TRUE
  AND NOT EXISTS (
      SELECT 1
      FROM sysm_rolepermission_dtl p
      WHERE p.rlpm_role_id_rol = r.rol_role_id
        AND p.rlpm_module_name = m.mtree_menu_code
  );

-- Verification
SELECT 'menus' AS kind, COUNT(*) AS cnt FROM sysm_menutree_mst
UNION ALL
SELECT 'admin_perms', COUNT(*)
FROM sysm_rolepermission_dtl p
JOIN sysm_roles_mst r ON r.rol_role_id = p.rlpm_role_id_rol
WHERE UPPER(r.rol_role_code) = 'ADMIN';
