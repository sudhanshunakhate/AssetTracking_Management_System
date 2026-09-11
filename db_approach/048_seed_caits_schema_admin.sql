-- 048: Seed schema "caits" with a single admin login (BCrypt of micropro123).
-- Prerequisite: empty caits schema structure cloned from caits_local (schema-only).
-- Safe to re-run.

SET search_path TO caits;

DO $$
DECLARE
  v_role_id   integer;
  v_entity_id integer;
  v_emp_id    integer;
  v_user_id   integer;
  -- BCryptPasswordEncoder hash of "micropro123"
  v_hash      text := '$2a$10$CMGXkTD0nP4eZ4oSgUDac.hLZckddqcAweiR9Hq6ZQzEvzQAvearG';
BEGIN
  SELECT rol_role_id INTO v_role_id
  FROM sysm_roles_mst
  WHERE UPPER(rol_role_code) = 'ADMIN'
  ORDER BY rol_role_id
  LIMIT 1;

  IF v_role_id IS NULL THEN
    INSERT INTO sysm_roles_mst (
      rol_role_code, rol_role_name, rol_desc, rol_is_system_role, rol_isactive, rol_created_by, rol_created_on
    ) VALUES (
      'ADMIN', 'Administrator', 'System administrator', true, true, 'system', NOW()
    )
    RETURNING rol_role_id INTO v_role_id;
  END IF;

  SELECT ent_entity_id INTO v_entity_id
  FROM org_entity_mst
  WHERE UPPER(ent_entity_code) = 'DEFAULT'
  LIMIT 1;

  IF v_entity_id IS NULL THEN
    INSERT INTO org_entity_mst (
      ent_entity_code, ent_entity_name, ent_short_name, ent_isactive, ent_created_by, ent_created_on
    ) VALUES (
      'DEFAULT', 'Default Organization', 'DEFAULT', true, 'system', NOW()
    )
    RETURNING ent_entity_id INTO v_entity_id;
  END IF;

  SELECT emp_employee_id INTO v_emp_id
  FROM hrc_employee_mst
  WHERE UPPER(emp_employee_code) = 'ADMIN'
  LIMIT 1;

  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_designation,
      emp_role_id_rol, emp_isactive, emp_is_system_employee, emp_created_by, emp_created_on
    ) VALUES (
      'ADMIN', 'System', 'Admin', 'admin@caits.local', 'Administrator',
      v_role_id, true, true, 'system', NOW()
    )
    RETURNING emp_employee_id INTO v_emp_id;
  ELSE
    UPDATE hrc_employee_mst
    SET emp_role_id_rol = v_role_id,
        emp_is_system_employee = true,
        emp_isactive = true
    WHERE emp_employee_id = v_emp_id;
  END IF;

  SELECT usr_user_id INTO v_user_id
  FROM sysm_userlogin_mst
  WHERE LOWER(usr_login_id) = 'admin'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    INSERT INTO sysm_userlogin_mst (
      usr_employee_id_emp, usr_login_id, usr_password_hash, usr_role_id_rol, usr_account_status,
      usr_entity_id_ent, usr_bu_access_scope, usr_location_access_scope, usr_force_password_reset,
      usr_isactive, usr_is_system_user, usr_failed_attempts, usr_created_by, usr_created_on
    ) VALUES (
      v_emp_id, 'admin', v_hash, v_role_id, 'Active',
      v_entity_id, 'ALL', 'ALL', false,
      true, true, 0, 'system', NOW()
    );
  ELSE
    UPDATE sysm_userlogin_mst
    SET usr_password_hash = v_hash,
        usr_role_id_rol = v_role_id,
        usr_entity_id_ent = v_entity_id,
        usr_employee_id_emp = v_emp_id,
        usr_account_status = 'Active',
        usr_bu_access_scope = 'ALL',
        usr_location_access_scope = 'ALL',
        usr_isactive = true,
        usr_is_system_user = true,
        usr_failed_attempts = 0
    WHERE usr_user_id = v_user_id;
  END IF;

  RAISE NOTICE '048: admin ready — role %, entity %, employee %', v_role_id, v_entity_id, v_emp_id;
END $$;
