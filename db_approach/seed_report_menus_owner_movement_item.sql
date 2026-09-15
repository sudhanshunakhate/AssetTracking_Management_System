-- CAITS — Add Stock Owner / Stock Movement / Item Register report menus
-- Safe to re-run.

SET search_path TO caits_local;

INSERT INTO sysm_menutree_mst (
    mtree_menu_code, mtree_menu_label, mtree_menu_group, mtree_sort_order, mtree_group_sort_order, mtree_icon, mtree_doc_type,
    mtree_supports_view, mtree_supports_create, mtree_supports_edit, mtree_supports_delete,
    mtree_supports_approve, mtree_supports_reject, mtree_supports_print, mtree_supports_export,
    mtree_is_system_menu, mtree_isactive, mtree_created_by, mtree_created_on
) VALUES
('STKOWN',  'Stock Owner Report',    'Reports', 54, 5, 'STKOWN',  NULL, true, false, false, false, false, false, false, true, true, true, 'system', NOW()),
('STKMOV',  'Stock Movement Report', 'Reports', 55, 5, 'STKMOV',  NULL, true, false, false, false, false, false, false, true, true, true, 'system', NOW()),
('ITEMREG', 'Item Register',         'Reports', 56, 5, 'ITEMREG', NULL, true, false, false, false, false, false, false, true, true, true, 'system', NOW())
ON CONFLICT (mtree_menu_code) DO UPDATE SET
    mtree_menu_label       = EXCLUDED.mtree_menu_label,
    mtree_menu_group       = EXCLUDED.mtree_menu_group,
    mtree_sort_order       = EXCLUDED.mtree_sort_order,
    mtree_group_sort_order = EXCLUDED.mtree_group_sort_order,
    mtree_icon             = EXCLUDED.mtree_icon,
    mtree_supports_view    = TRUE,
    mtree_supports_export  = TRUE,
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
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    TRUE
FROM sysm_roles_mst r
CROSS JOIN sysm_menutree_mst m
WHERE UPPER(r.rol_role_code) = 'ADMIN'
  AND UPPER(m.mtree_menu_code) IN ('STKOWN', 'STKMOV', 'ITEMREG')
  AND NOT EXISTS (
      SELECT 1
      FROM sysm_rolepermission_dtl p
      WHERE p.rlpm_role_id_rol = r.rol_role_id
        AND p.rlpm_menu_id_mtree = m.mtree_menu_id
  );

DO $$
BEGIN
    RAISE NOTICE '017: Stock Owner / Stock Movement / Item Register menus ready';
END $$;
