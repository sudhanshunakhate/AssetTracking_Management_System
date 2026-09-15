-- Add menus present in caits_local but missing from caits: DEPM (Department), IAPR (Inspection Approval).
-- Re-runnable. Targets schema caits explicitly.
SET search_path TO caits;

-- ---------------------------------------------------------------------------
-- Department (DEPM)
-- ---------------------------------------------------------------------------
INSERT INTO sysm_menutree_mst (
    mtree_menu_code, mtree_menu_label, mtree_menu_group, mtree_sort_order, mtree_group_sort_order, mtree_icon, mtree_doc_type,
    mtree_supports_view, mtree_supports_create, mtree_supports_edit, mtree_supports_delete,
    mtree_supports_approve, mtree_supports_reject, mtree_supports_print, mtree_supports_export,
    mtree_is_system_menu, mtree_isactive, mtree_created_by, mtree_created_on
) VALUES
('DEPM', 'Department', 'Access & People', 36, 3, 'DEPM', NULL,
 TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, TRUE, TRUE, TRUE, 'system', NOW())
ON CONFLICT (mtree_menu_code) DO UPDATE SET
    mtree_menu_label = EXCLUDED.mtree_menu_label,
    mtree_menu_group = EXCLUDED.mtree_menu_group,
    mtree_sort_order = EXCLUDED.mtree_sort_order,
    mtree_group_sort_order = EXCLUDED.mtree_group_sort_order,
    mtree_icon = EXCLUDED.mtree_icon,
    mtree_isactive = TRUE,
    mtree_modified_by = 'system',
    mtree_modified_on = NOW();

INSERT INTO sysm_rolepermission_dtl (
    rlpm_role_id_rol, rlpm_menu_id_mtree,
    rlpm_can_view, rlpm_can_create, rlpm_can_edit, rlpm_can_delete,
    rlpm_can_approve, rlpm_can_reject, rlpm_can_print, rlpm_can_export
)
SELECT
    r.rol_role_id, m.mtree_menu_id,
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
  AND m.mtree_menu_code = 'DEPM'
  AND NOT EXISTS (
      SELECT 1 FROM sysm_rolepermission_dtl rp
      WHERE rp.rlpm_role_id_rol = r.rol_role_id AND rp.rlpm_menu_id_mtree = m.mtree_menu_id
  );

-- ---------------------------------------------------------------------------
-- Inspection Approval (IAPR) — also missing from caits vs caits_local
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
    mtree_menu_label = EXCLUDED.mtree_menu_label,
    mtree_menu_group = EXCLUDED.mtree_menu_group,
    mtree_sort_order = EXCLUDED.mtree_sort_order,
    mtree_group_sort_order = EXCLUDED.mtree_group_sort_order,
    mtree_icon = EXCLUDED.mtree_icon,
    mtree_doc_type = EXCLUDED.mtree_doc_type,
    mtree_isactive = TRUE,
    mtree_modified_by = 'system',
    mtree_modified_on = NOW();

INSERT INTO sysm_rolepermission_dtl (
    rlpm_role_id_rol, rlpm_menu_id_mtree,
    rlpm_can_view, rlpm_can_create, rlpm_can_edit, rlpm_can_delete,
    rlpm_can_approve, rlpm_can_reject, rlpm_can_print, rlpm_can_export
)
SELECT
    r.rol_role_id, m.mtree_menu_id,
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
      SELECT 1 FROM sysm_rolepermission_dtl rp
      WHERE rp.rlpm_role_id_rol = r.rol_role_id AND rp.rlpm_menu_id_mtree = m.mtree_menu_id
  );

-- Also grant IAPR to roles that can view GRN (same as migration 030)
INSERT INTO sysm_rolepermission_dtl (
    rlpm_role_id_rol, rlpm_menu_id_mtree,
    rlpm_can_view, rlpm_can_create, rlpm_can_edit, rlpm_can_delete,
    rlpm_can_approve, rlpm_can_reject, rlpm_can_print, rlpm_can_export
)
SELECT
    grn.rlpm_role_id_rol,
    iapr.mtree_menu_id,
    TRUE,
    COALESCE(iapr.mtree_supports_create, FALSE),
    COALESCE(iapr.mtree_supports_edit, FALSE),
    FALSE,
    COALESCE(iapr.mtree_supports_approve, FALSE),
    FALSE,
    COALESCE(iapr.mtree_supports_print, FALSE),
    COALESCE(iapr.mtree_supports_export, FALSE)
FROM sysm_rolepermission_dtl grn
JOIN sysm_menutree_mst grn_m ON grn_m.mtree_menu_id = grn.rlpm_menu_id_mtree AND grn_m.mtree_menu_code = 'GRN'
JOIN sysm_menutree_mst iapr ON iapr.mtree_menu_code = 'IAPR'
WHERE COALESCE(grn.rlpm_can_view, FALSE) = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM sysm_rolepermission_dtl rp
      WHERE rp.rlpm_role_id_rol = grn.rlpm_role_id_rol
        AND rp.rlpm_menu_id_mtree = iapr.mtree_menu_id
  );
