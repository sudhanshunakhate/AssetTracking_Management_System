-- 052: Copy reference / master seed data from caits_local into caits where missing.
-- Does NOT copy transactions, stock, BLS, notifications, or passwords/users beyond roles.
-- Safe to re-run. FK targets remapped by business codes (entity/BU/category/role/menu/widget).

-- ---------------------------------------------------------------------------
-- 1) Roles missing in caits
-- ---------------------------------------------------------------------------
INSERT INTO caits.sysm_roles_mst (
    rol_role_code, rol_role_name, rol_desc,
    rol_is_system_role, rol_isactive,
    rol_created_by, rol_created_on, rol_modified_by, rol_modified_on
)
SELECT
    src.rol_role_code,
    src.rol_role_name,
    src.rol_desc,
    COALESCE(src.rol_is_system_role, FALSE),
    COALESCE(src.rol_isactive, TRUE),
    COALESCE(src.rol_created_by, 'system'),
    COALESCE(src.rol_created_on, NOW()),
    src.rol_modified_by,
    src.rol_modified_on
FROM caits_local.sysm_roles_mst src
WHERE NOT EXISTS (
    SELECT 1 FROM caits.sysm_roles_mst t
    WHERE UPPER(t.rol_role_code) = UPPER(src.rol_role_code)
);

-- ---------------------------------------------------------------------------
-- 2) Role → menu permissions (by role_code + menu_code)
-- ---------------------------------------------------------------------------
INSERT INTO caits.sysm_rolepermission_dtl (
    rlpm_role_id_rol, rlpm_menu_id_mtree,
    rlpm_can_view, rlpm_can_create, rlpm_can_edit, rlpm_can_delete,
    rlpm_can_approve, rlpm_can_reject, rlpm_can_print, rlpm_can_export
)
SELECT
    dr.rol_role_id,
    dm.mtree_menu_id,
    COALESCE(sp.rlpm_can_view, FALSE),
    COALESCE(sp.rlpm_can_create, FALSE),
    COALESCE(sp.rlpm_can_edit, FALSE),
    COALESCE(sp.rlpm_can_delete, FALSE),
    COALESCE(sp.rlpm_can_approve, FALSE),
    COALESCE(sp.rlpm_can_reject, FALSE),
    COALESCE(sp.rlpm_can_print, FALSE),
    COALESCE(sp.rlpm_can_export, FALSE)
FROM caits_local.sysm_rolepermission_dtl sp
JOIN caits_local.sysm_roles_mst sr ON sr.rol_role_id = sp.rlpm_role_id_rol
JOIN caits_local.sysm_menutree_mst sm ON sm.mtree_menu_id = sp.rlpm_menu_id_mtree
JOIN caits.sysm_roles_mst dr ON UPPER(dr.rol_role_code) = UPPER(sr.rol_role_code)
JOIN caits.sysm_menutree_mst dm ON UPPER(dm.mtree_menu_code) = UPPER(sm.mtree_menu_code)
WHERE NOT EXISTS (
    SELECT 1 FROM caits.sysm_rolepermission_dtl dp
    WHERE dp.rlpm_role_id_rol = dr.rol_role_id
      AND dp.rlpm_menu_id_mtree = dm.mtree_menu_id
);

-- ---------------------------------------------------------------------------
-- 3) Dashboard widgets catalog
-- ---------------------------------------------------------------------------
INSERT INTO caits.dash_widget_mst (
    dshw_widget_code, dshw_widget_type, dshw_title, dshw_subtitle,
    dshw_icon, dshw_tone, dshw_link_path, dshw_required_menu_code,
    dshw_default_col_span, dshw_default_sort, dshw_isactive, dshw_created_on
)
SELECT
    src.dshw_widget_code,
    src.dshw_widget_type,
    src.dshw_title,
    src.dshw_subtitle,
    src.dshw_icon,
    src.dshw_tone,
    src.dshw_link_path,
    src.dshw_required_menu_code,
    COALESCE(src.dshw_default_col_span, 1),
    COALESCE(src.dshw_default_sort, 100),
    COALESCE(src.dshw_isactive, TRUE),
    COALESCE(src.dshw_created_on, NOW())
FROM caits_local.dash_widget_mst src
WHERE NOT EXISTS (
    SELECT 1 FROM caits.dash_widget_mst t
    WHERE UPPER(t.dshw_widget_code) = UPPER(src.dshw_widget_code)
);

INSERT INTO caits.dash_role_widget_dtl (
    dshr_role_id_rol, dshr_widget_id_dshw,
    dshr_sort_order, dshr_col_span, dshr_is_visible
)
SELECT
    dr.rol_role_id,
    dw.dshw_widget_id,
    COALESCE(src.dshr_sort_order, 100),
    COALESCE(src.dshr_col_span, 1),
    COALESCE(src.dshr_is_visible, TRUE)
