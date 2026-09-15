-- CAITS — integrity guards behind the master form validation
-- Backs the UI + service checks with database constraints so imports and
-- direct API calls cannot create the same duplicates.
-- Schema: caits_local
-- Safe to re-run.

SET search_path TO caits_local;

-- ---------------------------------------------------------------------------
-- 1) Item serial number — one physical unit, one serial.
--    Partial + lower() so blanks stay allowed and casing cannot be used to
--    slip a duplicate past the constraint.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    dupes integer;
BEGIN
    SELECT COUNT(*) INTO dupes
    FROM (
        SELECT lower(btrim(itm_serial_no))
        FROM inv_item_mst
        WHERE itm_serial_no IS NOT NULL AND btrim(itm_serial_no) <> ''
        GROUP BY 1
        HAVING COUNT(*) > 1
    ) d;

    IF dupes > 0 THEN
        RAISE WARNING
            'Skipping uq_item_serial_no: % duplicate serial number(s) already exist. Clean them up and re-run.',
            dupes;
    ELSE
        CREATE UNIQUE INDEX IF NOT EXISTS uq_item_serial_no
            ON inv_item_mst (lower(btrim(itm_serial_no)))
            WHERE itm_serial_no IS NOT NULL AND btrim(itm_serial_no) <> '';
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2) User access exception — at most one override per employee + menu + type.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    dupes integer;
BEGIN
    SELECT COUNT(*) INTO dupes
    FROM (
        SELECT uexc_employee_id_emp, lower(uexc_menu_code_mtree), lower(uexc_exception_type)
        FROM sysm_useraccess_exception_dtl
        GROUP BY 1, 2, 3
        HAVING COUNT(*) > 1
    ) d;

    IF dupes > 0 THEN
        RAISE WARNING
            'Skipping uq_access_exception: % duplicate exception row(s) already exist. Clean them up and re-run.',
            dupes;
    ELSE
        CREATE UNIQUE INDEX IF NOT EXISTS uq_access_exception
            ON sysm_useraccess_exception_dtl (
                uexc_employee_id_emp,
                lower(uexc_menu_code_mtree),
                lower(uexc_exception_type)
            );
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3) Lookups used by the item form (helps the uniqueness / filter queries).
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS ix_item_code_lower ON inv_item_mst (lower(itm_item_code));
CREATE INDEX IF NOT EXISTS ix_employee_email_lower ON hrc_employee_mst (lower(emp_email));

COMMENT ON INDEX uq_item_serial_no IS
    'Serial numbers identify a single physical unit; blank/NULL serials are exempt';
