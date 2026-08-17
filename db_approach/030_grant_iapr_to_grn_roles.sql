-- Grant Inspection Approval (IAPR) to every role that can view GRN.
-- Migration 026 only seeded IAPR for ADMIN; store staff / inspectors need it too.
-- Safe to re-run: skips roles that already have IAPR.

SET search_path TO caits_local;

INSERT INTO sysm_rolepermission_dtl (
    rlpm_role_id_rol, rlpm_menu_id_mtree,
    rlpm_can_view, rlpm_can_create, rlpm_can_edit, rlpm_can_delete,
    rlpm_can_approve, rlpm_can_reject, rlpm_can_print, rlpm_can_export
)
SELECT DISTINCT
    grn_perm.rlpm_role_id_rol,
    iapr.mtree_menu_id,
    TRUE,
    COALESCE(iapr.mtree_supports_create, FALSE),
    COALESCE(iapr.mtree_supports_edit, FALSE),
    COALESCE(iapr.mtree_supports_delete, FALSE),
    COALESCE(iapr.mtree_supports_approve, FALSE),
    COALESCE(iapr.mtree_supports_reject, FALSE),
    COALESCE(iapr.mtree_supports_print, FALSE),
    COALESCE(iapr.mtree_supports_export, FALSE)
FROM sysm_rolepermission_dtl grn_perm
JOIN sysm_menutree_mst grn_m
  ON grn_m.mtree_menu_id = grn_perm.rlpm_menu_id_mtree
 AND grn_m.mtree_menu_code = 'GRN'
JOIN sysm_menutree_mst iapr
  ON iapr.mtree_menu_code = 'IAPR'
 AND iapr.mtree_isactive = TRUE
WHERE grn_perm.rlpm_can_view = TRUE
  AND NOT EXISTS (
      SELECT 1
      FROM sysm_rolepermission_dtl existing
      WHERE existing.rlpm_role_id_rol = grn_perm.rlpm_role_id_rol
        AND existing.rlpm_menu_id_mtree = iapr.mtree_menu_id
  );