FROM caits_local.dash_role_widget_dtl src
JOIN caits_local.sysm_roles_mst sr ON sr.rol_role_id = src.dshr_role_id_rol
JOIN caits_local.dash_widget_mst sw ON sw.dshw_widget_id = src.dshr_widget_id_dshw
JOIN caits.sysm_roles_mst dr ON UPPER(dr.rol_role_code) = UPPER(sr.rol_role_code)
JOIN caits.dash_widget_mst dw ON UPPER(dw.dshw_widget_code) = UPPER(sw.dshw_widget_code)
WHERE NOT EXISTS (
    SELECT 1 FROM caits.dash_role_widget_dtl dp
    WHERE dp.dshr_role_id_rol = dr.rol_role_id
      AND dp.dshr_widget_id_dshw = dw.dshw_widget_id
);

-- ---------------------------------------------------------------------------
-- 4) Units
-- ---------------------------------------------------------------------------
INSERT INTO caits.unit_mst (
    unt_unit_code, unt_unit_name, unt_desc, unt_isactive,
    unt_created_by, unt_created_on, unt_modified_by, unt_modified_on
)
SELECT
    src.unt_unit_code,
    src.unt_unit_name,
    src.unt_desc,
    COALESCE(src.unt_isactive, TRUE),
    COALESCE(src.unt_created_by, 'system'),
    COALESCE(src.unt_created_on, NOW()),
    src.unt_modified_by,
    src.unt_modified_on
FROM caits_local.unit_mst src
WHERE NOT EXISTS (
    SELECT 1 FROM caits.unit_mst t
    WHERE UPPER(t.unt_unit_code) = UPPER(src.unt_unit_code)
);

-- ---------------------------------------------------------------------------
-- 5) Categories + subcategories (map category by code)
-- ---------------------------------------------------------------------------
INSERT INTO caits.category_mst (
    cat_category_code, cat_category_name, cat_desc, cat_isactive,
    cat_created_by, cat_created_on, cat_modified_by, cat_modified_on
)
SELECT
    src.cat_category_code,
    src.cat_category_name,
    src.cat_desc,
    COALESCE(src.cat_isactive, TRUE),
    COALESCE(src.cat_created_by, 'system'),
    COALESCE(src.cat_created_on, NOW()),
    src.cat_modified_by,
    src.cat_modified_on
FROM caits_local.category_mst src
WHERE NOT EXISTS (
    SELECT 1 FROM caits.category_mst t
    WHERE UPPER(t.cat_category_code) = UPPER(src.cat_category_code)
);

INSERT INTO caits.subcategory_mst (
    scat_subcategory_code, scat_subcategory_name, scat_category_id_cat, scat_desc,
    scat_isactive, scat_created_by, scat_created_on, scat_modified_by, scat_modified_on
)
SELECT
    src.scat_subcategory_code,
    src.scat_subcategory_name,
    dc.cat_category_id,
    src.scat_desc,
    COALESCE(src.scat_isactive, TRUE),
    COALESCE(src.scat_created_by, 'system'),
    COALESCE(src.scat_created_on, NOW()),
    src.scat_modified_by,
    src.scat_modified_on
FROM caits_local.subcategory_mst src
JOIN caits_local.category_mst sc ON sc.cat_category_id = src.scat_category_id_cat
JOIN caits.category_mst dc ON UPPER(dc.cat_category_code) = UPPER(sc.cat_category_code)
WHERE NOT EXISTS (
    SELECT 1 FROM caits.subcategory_mst t
    WHERE UPPER(t.scat_subcategory_code) = UPPER(src.scat_subcategory_code)
);

-- ---------------------------------------------------------------------------
-- 6) Operating units → attach to caits default entity (codes differ: ORG-001 vs DEFAULT)
-- ---------------------------------------------------------------------------
INSERT INTO caits.org_businessunit_mst (
    bu_bu_code, bu_bu_name, bu_bu_type, bu_entity_id_ent,
    bu_add1, bu_add2, bu_city, bu_state, bu_pin,
    bu_isactive, bu_created_by, bu_created_on, bu_modified_by, bu_modified_on
)
SELECT
    src.bu_bu_code,
    src.bu_bu_name,
    src.bu_bu_type,
    e.ent_entity_id,
    src.bu_add1,
    src.bu_add2,
    src.bu_city,
    src.bu_state,
    src.bu_pin,
    COALESCE(src.bu_isactive, TRUE),
    COALESCE(src.bu_created_by, 'system'),
    COALESCE(src.bu_created_on, NOW()),
    src.bu_modified_by,
    src.bu_modified_on
