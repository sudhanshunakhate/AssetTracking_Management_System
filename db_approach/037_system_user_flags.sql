-- Hidden system user/employee: not shown in Employee or User Access lists; non-deletable.

SET search_path TO caits_local;

ALTER TABLE hrc_employee_mst
    ADD COLUMN IF NOT EXISTS emp_is_system_employee BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE sysm_userlogin_mst
    ADD COLUMN IF NOT EXISTS usr_is_system_user BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN hrc_employee_mst.emp_is_system_employee IS 'Hidden bootstrap employee (not listed in Employee Master)';
COMMENT ON COLUMN sysm_userlogin_mst.usr_is_system_user IS 'Hidden bootstrap login with full access (not listed in User Access)';

UPDATE hrc_employee_mst
SET emp_is_system_employee = TRUE
WHERE emp_employee_code = 'ADMIN'
   OR emp_email = 'admin@caits.local';

UPDATE sysm_userlogin_mst u
SET usr_is_system_user = TRUE
FROM hrc_employee_mst e
WHERE u.usr_employee_id_emp = e.emp_employee_id
  AND (u.usr_login_id = 'admin' OR e.emp_is_system_employee = TRUE);
