-- 054: Seed Micropro employee master rows from employee import CSV.
-- Target schema: caits (default app profile). Re-runnable.
-- No UI/backend code changes required.

SET search_path TO caits;

DO $$
DECLARE
  v_inserted integer := 0;
  v_updated integer := 0;
  v_dept_id integer;
  v_emp_id integer;
BEGIN
  -- 445
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-MKT') LIMIT 1;
  IF 'DEPT-MKT' IS NOT NULL AND 'DEPT-MKT' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-MKT';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('445') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '445', 'Aditya', 'Indurkar', 'aindurkar@microproindia.com', NULL,
      'MARKETING EXECUTIVE', v_dept_id, 'permanent', 'M',
      '1994-07-09', '2025-01-02', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Aditya',
      emp_last_name = 'Indurkar',
      emp_email = 'aindurkar@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'MARKETING EXECUTIVE',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1994-07-09',
      emp_joining_date = '2025-01-02',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 413
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-NH') LIMIT 1;
  IF 'DEPT-SD-NH' IS NOT NULL AND 'DEPT-SD-NH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-NH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('413') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '413', 'Akansha', 'Timande', 'atimande@microproindia.com', NULL,
      'Junior Software Engineer', v_dept_id, 'permanent', 'F',
      '2001-01-19', '2024-09-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Akansha',
      emp_last_name = 'Timande',
      emp_email = 'atimande@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Junior Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '2001-01-19',
      emp_joining_date = '2024-09-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4172
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-ADMIN') LIMIT 1;
  IF 'DEPT-ADMIN' IS NOT NULL AND 'DEPT-ADMIN' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-ADMIN';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4172') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4172', 'Akash', 'Shirsagar', 'ashirsagar@microproindia.com', NULL,
      'Peon/Office Boy/Office Assistant', v_dept_id, 'permanent', 'M',
      '1998-11-06', '2022-01-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Akash',
      emp_last_name = 'Shirsagar',
      emp_email = 'ashirsagar@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Peon/Office Boy/Office Assistant',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1998-11-06',
      emp_joining_date = '2022-01-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 388
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-DIN') LIMIT 1;
  IF 'DEPT-SD-DIN' IS NOT NULL AND 'DEPT-SD-DIN' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-DIN';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('388') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '388', 'Akash', 'Jamgade', 'ajamgade@microproindia.com', NULL,
      'Team Leader', v_dept_id, 'permanent', 'M',
      '1994-05-05', '2024-03-26', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Akash',
      emp_last_name = 'Jamgade',
      emp_email = 'ajamgade@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Team Leader',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1994-05-05',
      emp_joining_date = '2024-03-26',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 317
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('SD-PTAX') LIMIT 1;
  IF 'SD-PTAX' IS NOT NULL AND 'SD-PTAX' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'SD-PTAX';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('317') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '317', 'Akshata', 'Mahajan', 'amahajan@microproindia.com', NULL,
      'Software Engineer', v_dept_id, 'permanent', 'F',
      '2000-04-03', '2023-02-07', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Akshata',
      emp_last_name = 'Mahajan',
      emp_email = 'amahajan@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '2000-04-03',
      emp_joining_date = '2023-02-07',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 320
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('SD-TEST') LIMIT 1;
  IF 'SD-TEST' IS NOT NULL AND 'SD-TEST' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'SD-TEST';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('320') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '320', 'Akshay', 'Alshi', 'aalshi@microproindia.com', NULL,
      'Senior QA Engineer', v_dept_id, 'permanent', 'M',
      '1997-05-05', '2023-02-13', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Akshay',
      emp_last_name = 'Alshi',
      emp_email = 'aalshi@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Senior QA Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1997-05-05',
      emp_joining_date = '2023-02-13',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4169
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-IFM') LIMIT 1;
  IF 'DEPT-IFM' IS NOT NULL AND 'DEPT-IFM' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-IFM';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4169') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4169', 'Akshay', 'Telkunte', 'atelkunte@microproindia.com', NULL,
      'Team Lead- Infrastructure Services', v_dept_id, 'permanent', 'M',
      '1993-10-14', '2022-01-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Akshay',
      emp_last_name = 'Telkunte',
      emp_email = 'atelkunte@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Team Lead- Infrastructure Services',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1993-10-14',
      emp_joining_date = '2022-01-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- E0018
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-DIN') LIMIT 1;
  IF 'DEPT-SD-DIN' IS NOT NULL AND 'DEPT-SD-DIN' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-DIN';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('E0018') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      'E0018', 'Amit', 'Peshkar', 'apeshkar@microproindia.com', NULL,
      'Chief of ERP & Strategic Technology Projects', v_dept_id, 'permanent', 'M',
      '1979-11-14', '2002-01-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Amit',
      emp_last_name = 'Peshkar',
      emp_email = 'apeshkar@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Chief of ERP & Strategic Technology Projects',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1979-11-14',
      emp_joining_date = '2002-01-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- E0020
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-IFM-TRD') LIMIT 1;
  IF 'DEPT-IFM-TRD' IS NOT NULL AND 'DEPT-IFM-TRD' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-IFM-TRD';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('E0020') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      'E0020', 'Amol', 'Wagh', 'awagh@microproindia.com', NULL,
      'Deputy Head - Infrastructure Services', v_dept_id, 'permanent', 'M',
      '1982-03-08', '2007-07-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Amol',
      emp_last_name = 'Wagh',
      emp_email = 'awagh@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Deputy Head - Infrastructure Services',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1982-03-08',
      emp_joining_date = '2007-07-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 452
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-IFM') LIMIT 1;
  IF 'DEPT-IFM' IS NOT NULL AND 'DEPT-IFM' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-IFM';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('452') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '452', 'Aniket', 'Meshram', 'ameshram@microproindia.com', NULL,
      'Jr. IMS Trainee', v_dept_id, 'permanent', 'M',
      '1990-01-13', '2025-05-08', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Aniket',
      emp_last_name = 'Meshram',
      emp_email = 'ameshram@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. IMS Trainee',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1990-01-13',
      emp_joining_date = '2025-05-08',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 3008
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMO') LIMIT 1;
  IF 'DEPT-PRMO' IS NOT NULL AND 'DEPT-PRMO' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMO';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('3008') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '3008', 'Anirudha', 'Ashtikar', 'aashtikar@microproindia.com', NULL,
      'MANAGER MARKETING', v_dept_id, 'permanent', 'M',
      '1971-09-21', '2009-07-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Anirudha',
      emp_last_name = 'Ashtikar',
      emp_email = 'aashtikar@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'MANAGER MARKETING',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1971-09-21',
      emp_joining_date = '2009-07-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 351
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-VNIT') LIMIT 1;
  IF 'DEPT-SD-VNIT' IS NOT NULL AND 'DEPT-SD-VNIT' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-VNIT';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('351') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '351', 'Anjali', 'Rathod', 'arathod@microproindia.com', NULL,
      'Jr. Software Engineer', v_dept_id, 'permanent', 'F',
      '2001-11-07', '2023-09-21', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Anjali',
      emp_last_name = 'Rathod',
      emp_email = 'arathod@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '2001-11-07',
      emp_joining_date = '2023-09-21',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4207
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-DIN') LIMIT 1;
  IF 'DEPT-SD-DIN' IS NOT NULL AND 'DEPT-SD-DIN' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-DIN';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4207') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4207', 'Ankit', 'Lede', 'alede@microproindia.com', NULL,
      'Software Engineer', v_dept_id, 'permanent', 'M',
      '1996-08-14', '2022-10-18', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Ankit',
      emp_last_name = 'Lede',
      emp_email = 'alede@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1996-08-14',
      emp_joining_date = '2022-10-18',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 370
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-VNIT') LIMIT 1;
  IF 'DEPT-SD-VNIT' IS NOT NULL AND 'DEPT-SD-VNIT' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-VNIT';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('370') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '370', 'Ankit', 'Ninave', 'aninave@microproindia.com', NULL,
      'Software Engineer', v_dept_id, 'permanent', 'M',
      '1998-01-12', '2023-10-11', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Ankit',
      emp_last_name = 'Ninave',
      emp_email = 'aninave@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1998-01-12',
      emp_joining_date = '2023-10-11',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 327
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-NH') LIMIT 1;
  IF 'DEPT-SD-NH' IS NOT NULL AND 'DEPT-SD-NH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-NH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('327') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '327', 'Ankush', 'Bhure', 'abhure@microproindia.com', NULL,
      'Senior Software Engineer', v_dept_id, 'permanent', 'M',
      '2001-06-20', '2023-05-23', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Ankush',
      emp_last_name = 'Bhure',
      emp_email = 'abhure@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Senior Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '2001-06-20',
      emp_joining_date = '2023-05-23',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 348
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-OH') LIMIT 1;
  IF 'DEPT-SD-OH' IS NOT NULL AND 'DEPT-SD-OH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-OH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('348') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '348', 'Anshul', 'Ghumadwar', 'aghumadwar@microproindia.com', NULL,
      'Jr. Software Engineer', v_dept_id, 'permanent', 'M',
      '2002-04-27', '2023-09-21', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Anshul',
      emp_last_name = 'Ghumadwar',
      emp_email = 'aghumadwar@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '2002-04-27',
      emp_joining_date = '2023-09-21',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- E0025
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('SD-PTAX') LIMIT 1;
  IF 'SD-PTAX' IS NOT NULL AND 'SD-PTAX' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'SD-PTAX';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('E0025') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      'E0025', 'Aparna', 'Kubde', 'akubde@microproindia.com', NULL,
      'PROJECT MANAGER', v_dept_id, 'permanent', 'F',
      '1974-01-02', '2001-02-19', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Aparna',
      emp_last_name = 'Kubde',
      emp_email = 'akubde@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'PROJECT MANAGER',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '1974-01-02',
      emp_joining_date = '2001-02-19',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4130
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMZ') LIMIT 1;
  IF 'DEPT-PRMZ' IS NOT NULL AND 'DEPT-PRMZ' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMZ';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4130') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4130', 'Avinash', 'Maind', 'amaind@microproindia.com', NULL,
      'Support Engineer', v_dept_id, 'permanent', 'M',
      '1979-12-31', '2020-03-02', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Avinash',
      emp_last_name = 'Maind',
      emp_email = 'amaind@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Support Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1979-12-31',
      emp_joining_date = '2020-03-02',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4114
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-ADMIN') LIMIT 1;
  IF 'DEPT-ADMIN' IS NOT NULL AND 'DEPT-ADMIN' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-ADMIN';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4114') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4114', 'Avinash', 'Saut', 'asaut@microproindia.com', NULL,
      'DRIVER', v_dept_id, 'permanent', 'M',
      NULL, '2019-08-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Avinash',
      emp_last_name = 'Saut',
      emp_email = 'asaut@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'DRIVER',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = NULL,
      emp_joining_date = '2019-08-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 467
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('SD-TEST') LIMIT 1;
  IF 'SD-TEST' IS NOT NULL AND 'SD-TEST' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'SD-TEST';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('467') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '467', 'Bhagvanti', 'Khandate', 'bkhandate@microproindia.com', NULL,
      'Jr. QA Engineer', v_dept_id, 'permanent', 'F',
      '2000-07-15', '2025-12-15', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Bhagvanti',
      emp_last_name = 'Khandate',
      emp_email = 'bkhandate@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. QA Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '2000-07-15',
      emp_joining_date = '2025-12-15',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 346
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-VNIT') LIMIT 1;
  IF 'DEPT-SD-VNIT' IS NOT NULL AND 'DEPT-SD-VNIT' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-VNIT';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('346') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '346', 'Bhargavi', 'Deshmukh', 'bdeshmukh@microproindia.com', NULL,
      'Junior Software Engineer', v_dept_id, 'permanent', 'F',
      '2001-01-22', '2023-09-21', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Bhargavi',
      emp_last_name = 'Deshmukh',
      emp_email = 'bdeshmukh@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Junior Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '2001-01-22',
      emp_joining_date = '2023-09-21',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 457
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-IFM-TRD') LIMIT 1;
  IF 'DEPT-IFM-TRD' IS NOT NULL AND 'DEPT-IFM-TRD' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-IFM-TRD';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('457') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '457', 'Chetan', 'Barbude', 'cbarbude@microproindia.com', NULL,
      'MARKETING EXECUTIVE', v_dept_id, 'permanent', 'M',
      '1999-04-09', '2025-06-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Chetan',
      emp_last_name = 'Barbude',
      emp_email = 'cbarbude@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'MARKETING EXECUTIVE',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1999-04-09',
      emp_joining_date = '2025-06-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 478
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-NH') LIMIT 1;
  IF 'DEPT-SD-NH' IS NOT NULL AND 'DEPT-SD-NH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-NH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('478') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '478', 'Devesh', 'Patil', 'dpatil@microproindia.com', NULL,
      'TRAINEE', v_dept_id, 'permanent', 'M',
      '2005-01-26', '2026-07-27', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Devesh',
      emp_last_name = 'Patil',
      emp_email = 'dpatil@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'TRAINEE',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '2005-01-26',
      emp_joining_date = '2026-07-27',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 481
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-DIN') LIMIT 1;
  IF 'DEPT-SD-DIN' IS NOT NULL AND 'DEPT-SD-DIN' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-DIN';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('481') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '481', 'Dhanashree', 'Barapatre', 'dbarapatre@microproindia.com', NULL,
      'Software Engineer', v_dept_id, 'permanent', 'F',
      '1988-07-21', '2026-08-10', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Dhanashree',
      emp_last_name = 'Barapatre',
      emp_email = 'dbarapatre@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '1988-07-21',
      emp_joining_date = '2026-08-10',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 323
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-IMPL') LIMIT 1;
  IF 'DEPT-IMPL' IS NOT NULL AND 'DEPT-IMPL' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-IMPL';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('323') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '323', 'Dipanjay', 'Waghade', 'dwaghade@microproindia.com', NULL,
      'Project Coordinator- Implementation', v_dept_id, 'permanent', 'M',
      '1992-11-08', '2023-04-21', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Dipanjay',
      emp_last_name = 'Waghade',
      emp_email = 'dwaghade@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Project Coordinator- Implementation',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1992-11-08',
      emp_joining_date = '2023-04-21',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 338
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('SD-TEST') LIMIT 1;
  IF 'SD-TEST' IS NOT NULL AND 'SD-TEST' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'SD-TEST';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('338') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '338', 'Dnyaneshwari', 'Nare', 'dnare@microproindia.com', NULL,
      'Jr. QA Engineer', v_dept_id, 'permanent', 'F',
      '2001-07-17', '2023-08-19', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Dnyaneshwari',
      emp_last_name = 'Nare',
      emp_email = 'dnare@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. QA Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '2001-07-17',
      emp_joining_date = '2023-08-19',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4020
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-ACC') LIMIT 1;
  IF 'DEPT-ACC' IS NOT NULL AND 'DEPT-ACC' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-ACC';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4020') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4020', 'Gajanan', 'Bharti', 'gbharti@microproindia.com', NULL,
      'Senior Manager (Account)', v_dept_id, 'permanent', 'M',
      '1989-04-02', '2017-06-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Gajanan',
      emp_last_name = 'Bharti',
      emp_email = 'gbharti@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Senior Manager (Account)',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1989-04-02',
      emp_joining_date = '2017-06-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4022
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-IFM') LIMIT 1;
  IF 'DEPT-IFM' IS NOT NULL AND 'DEPT-IFM' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-IFM';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4022') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4022', 'Ganesh', 'Iwnate', 'giwnate@microproindia.com', NULL,
      'Team Lead- Infrastructure Services', v_dept_id, 'permanent', 'M',
      '1990-04-20', '2017-06-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Ganesh',
      emp_last_name = 'Iwnate',
      emp_email = 'giwnate@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Team Lead- Infrastructure Services',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1990-04-20',
      emp_joining_date = '2017-06-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4055
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-ADMIN') LIMIT 1;
  IF 'DEPT-ADMIN' IS NOT NULL AND 'DEPT-ADMIN' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-ADMIN';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4055') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4055', 'Ganesh', 'Kshirsagar', 'gkshirsagar@microproindia.com', NULL,
      'Peon/Office Boy/Office Assistant', v_dept_id, 'permanent', 'M',
      '1985-09-29', '2017-12-20', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Ganesh',
      emp_last_name = 'Kshirsagar',
      emp_email = 'gkshirsagar@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Peon/Office Boy/Office Assistant',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1985-09-29',
      emp_joining_date = '2017-12-20',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4204
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('SD-TEST') LIMIT 1;
  IF 'SD-TEST' IS NOT NULL AND 'SD-TEST' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'SD-TEST';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4204') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4204', 'Gaurav', 'Vighe', 'gvighe@microproindia.com', NULL,
      'Senior QA Engineer', v_dept_id, 'permanent', 'M',
      '1989-08-31', '2022-08-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Gaurav',
      emp_last_name = 'Vighe',
      emp_email = 'gvighe@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Senior QA Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1989-08-31',
      emp_joining_date = '2022-08-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 416
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('SD-PTAX') LIMIT 1;
  IF 'SD-PTAX' IS NOT NULL AND 'SD-PTAX' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'SD-PTAX';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('416') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '416', 'Hanshu', 'Thakur', 'hthakur@microproindia.com', NULL,
      'Jr. Software Engineer', v_dept_id, 'permanent', 'M',
      '2001-03-10', '2024-09-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Hanshu',
      emp_last_name = 'Thakur',
      emp_email = 'hthakur@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '2001-03-10',
      emp_joining_date = '2024-09-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 483
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-NH') LIMIT 1;
  IF 'DEPT-SD-NH' IS NOT NULL AND 'DEPT-SD-NH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-NH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('483') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '483', 'Harsh', 'Madankar', 'hmadankar@microproindia.com', NULL,
      'TRAINEE', v_dept_id, 'permanent', 'M',
      '2003-03-15', '2026-09-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Harsh',
      emp_last_name = 'Madankar',
      emp_email = 'hmadankar@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'TRAINEE',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '2003-03-15',
      emp_joining_date = '2026-09-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 479
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-ERP') LIMIT 1;
  IF 'DEPT-SD-ERP' IS NOT NULL AND 'DEPT-SD-ERP' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-ERP';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('479') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '479', 'Harshavardhan', 'Chatte', 'hchatte@microproindia.com', NULL,
      'Senior Software Engineer', v_dept_id, 'permanent', 'M',
      '1996-04-05', '2026-08-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Harshavardhan',
      emp_last_name = 'Chatte',
      emp_email = 'hchatte@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Senior Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1996-04-05',
      emp_joining_date = '2026-08-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 425
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-NH') LIMIT 1;
  IF 'DEPT-SD-NH' IS NOT NULL AND 'DEPT-SD-NH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-NH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('425') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '425', 'Hussain', 'Darbar', 'hdarbar@microproindia.com', NULL,
      'Jr. Software Engineer', v_dept_id, 'permanent', 'M',
      '2003-03-22', '2024-09-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Hussain',
      emp_last_name = 'Darbar',
      emp_email = 'hdarbar@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '2003-03-22',
      emp_joining_date = '2024-09-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 374
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMO') LIMIT 1;
  IF 'DEPT-PRMO' IS NOT NULL AND 'DEPT-PRMO' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMO';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('374') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '374', 'Janvi', 'Ingole', 'jingole@microproindia.com', NULL,
      'Customer Support Executive', v_dept_id, 'permanent', 'F',
      '2001-10-02', '2023-12-23', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Janvi',
      emp_last_name = 'Ingole',
      emp_email = 'jingole@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Customer Support Executive',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '2001-10-02',
      emp_joining_date = '2023-12-23',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 476
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-DIN') LIMIT 1;
  IF 'DEPT-SD-DIN' IS NOT NULL AND 'DEPT-SD-DIN' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-DIN';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('476') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '476', 'Jugat', 'Bhatia', 'jbhatia@microproindia.com', NULL,
      'Jr. Software Engineer', v_dept_id, 'permanent', 'M',
      '2003-04-30', '2026-05-18', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Jugat',
      emp_last_name = 'Bhatia',
      emp_email = 'jbhatia@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '2003-04-30',
      emp_joining_date = '2026-05-18',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 2110
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-ACC') LIMIT 1;
  IF 'DEPT-ACC' IS NOT NULL AND 'DEPT-ACC' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-ACC';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('2110') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '2110', 'Kailash', 'Bhandakkar', 'kbhandakkar@microproindia.com', NULL,
      'Senior Manager (Account)', v_dept_id, 'permanent', 'M',
      '1973-07-01', '2013-01-10', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Kailash',
      emp_last_name = 'Bhandakkar',
      emp_email = 'kbhandakkar@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Senior Manager (Account)',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1973-07-01',
      emp_joining_date = '2013-01-10',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4222
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-HR') LIMIT 1;
  IF 'DEPT-HR' IS NOT NULL AND 'DEPT-HR' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-HR';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4222') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4222', 'Kajal', 'Sahu', 'ksahu@microproindia.com', NULL,
      'Assistant Manager (HR)', v_dept_id, 'permanent', 'F',
      '1998-06-13', '2023-04-29', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Kajal',
      emp_last_name = 'Sahu',
      emp_email = 'ksahu@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Assistant Manager (HR)',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '1998-06-13',
      emp_joining_date = '2023-04-29',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 470
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMO') LIMIT 1;
  IF 'DEPT-PRMO' IS NOT NULL AND 'DEPT-PRMO' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMO';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('470') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '470', 'Kalyani', 'Bangare', 'kbangare@microproindia.com', NULL,
      'Customer Support Executive Trainee', v_dept_id, 'permanent', 'F',
      '2004-07-17', '2026-01-06', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Kalyani',
      emp_last_name = 'Bangare',
      emp_email = 'kbangare@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Customer Support Executive Trainee',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '2004-07-17',
      emp_joining_date = '2026-01-06',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 469
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMO') LIMIT 1;
  IF 'DEPT-PRMO' IS NOT NULL AND 'DEPT-PRMO' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMO';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('469') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '469', 'Kalyani', 'Selokar', 'kselokar@microproindia.com', NULL,
      'Customer Support Executive Trainee', v_dept_id, 'permanent', 'F',
      '1998-06-24', '2026-01-05', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Kalyani',
      emp_last_name = 'Selokar',
      emp_email = 'kselokar@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Customer Support Executive Trainee',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '1998-06-24',
      emp_joining_date = '2026-01-05',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 475
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-DIN') LIMIT 1;
  IF 'DEPT-SD-DIN' IS NOT NULL AND 'DEPT-SD-DIN' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-DIN';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('475') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '475', 'Kanchan', 'Hatwar', 'khatwar@microproindia.com', NULL,
      'Jr. Software Engineer', v_dept_id, 'permanent', 'F',
      '2002-06-15', '2026-05-18', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Kanchan',
      emp_last_name = 'Hatwar',
      emp_email = 'khatwar@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '2002-06-15',
      emp_joining_date = '2026-05-18',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 311
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMO') LIMIT 1;
  IF 'DEPT-PRMO' IS NOT NULL AND 'DEPT-PRMO' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMO';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('311') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '311', 'Kapil', 'Dhiria', 'kdhiria@microproindia.com', NULL,
      'SR. BUSINESS DEVELOPMENT MANAGER', v_dept_id, 'permanent', 'M',
      '1979-05-29', '2013-11-06', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Kapil',
      emp_last_name = 'Dhiria',
      emp_email = 'kdhiria@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'SR. BUSINESS DEVELOPMENT MANAGER',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1979-05-29',
      emp_joining_date = '2013-11-06',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 480
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-DIN') LIMIT 1;
  IF 'DEPT-SD-DIN' IS NOT NULL AND 'DEPT-SD-DIN' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-DIN';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('480') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '480', 'Kunal', 'Devikar', 'kdevikar@microproindia.com', NULL,
      'Software Engineer', v_dept_id, 'permanent', 'M',
      '1997-09-02', '2026-08-03', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Kunal',
      emp_last_name = 'Devikar',
      emp_email = 'kdevikar@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1997-09-02',
      emp_joining_date = '2026-08-03',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4111
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('SD-PTAX') LIMIT 1;
  IF 'SD-PTAX' IS NOT NULL AND 'SD-PTAX' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'SD-PTAX';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4111') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4111', 'Kushal', 'Kadu', 'kkadu@microproindia.com', NULL,
      'Team Leader', v_dept_id, 'permanent', 'M',
      '1989-03-16', '2019-07-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Kushal',
      emp_last_name = 'Kadu',
      emp_email = 'kkadu@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Team Leader',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1989-03-16',
      emp_joining_date = '2019-07-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- E0038
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-OH') LIMIT 1;
  IF 'DEPT-SD-OH' IS NOT NULL AND 'DEPT-SD-OH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-OH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('E0038') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      'E0038', 'Mahesh', 'Tambhekar', 'mtambhekar@microproindia.com', NULL,
      'PROJECT LEADER', v_dept_id, 'permanent', 'M',
      '1982-05-15', '2004-10-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Mahesh',
      emp_last_name = 'Tambhekar',
      emp_email = 'mtambhekar@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'PROJECT LEADER',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1982-05-15',
      emp_joining_date = '2004-10-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- MR01
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMO') LIMIT 1;
  IF 'DEPT-PRMO' IS NOT NULL AND 'DEPT-PRMO' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMO';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('MR01') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      'MR01', 'Mahesh', 'Raut', 'mraut@microproindia.com', NULL,
      'Assistant Manager (Support)', v_dept_id, 'permanent', 'M',
      '1986-09-02', '2012-05-14', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Mahesh',
      emp_last_name = 'Raut',
      emp_email = 'mraut@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Assistant Manager (Support)',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1986-09-02',
      emp_joining_date = '2012-05-14',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 3002
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMO') LIMIT 1;
  IF 'DEPT-PRMO' IS NOT NULL AND 'DEPT-PRMO' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMO';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('3002') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '3002', 'Manish', 'Sharma', 'msharma@microproindia.com', NULL,
      'Chief of Pharma division', v_dept_id, 'permanent', 'M',
      '1975-04-02', '1996-12-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Manish',
      emp_last_name = 'Sharma',
      emp_email = 'msharma@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Chief of Pharma division',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1975-04-02',
      emp_joining_date = '1996-12-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 435
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMZ') LIMIT 1;
  IF 'DEPT-PRMZ' IS NOT NULL AND 'DEPT-PRMZ' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMZ';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('435') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '435', 'Mayur', 'Bagare', 'mbagare@microproindia.com', NULL,
      'JR. TECH SUPPORT ENGINEER', v_dept_id, 'permanent', 'M',
      '2001-03-20', '2024-11-04', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Mayur',
      emp_last_name = 'Bagare',
      emp_email = 'mbagare@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'JR. TECH SUPPORT ENGINEER',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '2001-03-20',
      emp_joining_date = '2024-11-04',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 461
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMZ') LIMIT 1;
  IF 'DEPT-PRMZ' IS NOT NULL AND 'DEPT-PRMZ' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMZ';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('461') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '461', 'Mayur', 'Kshirsagar', 'mkshirsagar@microproindia.com', NULL,
      'Jr. Software Engineer', v_dept_id, 'permanent', 'M',
      '2001-09-16', '2025-10-03', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Mayur',
      emp_last_name = 'Kshirsagar',
      emp_email = 'mkshirsagar@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '2001-09-16',
      emp_joining_date = '2025-10-03',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4164
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-OH') LIMIT 1;
  IF 'DEPT-SD-OH' IS NOT NULL AND 'DEPT-SD-OH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-OH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4164') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4164', 'Mayur', 'Akotkar', 'makotkar@microproindia.com', NULL,
      'Software Engineer', v_dept_id, 'permanent', 'M',
      '1997-09-10', '2021-11-29', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Mayur',
      emp_last_name = 'Akotkar',
      emp_email = 'makotkar@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1997-09-10',
      emp_joining_date = '2021-11-29',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4203
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-VNIT') LIMIT 1;
  IF 'DEPT-SD-VNIT' IS NOT NULL AND 'DEPT-SD-VNIT' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-VNIT';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4203') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4203', 'Mayuresh', 'Gajbhiye', 'mgajbhiye@microproindia.com', NULL,
      'Senior Software Engineer', v_dept_id, 'permanent', 'M',
      '2000-06-12', '2022-08-09', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Mayuresh',
      emp_last_name = 'Gajbhiye',
      emp_email = 'mgajbhiye@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Senior Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '2000-06-12',
      emp_joining_date = '2022-08-09',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 463
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMZ') LIMIT 1;
  IF 'DEPT-PRMZ' IS NOT NULL AND 'DEPT-PRMZ' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMZ';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('463') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '463', 'Md.', 'Akhter', 'eakhter@microproindia.com', NULL,
      'Jr. Software Engineer', v_dept_id, 'permanent', 'M',
      '2011-07-08', '2025-11-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Md.',
      emp_last_name = 'Akhter',
      emp_email = 'eakhter@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '2011-07-08',
      emp_joining_date = '2025-11-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4139
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('SD-PTAX') LIMIT 1;
  IF 'SD-PTAX' IS NOT NULL AND 'SD-PTAX' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'SD-PTAX';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4139') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4139', 'Mohammed', 'Rangoonwala', 'arangoonwala@microproindia.com', NULL,
      'Senior Software Engineer', v_dept_id, 'permanent', 'M',
      '1989-06-11', '2020-12-21', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Mohammed',
      emp_last_name = 'Rangoonwala',
      emp_email = 'arangoonwala@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Senior Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1989-06-11',
      emp_joining_date = '2020-12-21',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 414
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('SD-PTAX') LIMIT 1;
  IF 'SD-PTAX' IS NOT NULL AND 'SD-PTAX' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'SD-PTAX';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('414') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '414', 'Mohan', 'Bhambere', 'mbhambere@microproindia.com', NULL,
      'Jr. Software Engineer', v_dept_id, 'permanent', 'M',
      '2002-01-22', '2024-09-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Mohan',
      emp_last_name = 'Bhambere',
      emp_email = 'mbhambere@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '2002-01-22',
      emp_joining_date = '2024-09-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 363
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-IMPL') LIMIT 1;
  IF 'DEPT-IMPL' IS NOT NULL AND 'DEPT-IMPL' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-IMPL';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('363') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '363', 'Mohit', 'Padole', 'mpadole@microproindia.com', NULL,
      'SR. IMPLEMENTATION ENGINEER', v_dept_id, 'permanent', 'M',
      '1988-10-27', '2023-07-27', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Mohit',
      emp_last_name = 'Padole',
      emp_email = 'mpadole@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'SR. IMPLEMENTATION ENGINEER',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1988-10-27',
      emp_joining_date = '2023-07-27',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4193
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-OH') LIMIT 1;
  IF 'DEPT-SD-OH' IS NOT NULL AND 'DEPT-SD-OH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-OH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4193') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4193', 'Mrunali', 'Dahiwale', 'mdahiwale@microproindia.com', NULL,
      'Software Engineer', v_dept_id, 'permanent', 'F',
      '1997-12-20', '2022-04-04', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Mrunali',
      emp_last_name = 'Dahiwale',
      emp_email = 'mdahiwale@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '1997-12-20',
      emp_joining_date = '2022-04-04',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- E0046
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-NH') LIMIT 1;
  IF 'DEPT-SD-NH' IS NOT NULL AND 'DEPT-SD-NH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-NH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('E0046') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      'E0046', 'Natwarlal', 'Bareju', 'nbareju@microproindia.com', NULL,
      'Senior Software Engineer', v_dept_id, 'permanent', 'M',
      '1984-08-29', '2002-01-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Natwarlal',
      emp_last_name = 'Bareju',
      emp_email = 'nbareju@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Senior Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1984-08-29',
      emp_joining_date = '2002-01-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 366
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-IFM') LIMIT 1;
  IF 'DEPT-IFM' IS NOT NULL AND 'DEPT-IFM' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-IFM';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('366') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '366', 'Nikitesh', 'Parekar', 'nparekar@microproindia.com', NULL,
      'Infrastructure Engineer', v_dept_id, 'permanent', 'M',
      '2000-05-04', '2023-08-22', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Nikitesh',
      emp_last_name = 'Parekar',
      emp_email = 'nparekar@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Infrastructure Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '2000-05-04',
      emp_joining_date = '2023-08-22',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- N002
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMO') LIMIT 1;
  IF 'DEPT-PRMO' IS NOT NULL AND 'DEPT-PRMO' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMO';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('N002') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      'N002', 'Nilesh', 'Panpatte', 'npanpatte@microproindia.com', NULL,
      'Assistant Manager (Support)', v_dept_id, 'permanent', 'M',
      '1986-03-09', '2010-10-02', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Nilesh',
      emp_last_name = 'Panpatte',
      emp_email = 'npanpatte@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Assistant Manager (Support)',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1986-03-09',
      emp_joining_date = '2010-10-02',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 455
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-DIN') LIMIT 1;
  IF 'DEPT-SD-DIN' IS NOT NULL AND 'DEPT-SD-DIN' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-DIN';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('455') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '455', 'Nilesh', 'Thakre', 'nthakre@microproindia.com', NULL,
      'Jr. Software Engineer', v_dept_id, 'permanent', 'M',
      '1992-05-25', '2025-05-27', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Nilesh',
      emp_last_name = 'Thakre',
      emp_email = 'nthakre@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1992-05-25',
      emp_joining_date = '2025-05-27',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- E0048
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-ERP') LIMIT 1;
  IF 'DEPT-SD-ERP' IS NOT NULL AND 'DEPT-SD-ERP' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-ERP';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('E0048') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      'E0048', 'Niranjan', 'Batthe', 'nbatthe@microproindia.com', NULL,
      'PROJECT LEADER', v_dept_id, 'permanent', 'M',
      '1971-10-17', '2004-02-19', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Niranjan',
      emp_last_name = 'Batthe',
      emp_email = 'nbatthe@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'PROJECT LEADER',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1971-10-17',
      emp_joining_date = '2004-02-19',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 466
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-NH') LIMIT 1;
  IF 'DEPT-SD-NH' IS NOT NULL AND 'DEPT-SD-NH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-NH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('466') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '466', 'Nirmala', 'Kadam', 'nkadam@microproindia.com', NULL,
      'Software Engineer', v_dept_id, 'permanent', 'F',
      '2002-05-22', '2025-12-05', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Nirmala',
      emp_last_name = 'Kadam',
      emp_email = 'nkadam@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '2002-05-22',
      emp_joining_date = '2025-12-05',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 468
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-OH') LIMIT 1;
  IF 'DEPT-SD-OH' IS NOT NULL AND 'DEPT-SD-OH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-OH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('468') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '468', 'Nityanand', 'Gawande', 'ngawande@microproindia.com', NULL,
      'TRAINEE', v_dept_id, 'permanent', 'M',
      '1995-03-24', '2025-12-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Nityanand',
      emp_last_name = 'Gawande',
      emp_email = 'ngawande@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'TRAINEE',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1995-03-24',
      emp_joining_date = '2025-12-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4192
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-IFM-TRD') LIMIT 1;
  IF 'DEPT-IFM-TRD' IS NOT NULL AND 'DEPT-IFM-TRD' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-IFM-TRD';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4192') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4192', 'Parimal', 'Bawane', 'pbawane@microproindia.com', NULL,
      'Team Lead- Infrastructure Services', v_dept_id, 'permanent', 'M',
      '1994-08-16', '2022-03-15', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Parimal',
      emp_last_name = 'Bawane',
      emp_email = 'pbawane@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Team Lead- Infrastructure Services',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1994-08-16',
      emp_joining_date = '2022-03-15',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 417
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMZ') LIMIT 1;
  IF 'DEPT-PRMZ' IS NOT NULL AND 'DEPT-PRMZ' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMZ';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('417') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '417', 'Parshva', 'Choradia', 'pchoradia@microproindia.com', NULL,
      'Jr. Software Engineer', v_dept_id, 'permanent', 'M',
      '2002-09-09', '2024-09-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Parshva',
      emp_last_name = 'Choradia',
      emp_email = 'pchoradia@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '2002-09-09',
      emp_joining_date = '2024-09-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- E0054
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMZ') LIMIT 1;
  IF 'DEPT-PRMZ' IS NOT NULL AND 'DEPT-PRMZ' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMZ';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('E0054') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      'E0054', 'Prasanna', 'Saoji', 'psaoji@microproindia.com', NULL,
      'Project Coordinator- Implementation', v_dept_id, 'permanent', 'M',
      '1971-05-07', '2005-08-08', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Prasanna',
      emp_last_name = 'Saoji',
      emp_email = 'psaoji@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Project Coordinator- Implementation',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1971-05-07',
      emp_joining_date = '2005-08-08',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4199
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-VNIT') LIMIT 1;
  IF 'DEPT-SD-VNIT' IS NOT NULL AND 'DEPT-SD-VNIT' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-VNIT';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4199') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4199', 'Prashik', 'Tiple', 'ptiple@microproindia.com', NULL,
      'Software Engineer', v_dept_id, 'permanent', 'M',
      '1993-04-01', '2022-06-07', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Prashik',
      emp_last_name = 'Tiple',
      emp_email = 'ptiple@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1993-04-01',
      emp_joining_date = '2022-06-07',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 464
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMZ') LIMIT 1;
  IF 'DEPT-PRMZ' IS NOT NULL AND 'DEPT-PRMZ' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMZ';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('464') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '464', 'Pratik', 'Badguye', 'pbadguye@microproindia.com', NULL,
      'Jr. Software Engineer', v_dept_id, 'permanent', 'M',
      '2003-08-29', '2025-11-04', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Pratik',
      emp_last_name = 'Badguye',
      emp_email = 'pbadguye@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '2003-08-29',
      emp_joining_date = '2025-11-04',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 482
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('SD-TEST') LIMIT 1;
  IF 'SD-TEST' IS NOT NULL AND 'SD-TEST' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'SD-TEST';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('482') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '482', 'Pratiksha', 'Onkar', 'ponkar@microproindia.com', NULL,
      'QA Tester', v_dept_id, 'permanent', 'F',
      '1999-08-02', '2026-08-26', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Pratiksha',
      emp_last_name = 'Onkar',
      emp_email = 'ponkar@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'QA Tester',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '1999-08-02',
      emp_joining_date = '2026-08-26',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 391
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMO') LIMIT 1;
  IF 'DEPT-PRMO' IS NOT NULL AND 'DEPT-PRMO' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMO';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('391') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '391', 'Priti', 'Neware', 'pneware@microproindia.com', NULL,
      'Customer Support Executive', v_dept_id, 'permanent', 'F',
      '2000-11-06', '2024-04-09', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Priti',
      emp_last_name = 'Neware',
      emp_email = 'pneware@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Customer Support Executive',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '2000-11-06',
      emp_joining_date = '2024-04-09',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4099
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-DIN') LIMIT 1;
  IF 'DEPT-SD-DIN' IS NOT NULL AND 'DEPT-SD-DIN' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-DIN';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4099') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4099', 'Priya', 'Wadighare', 'pwadighare@microproindia.com', NULL,
      'Team Leader', v_dept_id, 'permanent', 'F',
      '1995-10-05', '2019-05-20', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Priya',
      emp_last_name = 'Wadighare',
      emp_email = 'pwadighare@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Team Leader',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '1995-10-05',
      emp_joining_date = '2019-05-20',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4171
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-IFM-TRD') LIMIT 1;
  IF 'DEPT-IFM-TRD' IS NOT NULL AND 'DEPT-IFM-TRD' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-IFM-TRD';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4171') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4171', 'Radheshyam', 'Dahare', 'rdahare@microproindia.com', NULL,
      'ELECTRICIAN', v_dept_id, 'permanent', 'M',
      '1987-11-10', '2022-01-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Radheshyam',
      emp_last_name = 'Dahare',
      emp_email = 'rdahare@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'ELECTRICIAN',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1987-11-10',
      emp_joining_date = '2022-01-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- E0058
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-NH') LIMIT 1;
  IF 'DEPT-SD-NH' IS NOT NULL AND 'DEPT-SD-NH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-NH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('E0058') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      'E0058', 'Rahul', 'Meshram', 'rmeshram@microproindia.com', NULL,
      'Chief of HIMS & Pharma ZIP', v_dept_id, 'permanent', 'M',
      '1977-03-28', '2002-10-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Rahul',
      emp_last_name = 'Meshram',
      emp_email = 'rmeshram@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Chief of HIMS & Pharma ZIP',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1977-03-28',
      emp_joining_date = '2002-10-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4175
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMZ') LIMIT 1;
  IF 'DEPT-PRMZ' IS NOT NULL AND 'DEPT-PRMZ' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMZ';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4175') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4175', 'Rajendra', 'Diwate', 'rdiwate@microproindia.com', NULL,
      'PROJECT LEADER', v_dept_id, 'permanent', 'M',
      '1970-10-10', '2022-01-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Rajendra',
      emp_last_name = 'Diwate',
      emp_email = 'rdiwate@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'PROJECT LEADER',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1970-10-10',
      emp_joining_date = '2022-01-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- E0062
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-VNIT') LIMIT 1;
  IF 'DEPT-SD-VNIT' IS NOT NULL AND 'DEPT-SD-VNIT' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-VNIT';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('E0062') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      'E0062', 'Ramesh', 'Panicker', 'rpanicker@microproindia.com', NULL,
      'Senior Software Engineer', v_dept_id, 'permanent', 'M',
      '1971-07-08', '2000-10-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Ramesh',
      emp_last_name = 'Panicker',
      emp_email = 'rpanicker@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Senior Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1971-07-08',
      emp_joining_date = '2000-10-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 406
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('SD-PTAX') LIMIT 1;
  IF 'SD-PTAX' IS NOT NULL AND 'SD-PTAX' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'SD-PTAX';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('406') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '406', 'Revati', 'Khandare', 'rkhandare@microproindia.com', NULL,
      'Jr. Software Engineer', v_dept_id, 'permanent', 'F',
      '2002-12-08', '2024-09-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Revati',
      emp_last_name = 'Khandare',
      emp_email = 'rkhandare@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '2002-12-08',
      emp_joining_date = '2024-09-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 422
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-NH') LIMIT 1;
  IF 'DEPT-SD-NH' IS NOT NULL AND 'DEPT-SD-NH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-NH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('422') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '422', 'Riddhi', 'Gadewar', 'rgadewar@microproindia.com', NULL,
      'Jr. Software Engineer', v_dept_id, 'permanent', 'F',
      '2002-09-10', '2024-09-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Riddhi',
      emp_last_name = 'Gadewar',
      emp_email = 'rgadewar@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '2002-09-10',
      emp_joining_date = '2024-09-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4066
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMZ') LIMIT 1;
  IF 'DEPT-PRMZ' IS NOT NULL AND 'DEPT-PRMZ' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMZ';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4066') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4066', 'Rizwan', 'Qureshi', 'rqureshi@microproindia.com', NULL,
      'Senior Software Engineer', v_dept_id, 'permanent', 'M',
      '1988-01-25', '2018-08-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Rizwan',
      emp_last_name = 'Qureshi',
      emp_email = 'rqureshi@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Senior Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1988-01-25',
      emp_joining_date = '2018-08-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 441
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-IMPL') LIMIT 1;
  IF 'DEPT-IMPL' IS NOT NULL AND 'DEPT-IMPL' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-IMPL';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('441') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '441', 'Robin', 'Bastian', 'rbastian@microproindia.com', NULL,
      'Junior Implementation Engineer', v_dept_id, 'permanent', 'M',
      '1995-08-09', '2024-12-23', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Robin',
      emp_last_name = 'Bastian',
      emp_email = 'rbastian@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Junior Implementation Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1995-08-09',
      emp_joining_date = '2024-12-23',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 437
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMZ') LIMIT 1;
  IF 'DEPT-PRMZ' IS NOT NULL AND 'DEPT-PRMZ' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMZ';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('437') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '437', 'Rohan', 'Joshi', 'rjoshi@microproindia.com', NULL,
      'JR. TECH SUPPORT ENGINEER', v_dept_id, 'permanent', 'M',
      '1998-04-16', '2024-11-04', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Rohan',
      emp_last_name = 'Joshi',
      emp_email = 'rjoshi@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'JR. TECH SUPPORT ENGINEER',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1998-04-16',
      emp_joining_date = '2024-11-04',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4197
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('SD-TEST') LIMIT 1;
  IF 'SD-TEST' IS NOT NULL AND 'SD-TEST' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'SD-TEST';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4197') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4197', 'Roshani', 'Mulunde', 'rmulunde@microproindia.com', NULL,
      'QA Engineer', v_dept_id, 'permanent', 'F',
      '1996-04-05', '2022-05-09', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Roshani',
      emp_last_name = 'Mulunde',
      emp_email = 'rmulunde@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'QA Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '1996-04-05',
      emp_joining_date = '2022-05-09',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 344
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-NH') LIMIT 1;
  IF 'DEPT-SD-NH' IS NOT NULL AND 'DEPT-SD-NH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-NH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('344') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '344', 'Rutuja', 'Modak', 'rmodak@microproindia.com', NULL,
      'Jr. Software Engineer', v_dept_id, 'permanent', 'F',
      '2002-02-21', '2023-07-15', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Rutuja',
      emp_last_name = 'Modak',
      emp_email = 'rmodak@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '2002-02-21',
      emp_joining_date = '2023-07-15',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 389
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMO') LIMIT 1;
  IF 'DEPT-PRMO' IS NOT NULL AND 'DEPT-PRMO' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMO';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('389') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '389', 'Sagar', 'Bhise', 'sbhise@microproindia.com', NULL,
      'Customer Support Executive', v_dept_id, 'permanent', 'M',
      '1994-09-11', '2024-03-18', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Sagar',
      emp_last_name = 'Bhise',
      emp_email = 'sbhise@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Customer Support Executive',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1994-09-11',
      emp_joining_date = '2024-03-18',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 408
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-NH') LIMIT 1;
  IF 'DEPT-SD-NH' IS NOT NULL AND 'DEPT-SD-NH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-NH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('408') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '408', 'Sakshi', 'Koche', 'skoche@microproindia.com', NULL,
      'Junior Software Engineer', v_dept_id, 'permanent', 'F',
      '2000-06-24', '2024-09-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Sakshi',
      emp_last_name = 'Koche',
      emp_email = 'skoche@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Junior Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '2000-06-24',
      emp_joining_date = '2024-09-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4176
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-ACC') LIMIT 1;
  IF 'DEPT-ACC' IS NOT NULL AND 'DEPT-ACC' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-ACC';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4176') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4176', 'Samvedna', 'Kukwase', 'skukwase@microproindia.com', NULL,
      'ACCOUNT ASSISTANT', v_dept_id, 'permanent', 'F',
      '1986-07-21', '2022-02-15', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Samvedna',
      emp_last_name = 'Kukwase',
      emp_email = 'skukwase@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'ACCOUNT ASSISTANT',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '1986-07-21',
      emp_joining_date = '2022-02-15',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 404
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-NH') LIMIT 1;
  IF 'DEPT-SD-NH' IS NOT NULL AND 'DEPT-SD-NH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-NH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('404') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '404', 'Sanika', 'Sapkale', 'ssapkale@microproindia.com', NULL,
      'Junior Software Engineer', v_dept_id, 'permanent', 'F',
      '2002-08-20', '2024-09-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Sanika',
      emp_last_name = 'Sapkale',
      emp_email = 'ssapkale@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Junior Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '2002-08-20',
      emp_joining_date = '2024-09-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 3003
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMO') LIMIT 1;
  IF 'DEPT-PRMO' IS NOT NULL AND 'DEPT-PRMO' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMO';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('3003') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '3003', 'Sanjay', 'Badguye', 'sbadguye@microproindia.com', NULL,
      'SR MANAGER', v_dept_id, 'permanent', 'M',
      '1971-04-03', '1995-05-13', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Sanjay',
      emp_last_name = 'Badguye',
      emp_email = 'sbadguye@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'SR MANAGER',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1971-04-03',
      emp_joining_date = '1995-05-13',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- E0066
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMO') LIMIT 1;
  IF 'DEPT-PRMO' IS NOT NULL AND 'DEPT-PRMO' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMO';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('E0066') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      'E0066', 'Sanjay', 'Gonnade', 'sgonnade@microproindia.com', NULL,
      'Senior Area Manager', v_dept_id, 'permanent', 'M',
      '1976-09-17', '1999-01-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Sanjay',
      emp_last_name = 'Gonnade',
      emp_email = 'sgonnade@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Senior Area Manager',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1976-09-17',
      emp_joining_date = '1999-01-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4085
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-DIN') LIMIT 1;
  IF 'DEPT-SD-DIN' IS NOT NULL AND 'DEPT-SD-DIN' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-DIN';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4085') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4085', 'Sanket', 'Dambhe', 'sdambhe@microproindia.com', NULL,
      'Senior Software Engineer', v_dept_id, 'permanent', 'M',
      '1991-09-20', '2019-01-23', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Sanket',
      emp_last_name = 'Dambhe',
      emp_email = 'sdambhe@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Senior Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1991-09-20',
      emp_joining_date = '2019-01-23',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 465
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-OH') LIMIT 1;
  IF 'DEPT-SD-OH' IS NOT NULL AND 'DEPT-SD-OH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-OH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('465') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '465', 'Sarang', 'Hedaoo', 'shedaoo@microproindia.com', NULL,
      'Jr. Software Engineer', v_dept_id, 'permanent', 'M',
      '2000-01-22', '2025-11-03', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Sarang',
      emp_last_name = 'Hedaoo',
      emp_email = 'shedaoo@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '2000-01-22',
      emp_joining_date = '2025-11-03',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4067
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-MKT') LIMIT 1;
  IF 'DEPT-MKT' IS NOT NULL AND 'DEPT-MKT' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-MKT';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4067') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4067', 'Sarang', 'Chauhan', 'schauhan@microproindia.com', NULL,
      'Assistant General Manager ( Domestic Marketing)', v_dept_id, 'permanent', 'M',
      '1983-11-04', '2018-09-18', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Sarang',
      emp_last_name = 'Chauhan',
      emp_email = 'schauhan@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Assistant General Manager ( Domestic Marketing)',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1983-11-04',
      emp_joining_date = '2018-09-18',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 453
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-NH') LIMIT 1;
  IF 'DEPT-SD-NH' IS NOT NULL AND 'DEPT-SD-NH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-NH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('453') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '453', 'Saurabh', 'Nagrale', 'snagrale@microproindia.com', NULL,
      'Junior Software Executive', v_dept_id, 'permanent', 'M',
      '1997-03-26', '2025-05-15', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Saurabh',
      emp_last_name = 'Nagrale',
      emp_email = 'snagrale@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Junior Software Executive',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1997-03-26',
      emp_joining_date = '2025-05-15',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 472
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-HR') LIMIT 1;
  IF 'DEPT-HR' IS NOT NULL AND 'DEPT-HR' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-HR';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('472') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '472', 'Saurabh', 'Thakare', 'sthakare@microproindia.com', NULL,
      'Assitant Manager (HR) cum Admin', v_dept_id, 'permanent', 'M',
      '1999-03-13', '2026-01-23', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Saurabh',
      emp_last_name = 'Thakare',
      emp_email = 'sthakare@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Assitant Manager (HR) cum Admin',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1999-03-13',
      emp_joining_date = '2026-01-23',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 410
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-NH') LIMIT 1;
  IF 'DEPT-SD-NH' IS NOT NULL AND 'DEPT-SD-NH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-NH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('410') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '410', 'Sayali', 'Katole', 'skatole@microproindia.com', NULL,
      'Junior Software Engineer', v_dept_id, 'permanent', 'F',
      '2002-07-02', '2024-09-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Sayali',
      emp_last_name = 'Katole',
      emp_email = 'skatole@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Junior Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '2002-07-02',
      emp_joining_date = '2024-09-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 322
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-NH') LIMIT 1;
  IF 'DEPT-SD-NH' IS NOT NULL AND 'DEPT-SD-NH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-NH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('322') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '322', 'Sham', 'Awachat', 'sawachat@microproindia.com', NULL,
      'Senior Software Engineer', v_dept_id, 'permanent', 'M',
      '1995-04-27', '2023-04-10', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Sham',
      emp_last_name = 'Awachat',
      emp_email = 'sawachat@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Senior Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1995-04-27',
      emp_joining_date = '2023-04-10',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4053
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-ADMIN') LIMIT 1;
  IF 'DEPT-ADMIN' IS NOT NULL AND 'DEPT-ADMIN' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-ADMIN';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4053') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4053', 'Shantaram', 'Kamdi', 'skamdi@microproindia.com', NULL,
      'Peon/Office Boy/Office Assistant', v_dept_id, 'permanent', 'M',
      '1983-04-11', '2017-12-25', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Shantaram',
      emp_last_name = 'Kamdi',
      emp_email = 'skamdi@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Peon/Office Boy/Office Assistant',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1983-04-11',
      emp_joining_date = '2017-12-25',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- E0073
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMO') LIMIT 1;
  IF 'DEPT-PRMO' IS NOT NULL AND 'DEPT-PRMO' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMO';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('E0073') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      'E0073', 'Shrikant', 'Gawande', 'sgawande@microproindia.com', NULL,
      'Senior Developer', v_dept_id, 'permanent', 'M',
      '1976-09-21', '2008-05-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Shrikant',
      emp_last_name = 'Gawande',
      emp_email = 'sgawande@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Senior Developer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1976-09-21',
      emp_joining_date = '2008-05-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 337
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-VNIT') LIMIT 1;
  IF 'DEPT-SD-VNIT' IS NOT NULL AND 'DEPT-SD-VNIT' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-VNIT';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('337') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '337', 'Shruti', 'Jumale', 'sjumale@microproindia.com', NULL,
      'Software Engineer', v_dept_id, 'permanent', 'F',
      '2001-03-09', '2023-09-21', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Shruti',
      emp_last_name = 'Jumale',
      emp_email = 'sjumale@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '2001-03-09',
      emp_joining_date = '2023-09-21',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 459
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-OH') LIMIT 1;
  IF 'DEPT-SD-OH' IS NOT NULL AND 'DEPT-SD-OH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-OH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('459') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '459', 'Shweta', 'Bhaje', 'sbhaje@microproindia.com', NULL,
      'Jr. Software Engineer', v_dept_id, 'permanent', 'F',
      '2003-05-07', '2025-09-02', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Shweta',
      emp_last_name = 'Bhaje',
      emp_email = 'sbhaje@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '2003-05-07',
      emp_joining_date = '2025-09-02',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 436
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMZ') LIMIT 1;
  IF 'DEPT-PRMZ' IS NOT NULL AND 'DEPT-PRMZ' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMZ';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('436') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '436', 'Siddhant', 'Alone', 'salone@microproindia.com', NULL,
      'JR. TECH SUPPORT ENGINEER', v_dept_id, 'permanent', 'M',
      '2000-09-03', '2024-11-04', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Siddhant',
      emp_last_name = 'Alone',
      emp_email = 'salone@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'JR. TECH SUPPORT ENGINEER',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '2000-09-03',
      emp_joining_date = '2024-11-04',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 477
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-IFM-TRD') LIMIT 1;
  IF 'DEPT-IFM-TRD' IS NOT NULL AND 'DEPT-IFM-TRD' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-IFM-TRD';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('477') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '477', 'Siddhesh', 'Chute', 'schute@microproindia.com', NULL,
      'TRAINEE', v_dept_id, 'permanent', 'M',
      '1998-07-17', '2026-07-13', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Siddhesh',
      emp_last_name = 'Chute',
      emp_email = 'schute@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'TRAINEE',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1998-07-17',
      emp_joining_date = '2026-07-13',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 427
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-NH') LIMIT 1;
  IF 'DEPT-SD-NH' IS NOT NULL AND 'DEPT-SD-NH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-NH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('427') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '427', 'Sohail', 'Khan', 'skhan@microproindia.com', NULL,
      'Software Engineer', v_dept_id, 'permanent', 'M',
      '1994-02-14', '2024-06-06', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Sohail',
      emp_last_name = 'Khan',
      emp_email = 'skhan@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1994-02-14',
      emp_joining_date = '2024-06-06',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 471
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-NH') LIMIT 1;
  IF 'DEPT-SD-NH' IS NOT NULL AND 'DEPT-SD-NH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-NH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('471') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '471', 'Sonali', 'Pawar', 'spawar@microproindia.com', NULL,
      'Software Engineer', v_dept_id, 'permanent', 'F',
      '2003-01-02', '2026-01-19', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Sonali',
      emp_last_name = 'Pawar',
      emp_email = 'spawar@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '2003-01-02',
      emp_joining_date = '2026-01-19',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- E0104
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMO') LIMIT 1;
  IF 'DEPT-PRMO' IS NOT NULL AND 'DEPT-PRMO' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMO';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('E0104') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      'E0104', 'Subhash', 'Ratnaparkhi', 'sratnaparkhi@microproindia.com', NULL,
      'Assistant Manager (Support)', v_dept_id, 'permanent', 'M',
      '1987-05-28', '2012-01-02', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Subhash',
      emp_last_name = 'Ratnaparkhi',
      emp_email = 'sratnaparkhi@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Assistant Manager (Support)',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1987-05-28',
      emp_joining_date = '2012-01-02',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 460
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-NH') LIMIT 1;
  IF 'DEPT-SD-NH' IS NOT NULL AND 'DEPT-SD-NH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-NH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('460') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '460', 'Sudhanshu', 'Nakhate', 'snakhate@microproindia.com', NULL,
      'Jr. Software Engineer', v_dept_id, 'permanent', 'M',
      '2000-05-12', '2025-09-17', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Sudhanshu',
      emp_last_name = 'Nakhate',
      emp_email = 'snakhate@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '2000-05-12',
      emp_joining_date = '2025-09-17',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 384
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SEC') LIMIT 1;
  IF 'DEPT-SEC' IS NOT NULL AND 'DEPT-SEC' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SEC';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('384') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '384', 'SULABH', 'PARIHAR', 'sparihar@microproindia.com', NULL,
      'Company Secretary & Compliance Officer', v_dept_id, 'permanent', 'M',
      '1991-03-02', '2024-02-08', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'SULABH',
      emp_last_name = 'PARIHAR',
      emp_email = 'sparihar@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Company Secretary & Compliance Officer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1991-03-02',
      emp_joining_date = '2024-02-08',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4200
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-IFM-TRD') LIMIT 1;
  IF 'DEPT-IFM-TRD' IS NOT NULL AND 'DEPT-IFM-TRD' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-IFM-TRD';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4200') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4200', 'Sumaiya', 'Kausar', 'skausar@microproindia.com', NULL,
      'Team Lead- Infrastructure Services', v_dept_id, 'permanent', 'F',
      '1983-11-11', '2022-07-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Sumaiya',
      emp_last_name = 'Kausar',
      emp_email = 'skausar@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Team Lead- Infrastructure Services',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '1983-11-11',
      emp_joining_date = '2022-07-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 381
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-NH') LIMIT 1;
  IF 'DEPT-SD-NH' IS NOT NULL AND 'DEPT-SD-NH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-NH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('381') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '381', 'Sumant', 'Joshi', 'sjoshi@microproindia.com', NULL,
      'Jr. Software Engineer', v_dept_id, 'permanent', 'M',
      '1999-09-24', '2024-01-23', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Sumant',
      emp_last_name = 'Joshi',
      emp_email = 'sjoshi@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1999-09-24',
      emp_joining_date = '2024-01-23',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4098
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-ERP') LIMIT 1;
  IF 'DEPT-SD-ERP' IS NOT NULL AND 'DEPT-SD-ERP' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-ERP';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4098') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4098', 'Suraj', 'Kapate', 'skapate@microproindia.com', NULL,
      'Senior Software Engineer', v_dept_id, 'permanent', 'M',
      '1992-05-25', '2019-05-02', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Suraj',
      emp_last_name = 'Kapate',
      emp_email = 'skapate@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Senior Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1992-05-25',
      emp_joining_date = '2019-05-02',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4035
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMO') LIMIT 1;
  IF 'DEPT-PRMO' IS NOT NULL AND 'DEPT-PRMO' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMO';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4035') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4035', 'Surbhi', 'Dubey', 'sdubey@microproindia.com', NULL,
      'Senior Support Engineer', v_dept_id, 'permanent', 'F',
      '1995-11-12', '2017-08-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Surbhi',
      emp_last_name = 'Dubey',
      emp_email = 'sdubey@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Senior Support Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '1995-11-12',
      emp_joining_date = '2017-08-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- ES003
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMZ') LIMIT 1;
  IF 'DEPT-PRMZ' IS NOT NULL AND 'DEPT-PRMZ' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMZ';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('ES003') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      'ES003', 'Swapnil', 'Dhore', 'sdhore@microproindia.com', NULL,
      'Senior Support Manager', v_dept_id, 'permanent', 'M',
      '1987-10-08', '2008-01-08', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Swapnil',
      emp_last_name = 'Dhore',
      emp_email = 'sdhore@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Senior Support Manager',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1987-10-08',
      emp_joining_date = '2008-01-08',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4178
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-OH') LIMIT 1;
  IF 'DEPT-SD-OH' IS NOT NULL AND 'DEPT-SD-OH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-OH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4178') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4178', 'Swapnil', 'Bante', 'sbante@microproindia.com', NULL,
      'Software Engineer', v_dept_id, 'permanent', 'M',
      '1997-06-14', '2022-02-21', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Swapnil',
      emp_last_name = 'Bante',
      emp_email = 'sbante@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1997-06-14',
      emp_joining_date = '2022-02-21',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 352
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-VNIT') LIMIT 1;
  IF 'DEPT-SD-VNIT' IS NOT NULL AND 'DEPT-SD-VNIT' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-VNIT';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('352') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '352', 'Swati', 'Khatri', 'skhatri@microproindia.com', NULL,
      'Junior Software Engineer', v_dept_id, 'permanent', 'F',
      '2001-05-29', '2023-08-19', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Swati',
      emp_last_name = 'Khatri',
      emp_email = 'skhatri@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Junior Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '2001-05-29',
      emp_joining_date = '2023-08-19',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4095
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('SD-PTAX') LIMIT 1;
  IF 'SD-PTAX' IS NOT NULL AND 'SD-PTAX' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'SD-PTAX';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4095') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4095', 'Tanmay', 'Dorle', 'tdorle@microproindia.com', NULL,
      'Business Analyst', v_dept_id, 'permanent', 'M',
      '1990-12-04', '2019-03-16', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Tanmay',
      emp_last_name = 'Dorle',
      emp_email = 'tdorle@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Business Analyst',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1990-12-04',
      emp_joining_date = '2019-03-16',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 335
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('SD-TEST') LIMIT 1;
  IF 'SD-TEST' IS NOT NULL AND 'SD-TEST' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'SD-TEST';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('335') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '335', 'Tejal', 'Chandure', 'tchandure@microproindia.com', NULL,
      'QA Engineer', v_dept_id, 'permanent', 'F',
      '2001-10-26', '2023-09-21', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Tejal',
      emp_last_name = 'Chandure',
      emp_email = 'tchandure@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'QA Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '2001-10-26',
      emp_joining_date = '2023-09-21',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 367
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-DIN') LIMIT 1;
  IF 'DEPT-SD-DIN' IS NOT NULL AND 'DEPT-SD-DIN' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-DIN';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('367') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '367', 'Tejal', 'Zade', 'tzade@microproindia.com', NULL,
      'Software Engineer', v_dept_id, 'permanent', 'F',
      '1991-02-15', '2023-08-24', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Tejal',
      emp_last_name = 'Zade',
      emp_email = 'tzade@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '1991-02-15',
      emp_joining_date = '2023-08-24',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 407
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-IFM') LIMIT 1;
  IF 'DEPT-IFM' IS NOT NULL AND 'DEPT-IFM' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-IFM';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('407') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '407', 'Tejas', 'Harshe', 'tharshe@microproindia.com', NULL,
      'Jr. Infrastructure Engineer', v_dept_id, 'permanent', 'M',
      '2002-09-05', '2024-09-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Tejas',
      emp_last_name = 'Harshe',
      emp_email = 'tharshe@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. Infrastructure Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '2002-09-05',
      emp_joining_date = '2024-09-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4026
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMZ') LIMIT 1;
  IF 'DEPT-PRMZ' IS NOT NULL AND 'DEPT-PRMZ' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMZ';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4026') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4026', 'Vijay', 'Gopnarayan', 'vgopnarayan@microproindia.com', NULL,
      'Senior Manager (Support)', v_dept_id, 'permanent', 'M',
      '1989-03-27', '2017-06-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Vijay',
      emp_last_name = 'Gopnarayan',
      emp_email = 'vgopnarayan@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Senior Manager (Support)',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1989-03-27',
      emp_joining_date = '2017-06-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4058
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMO') LIMIT 1;
  IF 'DEPT-PRMO' IS NOT NULL AND 'DEPT-PRMO' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMO';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4058') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4058', 'Vijay', 'Bhoi', 'vbhoi@microproindia.com', NULL,
      'Senior Support Engineer', v_dept_id, 'permanent', 'M',
      '1986-10-22', '2018-04-02', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Vijay',
      emp_last_name = 'Bhoi',
      emp_email = 'vbhoi@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Senior Support Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1986-10-22',
      emp_joining_date = '2018-04-02',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 330
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-IFM') LIMIT 1;
  IF 'DEPT-IFM' IS NOT NULL AND 'DEPT-IFM' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-IFM';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('330') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '330', 'Vikram', 'Sarve', 'vsarve@microproindia.com', NULL,
      'Head Of Infrastructure Services', v_dept_id, 'permanent', 'M',
      '1989-09-07', '2023-06-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Vikram',
      emp_last_name = 'Sarve',
      emp_email = 'vsarve@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Head Of Infrastructure Services',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1989-09-07',
      emp_joining_date = '2023-06-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 316
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('SD-TEST') LIMIT 1;
  IF 'SD-TEST' IS NOT NULL AND 'SD-TEST' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'SD-TEST';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('316') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '316', 'Vinay', 'Dekate', 'vdekate@microproindia.com', NULL,
      'QA Engineer', v_dept_id, 'permanent', 'M',
      '1994-02-19', '2023-01-09', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Vinay',
      emp_last_name = 'Dekate',
      emp_email = 'vdekate@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'QA Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1994-02-19',
      emp_joining_date = '2023-01-09',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 419
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMZ') LIMIT 1;
  IF 'DEPT-PRMZ' IS NOT NULL AND 'DEPT-PRMZ' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMZ';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('419') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '419', 'Vinit', 'Pande', 'vpande@microproindia.com', NULL,
      'Jr. Software Engineer', v_dept_id, 'permanent', 'M',
      '1997-06-23', '2024-09-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Vinit',
      emp_last_name = 'Pande',
      emp_email = 'vpande@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1997-06-23',
      emp_joining_date = '2024-09-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 462
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-PRMZ') LIMIT 1;
  IF 'DEPT-PRMZ' IS NOT NULL AND 'DEPT-PRMZ' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-PRMZ';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('462') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '462', 'Vishal', 'Drugwar', 'vdrugwar@microproindia.com', NULL,
      'Software Engineer', v_dept_id, 'permanent', 'M',
      '1996-05-29', '2025-10-16', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Vishal',
      emp_last_name = 'Drugwar',
      emp_email = 'vdrugwar@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1996-05-29',
      emp_joining_date = '2025-10-16',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 458
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('SD-PTAX') LIMIT 1;
  IF 'SD-PTAX' IS NOT NULL AND 'SD-PTAX' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'SD-PTAX';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('458') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '458', 'Vishal', 'Gabel', 'vgabel@microproindia.com', NULL,
      'Software Engineer', v_dept_id, 'permanent', 'M',
      '1995-08-18', '2025-08-11', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Vishal',
      emp_last_name = 'Gabel',
      emp_email = 'vgabel@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1995-08-18',
      emp_joining_date = '2025-08-11',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 450
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-IFM') LIMIT 1;
  IF 'DEPT-IFM' IS NOT NULL AND 'DEPT-IFM' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-IFM';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('450') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '450', 'Vishal', 'Nagose', 'vnagose@microproindia.com', NULL,
      'Jr. Infrastructure Engineer', v_dept_id, 'permanent', 'M',
      '2011-01-13', '2025-03-17', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Vishal',
      emp_last_name = 'Nagose',
      emp_email = 'vnagose@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. Infrastructure Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '2011-01-13',
      emp_joining_date = '2025-03-17',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 4170
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-ADMIN') LIMIT 1;
  IF 'DEPT-ADMIN' IS NOT NULL AND 'DEPT-ADMIN' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-ADMIN';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('4170') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '4170', 'Vivek', 'Tirale', 'vtirale@microproindia.com', NULL,
      'Peon/Office Boy/Office Assistant', v_dept_id, 'permanent', 'M',
      '1992-08-23', '2022-01-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Vivek',
      emp_last_name = 'Tirale',
      emp_email = 'vtirale@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Peon/Office Boy/Office Assistant',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '1992-08-23',
      emp_joining_date = '2022-01-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 418
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-NH') LIMIT 1;
  IF 'DEPT-SD-NH' IS NOT NULL AND 'DEPT-SD-NH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-NH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('418') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '418', 'Yash', 'Dhoot', 'ydhoot@microproindia.com', NULL,
      'Jr. Software Engineer', v_dept_id, 'permanent', 'M',
      '2002-05-01', '2024-09-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Yash',
      emp_last_name = 'Dhoot',
      emp_email = 'ydhoot@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'M',
      emp_dob = '2002-05-01',
      emp_joining_date = '2024-09-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 439
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-OH') LIMIT 1;
  IF 'DEPT-SD-OH' IS NOT NULL AND 'DEPT-SD-OH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-OH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('439') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '439', 'Yogita', 'Dhumale', 'ydhumale@microproindia.com', NULL,
      'Jr. Software Engineer', v_dept_id, 'permanent', 'F',
      '2002-11-07', '2024-11-21', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Yogita',
      emp_last_name = 'Dhumale',
      emp_email = 'ydhumale@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Jr. Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '2002-11-07',
      emp_joining_date = '2024-11-21',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;
  -- 405
  SELECT dept_department_id INTO v_dept_id FROM hrc_department_mst WHERE UPPER(dept_department_code) = UPPER('DEPT-SD-NH') LIMIT 1;
  IF 'DEPT-SD-NH' IS NOT NULL AND 'DEPT-SD-NH' <> '' AND v_dept_id IS NULL THEN
    RAISE EXCEPTION 'departmentCode not found: %', 'DEPT-SD-NH';
  END IF;
  SELECT emp_employee_id INTO v_emp_id FROM hrc_employee_mst WHERE UPPER(emp_employee_code) = UPPER('405') LIMIT 1;
  IF v_emp_id IS NULL THEN
    INSERT INTO hrc_employee_mst (
      emp_employee_code, emp_first_name, emp_last_name, emp_email, emp_phone,
      emp_designation, emp_department_id_dept, emp_employment_type, emp_gender,
      emp_dob, emp_joining_date, emp_isactive, emp_is_system_employee,
      emp_created_by, emp_created_on
    ) VALUES (
      '405', 'Yukta', 'Morey', 'ymorey@microproindia.com', NULL,
      'Junior Software Engineer', v_dept_id, 'permanent', 'F',
      '2003-05-18', '2024-09-01', true, false,
      'seed-054', NOW()
    );
    v_inserted := v_inserted + 1;
  ELSE
    UPDATE hrc_employee_mst SET
      emp_first_name = 'Yukta',
      emp_last_name = 'Morey',
      emp_email = 'ymorey@microproindia.com',
      emp_phone = NULL,
      emp_designation = 'Junior Software Engineer',
      emp_department_id_dept = v_dept_id,
      emp_employment_type = 'permanent',
      emp_gender = 'F',
      emp_dob = '2003-05-18',
      emp_joining_date = '2024-09-01',
      emp_isactive = true,
      emp_is_system_employee = false,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
    WHERE emp_employee_id = v_emp_id;
    v_updated := v_updated + 1;
  END IF;

  -- Wire reporting managers by employee code
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('445')
    AND UPPER(m.emp_employee_code) = UPPER('4067');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('413')
    AND UPPER(m.emp_employee_code) = UPPER('327');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4172')
    AND UPPER(m.emp_employee_code) = UPPER('472');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('388')
    AND UPPER(m.emp_employee_code) = UPPER('E0018');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('317')
    AND UPPER(m.emp_employee_code) = UPPER('4111');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('320')
    AND UPPER(m.emp_employee_code) = UPPER('E0018');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4169')
    AND UPPER(m.emp_employee_code) = UPPER('330');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('E0020')
    AND UPPER(m.emp_employee_code) = UPPER('330');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('452')
    AND UPPER(m.emp_employee_code) = UPPER('4022');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('3008')
    AND UPPER(m.emp_employee_code) = UPPER('3002');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('351')
    AND UPPER(m.emp_employee_code) = UPPER('E0025');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4207')
    AND UPPER(m.emp_employee_code) = UPPER('388');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('370')
    AND UPPER(m.emp_employee_code) = UPPER('E0025');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('327')
    AND UPPER(m.emp_employee_code) = UPPER('E0058');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('348')
    AND UPPER(m.emp_employee_code) = UPPER('4178');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('E0025')
    AND UPPER(m.emp_employee_code) = UPPER('E0018');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4130')
    AND UPPER(m.emp_employee_code) = UPPER('ES003');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4114')
    AND UPPER(m.emp_employee_code) = UPPER('472');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('467')
    AND UPPER(m.emp_employee_code) = UPPER('4204');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('346')
    AND UPPER(m.emp_employee_code) = UPPER('E0025');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('457')
    AND UPPER(m.emp_employee_code) = UPPER('E0020');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('478')
    AND UPPER(m.emp_employee_code) = UPPER('327');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('481')
    AND UPPER(m.emp_employee_code) = UPPER('4085');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('323')
    AND UPPER(m.emp_employee_code) = UPPER('E0038');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('338')
    AND UPPER(m.emp_employee_code) = UPPER('320');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4022')
    AND UPPER(m.emp_employee_code) = UPPER('330');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4055')
    AND UPPER(m.emp_employee_code) = UPPER('472');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4204')
    AND UPPER(m.emp_employee_code) = UPPER('E0058');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('416')
    AND UPPER(m.emp_employee_code) = UPPER('4139');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('483')
    AND UPPER(m.emp_employee_code) = UPPER('327');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('479')
    AND UPPER(m.emp_employee_code) = UPPER('E0018');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('425')
    AND UPPER(m.emp_employee_code) = UPPER('E0058');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('374')
    AND UPPER(m.emp_employee_code) = UPPER('4026');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('476')
    AND UPPER(m.emp_employee_code) = UPPER('4207');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4222')
    AND UPPER(m.emp_employee_code) = UPPER('384');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('470')
    AND UPPER(m.emp_employee_code) = UPPER('3002');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('469')
    AND UPPER(m.emp_employee_code) = UPPER('3002');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('475')
    AND UPPER(m.emp_employee_code) = UPPER('4207');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('311')
    AND UPPER(m.emp_employee_code) = UPPER('3002');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('480')
    AND UPPER(m.emp_employee_code) = UPPER('4085');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4111')
    AND UPPER(m.emp_employee_code) = UPPER('E0025');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('E0038')
    AND UPPER(m.emp_employee_code) = UPPER('E0058');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('MR01')
    AND UPPER(m.emp_employee_code) = UPPER('4026');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('3002')
    AND UPPER(m.emp_employee_code) = UPPER('E0058');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('461')
    AND UPPER(m.emp_employee_code) = UPPER('462');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4164')
    AND UPPER(m.emp_employee_code) = UPPER('E0038');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4203')
    AND UPPER(m.emp_employee_code) = UPPER('E0025');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('463')
    AND UPPER(m.emp_employee_code) = UPPER('462');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4139')
    AND UPPER(m.emp_employee_code) = UPPER('4111');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('414')
    AND UPPER(m.emp_employee_code) = UPPER('4139');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('363')
    AND UPPER(m.emp_employee_code) = UPPER('E0018');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4193')
    AND UPPER(m.emp_employee_code) = UPPER('E0038');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('E0046')
    AND UPPER(m.emp_employee_code) = UPPER('E0058');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('366')
    AND UPPER(m.emp_employee_code) = UPPER('4169');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('N002')
    AND UPPER(m.emp_employee_code) = UPPER('4026');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('455')
    AND UPPER(m.emp_employee_code) = UPPER('388');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('E0048')
    AND UPPER(m.emp_employee_code) = UPPER('E0018');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('466')
    AND UPPER(m.emp_employee_code) = UPPER('422');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('468')
    AND UPPER(m.emp_employee_code) = UPPER('E0038');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4192')
    AND UPPER(m.emp_employee_code) = UPPER('E0020');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('417')
    AND UPPER(m.emp_employee_code) = UPPER('ES003');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('E0054')
    AND UPPER(m.emp_employee_code) = UPPER('4026');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4199')
    AND UPPER(m.emp_employee_code) = UPPER('E0025');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('464')
    AND UPPER(m.emp_employee_code) = UPPER('462');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('482')
    AND UPPER(m.emp_employee_code) = UPPER('320');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('391')
    AND UPPER(m.emp_employee_code) = UPPER('4026');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4099')
    AND UPPER(m.emp_employee_code) = UPPER('E0048');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4171')
    AND UPPER(m.emp_employee_code) = UPPER('E0020');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4175')
    AND UPPER(m.emp_employee_code) = UPPER('E0058');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('E0062')
    AND UPPER(m.emp_employee_code) = UPPER('E0025');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('406')
    AND UPPER(m.emp_employee_code) = UPPER('4111');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('422')
    AND UPPER(m.emp_employee_code) = UPPER('E0058');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4066')
    AND UPPER(m.emp_employee_code) = UPPER('ES003');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('441')
    AND UPPER(m.emp_employee_code) = UPPER('E0038');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4197')
    AND UPPER(m.emp_employee_code) = UPPER('320');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('344')
    AND UPPER(m.emp_employee_code) = UPPER('327');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('389')
    AND UPPER(m.emp_employee_code) = UPPER('4026');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('408')
    AND UPPER(m.emp_employee_code) = UPPER('422');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4176')
    AND UPPER(m.emp_employee_code) = UPPER('3002');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('404')
    AND UPPER(m.emp_employee_code) = UPPER('422');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('3003')
    AND UPPER(m.emp_employee_code) = UPPER('3002');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('E0066')
    AND UPPER(m.emp_employee_code) = UPPER('3002');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4085')
    AND UPPER(m.emp_employee_code) = UPPER('388');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('465')
    AND UPPER(m.emp_employee_code) = UPPER('E0038');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('453')
    AND UPPER(m.emp_employee_code) = UPPER('327');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('472')
    AND UPPER(m.emp_employee_code) = UPPER('384');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('410')
    AND UPPER(m.emp_employee_code) = UPPER('422');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('322')
    AND UPPER(m.emp_employee_code) = UPPER('E0058');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4053')
    AND UPPER(m.emp_employee_code) = UPPER('472');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('E0073')
    AND UPPER(m.emp_employee_code) = UPPER('E0066');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('337')
    AND UPPER(m.emp_employee_code) = UPPER('E0025');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('459')
    AND UPPER(m.emp_employee_code) = UPPER('E0038');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('477')
    AND UPPER(m.emp_employee_code) = UPPER('4192');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('471')
    AND UPPER(m.emp_employee_code) = UPPER('422');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('E0104')
    AND UPPER(m.emp_employee_code) = UPPER('E0066');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('460')
    AND UPPER(m.emp_employee_code) = UPPER('E0018');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4200')
    AND UPPER(m.emp_employee_code) = UPPER('E0020');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('381')
    AND UPPER(m.emp_employee_code) = UPPER('E0058');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4098')
    AND UPPER(m.emp_employee_code) = UPPER('E0048');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4035')
    AND UPPER(m.emp_employee_code) = UPPER('4026');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('ES003')
    AND UPPER(m.emp_employee_code) = UPPER('4175');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4178')
    AND UPPER(m.emp_employee_code) = UPPER('E0038');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('352')
    AND UPPER(m.emp_employee_code) = UPPER('E0025');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4095')
    AND UPPER(m.emp_employee_code) = UPPER('E0025');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('335')
    AND UPPER(m.emp_employee_code) = UPPER('320');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('367')
    AND UPPER(m.emp_employee_code) = UPPER('388');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('407')
    AND UPPER(m.emp_employee_code) = UPPER('4169');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4026')
    AND UPPER(m.emp_employee_code) = UPPER('ES003');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4058')
    AND UPPER(m.emp_employee_code) = UPPER('E0066');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('316')
    AND UPPER(m.emp_employee_code) = UPPER('4204');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('419')
    AND UPPER(m.emp_employee_code) = UPPER('4066');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('462')
    AND UPPER(m.emp_employee_code) = UPPER('ES003');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('458')
    AND UPPER(m.emp_employee_code) = UPPER('E0025');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('450')
    AND UPPER(m.emp_employee_code) = UPPER('4022');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('4170')
    AND UPPER(m.emp_employee_code) = UPPER('472');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('418')
    AND UPPER(m.emp_employee_code) = UPPER('327');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('439')
    AND UPPER(m.emp_employee_code) = UPPER('E0038');
  UPDATE hrc_employee_mst e
  SET emp_reporting_to_emp_id_emp = m.emp_employee_id,
      emp_modified_by = 'seed-054',
      emp_modified_on = NOW()
  FROM hrc_employee_mst m
  WHERE UPPER(e.emp_employee_code) = UPPER('405')
    AND UPPER(m.emp_employee_code) = UPPER('422');
  RAISE NOTICE '054 micropro employees: inserted %, updated %', v_inserted, v_updated;
END $$;