FROM caits_local.org_businessunit_mst src
CROSS JOIN LATERAL (
    SELECT ent_entity_id
    FROM caits.org_entity_mst
    WHERE ent_isactive = TRUE
    ORDER BY ent_entity_id
    LIMIT 1
) e
WHERE NOT EXISTS (
    SELECT 1 FROM caits.org_businessunit_mst t
    WHERE UPPER(t.bu_bu_code) = UPPER(src.bu_bu_code)
);

-- ---------------------------------------------------------------------------
-- 7) Locations missing by code (remap entity + BU by code)
-- ---------------------------------------------------------------------------
INSERT INTO caits.org_location_mst (
    loc_location_code, loc_location_name, loc_print_location_name, loc_location_type,
    loc_entity_id_ent, loc_bu_id_bu,
    loc_add1, loc_add2, loc_city, loc_pin,
    loc_is_system_location, loc_system_role, loc_isactive,
    loc_created_by, loc_created_on, loc_modified_by, loc_modified_on
)
SELECT
    src.loc_location_code,
    src.loc_location_name,
    src.loc_print_location_name,
    src.loc_location_type,
    e.ent_entity_id,
    db.bu_bu_id,
    src.loc_add1,
    src.loc_add2,
    src.loc_city,
    src.loc_pin,
    COALESCE(src.loc_is_system_location, FALSE),
    src.loc_system_role,
    COALESCE(src.loc_isactive, TRUE),
    COALESCE(src.loc_created_by, 'system'),
    COALESCE(src.loc_created_on, NOW()),
    src.loc_modified_by,
    src.loc_modified_on
FROM caits_local.org_location_mst src
LEFT JOIN caits_local.org_businessunit_mst sb ON sb.bu_bu_id = src.loc_bu_id_bu
LEFT JOIN caits.org_businessunit_mst db ON db.bu_bu_code IS NOT NULL
     AND UPPER(db.bu_bu_code) = UPPER(sb.bu_bu_code)
CROSS JOIN LATERAL (
    SELECT ent_entity_id
    FROM caits.org_entity_mst
    WHERE ent_isactive = TRUE
    ORDER BY ent_entity_id
    LIMIT 1
) e
WHERE NOT EXISTS (
    SELECT 1 FROM caits.org_location_mst t
    WHERE UPPER(t.loc_location_code) = UPPER(src.loc_location_code)
);

-- ---------------------------------------------------------------------------
-- 8) Departments missing by code (keep existing caits seed rows; add local-only codes)
-- ---------------------------------------------------------------------------
INSERT INTO caits.hrc_department_mst (
    dept_department_code, dept_department_name, dept_entity_id_ent,
    dept_bu_id_bu, dept_location_id_loc, dept_desc, dept_isactive,
    dept_created_by, dept_created_on, dept_modified_by, dept_modified_on
)
SELECT
    src.dept_department_code,
    src.dept_department_name,
    e.ent_entity_id,
    db.bu_bu_id,
    dl.loc_location_id,
    src.dept_desc,
    COALESCE(src.dept_isactive, TRUE),
    COALESCE(src.dept_created_by, 'system'),
    COALESCE(src.dept_created_on, NOW()),
    src.dept_modified_by,
    src.dept_modified_on
FROM caits_local.hrc_department_mst src
LEFT JOIN caits_local.org_businessunit_mst sb ON sb.bu_bu_id = src.dept_bu_id_bu
LEFT JOIN caits.org_businessunit_mst db ON db.bu_bu_code IS NOT NULL
     AND UPPER(db.bu_bu_code) = UPPER(sb.bu_bu_code)
LEFT JOIN caits_local.org_location_mst sl ON sl.loc_location_id = src.dept_location_id_loc
LEFT JOIN caits.org_location_mst dl ON dl.loc_location_code IS NOT NULL
     AND UPPER(dl.loc_location_code) = UPPER(sl.loc_location_code)
CROSS JOIN LATERAL (
    SELECT ent_entity_id
    FROM caits.org_entity_mst
    WHERE ent_isactive = TRUE
    ORDER BY ent_entity_id
    LIMIT 1
) e
WHERE NOT EXISTS (
    SELECT 1 FROM caits.hrc_department_mst t
    WHERE UPPER(t.dept_department_code) = UPPER(src.dept_department_code)
);

-- If caits departments still lack a location (NOT NULL in schema), attach first active location.
UPDATE caits.hrc_department_mst d
SET dept_location_id_loc = l.loc_location_id,
    dept_modified_by = 'system',
    dept_modified_on = NOW()
FROM (
    SELECT loc_location_id
    FROM caits.org_location_mst
    WHERE loc_isactive = TRUE
    ORDER BY loc_location_id
    LIMIT 1
) l
WHERE d.dept_location_id_loc IS NULL;
