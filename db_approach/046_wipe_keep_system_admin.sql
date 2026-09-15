-- 046: Wipe business/transaction data; keep system-admin bootstrap only.
-- Does NOT drop tables. Safe to re-run.
--
-- KEEPS:
--   ADMIN role, admin/system users & employees, menus, ADMIN role permissions,
--   ADMIN dashboard widgets + widget catalog, general type/master lookups,
--   org entity(ies) used by system users, system locations, departments on those entities
--
-- CLEARS:
--   All transactions, stock, BLS, items/vendors, categories/units,
--   non-system users/employees/roles, non-system locations, OUs,
--   notifications, favourites, access exceptions, user BU/location maps

SET search_path TO caits_local;

DO $$
DECLARE
  v_admin_role_id   integer;
  v_admin_entity_ids integer[];
  v_sys_emp_ids     integer[];
  v_sys_user_ids    integer[];
  v_main_loc_id     integer;
  v_kept_emp        integer;
  v_kept_user       integer;
BEGIN
  SELECT rol_role_id
  INTO v_admin_role_id
  FROM sysm_roles_mst
  WHERE UPPER(rol_role_code) = 'ADMIN'
  ORDER BY rol_role_id
  LIMIT 1;

  IF v_admin_role_id IS NULL THEN
    RAISE EXCEPTION '046: ADMIN role not found — aborting wipe to avoid locking you out';
  END IF;

  SELECT COALESCE(array_agg(DISTINCT u.usr_user_id), ARRAY[]::integer[])
  INTO v_sys_user_ids
  FROM sysm_userlogin_mst u
  WHERE COALESCE(u.usr_is_system_user, false) = true
     OR LOWER(u.usr_login_id) = 'admin'
     OR u.usr_role_id_rol = v_admin_role_id;

  IF cardinality(v_sys_user_ids) = 0 THEN
    RAISE EXCEPTION '046: no admin/system login found — aborting wipe';
  END IF;

  SELECT COALESCE(array_agg(DISTINCT e.emp_employee_id), ARRAY[]::integer[])
  INTO v_sys_emp_ids
  FROM hrc_employee_mst e
  WHERE COALESCE(e.emp_is_system_employee, false) = true
     OR UPPER(e.emp_employee_code) = 'ADMIN'
     OR e.emp_employee_id IN (
          SELECT u.usr_employee_id_emp
          FROM sysm_userlogin_mst u
          WHERE u.usr_user_id = ANY (v_sys_user_ids)
            AND u.usr_employee_id_emp IS NOT NULL
        );

  SELECT COALESCE(array_agg(DISTINCT u.usr_entity_id_ent), ARRAY[]::integer[])
  INTO v_admin_entity_ids
  FROM sysm_userlogin_mst u
  WHERE u.usr_user_id = ANY (v_sys_user_ids)
    AND u.usr_entity_id_ent IS NOT NULL;

  IF cardinality(v_admin_entity_ids) = 0 THEN
    SELECT COALESCE(array_agg(ent_entity_id), ARRAY[]::integer[])
    INTO v_admin_entity_ids
    FROM org_entity_mst
    WHERE UPPER(ent_entity_code) = 'DEFAULT';
  END IF;

  RAISE NOTICE '046: keeping ADMIN role %, users %, employees %, entities %',
    v_admin_role_id, v_sys_user_ids, v_sys_emp_ids, v_admin_entity_ids;

  -- -------------------------------------------------------------------------
  -- 1) Notifications / personal UX
  -- -------------------------------------------------------------------------
  DELETE FROM ntf_notification_mst;
  DELETE FROM ntf_push_subscription_dtl;
  DELETE FROM sysm_user_favourite_menu_dtl;
  DELETE FROM sysm_useraccess_exception_dtl;
  DELETE FROM sysm_user_bu_mapping_dtl;
  DELETE FROM sysm_user_location_mapping_dtl;

  -- -------------------------------------------------------------------------
  -- 2) Transactions + stock + BLS + items + vendors
  -- -------------------------------------------------------------------------
  UPDATE inv_stock_mst SET stk_last_txn_header_id_txh = NULL WHERE stk_last_txn_header_id_txh IS NOT NULL;
  UPDATE txn_header_mst SET txh_ref_txn_header_id_txh = NULL WHERE txh_ref_txn_header_id_txh IS NOT NULL;
  UPDATE txn_detail_dtl SET txd_bls_id_ibm = NULL WHERE txd_bls_id_ibm IS NOT NULL;

  DELETE FROM txn_detail_dtl;
  DELETE FROM txn_header_mst;
  DELETE FROM inv_stock_mst;
  DELETE FROM inv_bls_mst;

  IF to_regclass('caits_local.inv_item_bu_mapping_dtl') IS NOT NULL THEN
    DELETE FROM inv_item_bu_mapping_dtl;
  END IF;
  IF to_regclass('caits_local.inv_item_location_mapping_dtl') IS NOT NULL THEN
    DELETE FROM inv_item_location_mapping_dtl;
  END IF;

  UPDATE inv_item_mst SET itm_parent_item_id_itm = NULL WHERE itm_parent_item_id_itm IS NOT NULL;
  DELETE FROM inv_item_mst;
  DELETE FROM inv_vendor_mst;

  -- -------------------------------------------------------------------------
  -- 3) Inventory masters (categories / units)
  -- -------------------------------------------------------------------------
  DELETE FROM subcategory_mst;
  DELETE FROM category_mst;
  DELETE FROM unit_mst;

  -- -------------------------------------------------------------------------
  -- 4) Non-admin dashboard role layouts (keep widget catalog + ADMIN layout)
  -- -------------------------------------------------------------------------
  IF to_regclass('caits_local.dash_role_widget_dtl') IS NOT NULL THEN
    DELETE FROM dash_role_widget_dtl
    WHERE dshr_role_id_rol IS DISTINCT FROM v_admin_role_id;
  END IF;

  -- -------------------------------------------------------------------------
  -- 5) Non-system users / employees first, then non-ADMIN roles
  -- -------------------------------------------------------------------------
  UPDATE sysm_userlogin_mst
  SET usr_location_id_loc = NULL
  WHERE usr_user_id = ANY (v_sys_user_ids);

  DELETE FROM sysm_userlogin_mst
  WHERE usr_user_id <> ALL (v_sys_user_ids);

  -- Clear employee graph FKs that block deletes
  UPDATE hrc_employee_mst
  SET emp_reporting_to_emp_id_emp = NULL
  WHERE emp_reporting_to_emp_id_emp IS NOT NULL;

  UPDATE hrc_department_mst
  SET dept_head_emp_id_emp = NULL
  WHERE dept_head_emp_id_emp IS NOT NULL;

  UPDATE org_businessunit_mst
  SET bu_manager_emp_id_emp = NULL
  WHERE bu_manager_emp_id_emp IS NOT NULL;

  UPDATE org_location_mst
  SET loc_manager_emp_id_emp = NULL
  WHERE loc_manager_emp_id_emp IS NOT NULL;

  -- Point kept people at ADMIN before dropping other roles
  UPDATE hrc_employee_mst
  SET emp_role_id_rol = v_admin_role_id,
      emp_is_system_employee = true,
      emp_isactive = true
  WHERE emp_employee_id = ANY (v_sys_emp_ids);

  UPDATE sysm_userlogin_mst
  SET usr_role_id_rol = v_admin_role_id,
      usr_bu_access_scope = COALESCE(usr_bu_access_scope, 'ALL'),
      usr_location_access_scope = COALESCE(usr_location_access_scope, 'ALL'),
      usr_is_system_user = true,
      usr_account_status = 'Active',
      usr_isactive = true,
      usr_failed_attempts = 0
  WHERE usr_user_id = ANY (v_sys_user_ids);

  DELETE FROM hrc_employee_mst
  WHERE emp_employee_id <> ALL (v_sys_emp_ids);

  DELETE FROM sysm_rolepermission_dtl
  WHERE rlpm_role_id_rol IS DISTINCT FROM v_admin_role_id;

  DELETE FROM sysm_roles_mst
  WHERE rol_role_id IS DISTINCT FROM v_admin_role_id;

  -- -------------------------------------------------------------------------
  -- 6) Locations / OUs — keep system locations on admin entities
  -- -------------------------------------------------------------------------
  -- Prefer MAIN_STORE as fallback for dept/employee location FKs
  SELECT l.loc_location_id
  INTO v_main_loc_id
  FROM org_location_mst l
  WHERE COALESCE(l.loc_is_system_location, false) = true
    AND UPPER(COALESCE(l.loc_system_role, '')) = 'MAIN_STORE'
    AND (
      cardinality(v_admin_entity_ids) = 0
      OR l.loc_entity_id_ent = ANY (v_admin_entity_ids)
    )
  ORDER BY l.loc_location_id
  LIMIT 1;

  IF v_main_loc_id IS NULL THEN
    SELECT l.loc_location_id
    INTO v_main_loc_id
    FROM org_location_mst l
    WHERE COALESCE(l.loc_is_system_location, false) = true
      AND (
        cardinality(v_admin_entity_ids) = 0
        OR l.loc_entity_id_ent = ANY (v_admin_entity_ids)
      )
    ORDER BY l.loc_location_id
    LIMIT 1;
  END IF;

  IF v_main_loc_id IS NOT NULL THEN
    UPDATE hrc_department_mst
    SET dept_location_id_loc = v_main_loc_id
    WHERE dept_location_id_loc IS DISTINCT FROM v_main_loc_id
      AND (
        cardinality(v_admin_entity_ids) = 0
        OR dept_entity_id_ent = ANY (v_admin_entity_ids)
      );

    UPDATE hrc_employee_mst
    SET emp_base_location_id_loc = v_main_loc_id
    WHERE emp_employee_id = ANY (v_sys_emp_ids)
      AND emp_base_location_id_loc IS DISTINCT FROM v_main_loc_id;
  END IF;

  -- Drop mappings that reference locations about to go
  DELETE FROM sysm_user_location_mapping_dtl ul
  WHERE ul.uloc_location_id_loc IN (
    SELECT loc_location_id FROM org_location_mst
    WHERE COALESCE(loc_is_system_location, false) = false
       OR (
         cardinality(v_admin_entity_ids) > 0
         AND loc_entity_id_ent <> ALL (v_admin_entity_ids)
       )
  );

  UPDATE sysm_userlogin_mst
  SET usr_location_id_loc = NULL
  WHERE usr_location_id_loc IS NOT NULL
    AND usr_location_id_loc NOT IN (
      SELECT loc_location_id FROM org_location_mst
      WHERE COALESCE(loc_is_system_location, false) = true
        AND (
          cardinality(v_admin_entity_ids) = 0
          OR loc_entity_id_ent = ANY (v_admin_entity_ids)
        )
    );

  DELETE FROM org_location_mst
  WHERE COALESCE(loc_is_system_location, false) = false
     OR (
       cardinality(v_admin_entity_ids) > 0
       AND loc_entity_id_ent <> ALL (v_admin_entity_ids)
     );

  -- Deduplicate system locations per entity + role (keep lowest id)
  DELETE FROM org_location_mst l
  WHERE COALESCE(l.loc_is_system_location, false) = true
    AND l.loc_system_role IS NOT NULL
    AND l.loc_location_id <> (
      SELECT MIN(l2.loc_location_id)
      FROM org_location_mst l2
      WHERE COALESCE(l2.loc_is_system_location, false) = true
        AND l2.loc_entity_id_ent = l.loc_entity_id_ent
        AND l2.loc_system_role = l.loc_system_role
    );

  -- Re-point depts/employees if their MAIN_STORE id changed after dedupe
  SELECT l.loc_location_id
  INTO v_main_loc_id
  FROM org_location_mst l
  WHERE COALESCE(l.loc_is_system_location, false) = true
    AND UPPER(COALESCE(l.loc_system_role, '')) = 'MAIN_STORE'
    AND (
      cardinality(v_admin_entity_ids) = 0
      OR l.loc_entity_id_ent = ANY (v_admin_entity_ids)
    )
  ORDER BY l.loc_location_id
  LIMIT 1;

  IF v_main_loc_id IS NOT NULL THEN
    UPDATE hrc_department_mst
    SET dept_location_id_loc = v_main_loc_id
    WHERE cardinality(v_admin_entity_ids) = 0
       OR dept_entity_id_ent = ANY (v_admin_entity_ids);

    UPDATE hrc_employee_mst
    SET emp_base_location_id_loc = v_main_loc_id
    WHERE emp_employee_id = ANY (v_sys_emp_ids);
  END IF;

  -- Drop OUs that nothing still references (detach dept OU links first)
  UPDATE org_businessunit_mst SET bu_manager_emp_id_emp = NULL WHERE bu_manager_emp_id_emp IS NOT NULL;
  UPDATE hrc_department_mst SET dept_bu_id_bu = NULL WHERE dept_bu_id_bu IS NOT NULL;

  DELETE FROM org_businessunit_mst bu
  WHERE NOT EXISTS (
    SELECT 1 FROM org_location_mst l WHERE l.loc_bu_id_bu = bu.bu_bu_id
  );

  -- Departments outside admin entities
  IF cardinality(v_admin_entity_ids) > 0 THEN
    DELETE FROM hrc_department_mst
    WHERE dept_entity_id_ent <> ALL (v_admin_entity_ids);
  END IF;

  -- Extra entities not used by system users
  IF cardinality(v_admin_entity_ids) > 0 THEN
    DELETE FROM org_entity_mst
    WHERE ent_entity_id <> ALL (v_admin_entity_ids);
  END IF;

  SELECT COUNT(*) INTO v_kept_emp FROM hrc_employee_mst;
  SELECT COUNT(*) INTO v_kept_user FROM sysm_userlogin_mst;

  RAISE NOTICE '046: wipe complete — remaining users %, employees %, locations %, menus %, roles %',
    v_kept_user,
    v_kept_emp,
    (SELECT COUNT(*) FROM org_location_mst),
    (SELECT COUNT(*) FROM sysm_menutree_mst),
    (SELECT COUNT(*) FROM sysm_roles_mst);
END $$;
