-- CAITS — add "Prepared By" to transaction headers
-- Schema: caits_local
-- Safe to re-run: guarded by IF NOT EXISTS / catalog checks
--
-- txn_header_mst already carried txh_prepared_date but had no matching
-- "prepared by" person. The Goods Receipt Note form captures both under
-- "Other Details" (Sign-off before GRN is finalised).

SET search_path TO caits_local;

ALTER TABLE txn_header_mst
    ADD COLUMN IF NOT EXISTS txh_prepared_by_emp_id_emp integer;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_txn_header_mst_txh_prepared_by_emp_id_emp'
    ) THEN
        ALTER TABLE txn_header_mst
            ADD CONSTRAINT fk_txn_header_mst_txh_prepared_by_emp_id_emp
            FOREIGN KEY (txh_prepared_by_emp_id_emp)
            REFERENCES hrc_employee_mst (emp_employee_id);
    END IF;
END
$$;

COMMENT ON COLUMN txn_header_mst.txh_prepared_by_emp_id_emp
    IS 'Employee who prepared the document (GRN Other Details sign-off)';

-- Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'caits_local'
  AND table_name = 'txn_header_mst'
  AND column_name IN ('txh_prepared_by_emp_id_emp', 'txh_prepared_date')
ORDER BY column_name;
