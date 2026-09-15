-- Role on employee is only required when a system login is created.
-- Employees without login credentials should not need a role assigned.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'caits_local'
          AND table_name = 'hrc_employee_mst'
          AND column_name = 'emp_role_id_rol'
          AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE caits_local.hrc_employee_mst
            ALTER COLUMN emp_role_id_rol DROP NOT NULL;
        RAISE NOTICE 'emp_role_id_rol is now nullable on hrc_employee_mst';
    ELSE
        RAISE NOTICE 'emp_role_id_rol already nullable on hrc_employee_mst — skipping';
    END IF;
END $$;
