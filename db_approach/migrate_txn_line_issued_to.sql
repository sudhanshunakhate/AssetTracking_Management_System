-- Per-line "Issued To" employee on transaction detail (Opening Stock / GRN asset units).
-- When Condition = Issued, the form captures which employee holds the unit.
-- Also mirrored on inv_bls_mst so the standing BLS register keeps custody.

SET search_path TO caits_local;

ALTER TABLE txn_detail_dtl
    ADD COLUMN IF NOT EXISTS txd_issued_to_emp_id_emp integer;

ALTER TABLE inv_bls_mst
    ADD COLUMN IF NOT EXISTS ibm_issued_to_emp_id_emp integer;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_txn_detail_dtl_txd_issued_to_emp_id_emp'
    ) THEN
        ALTER TABLE txn_detail_dtl
            ADD CONSTRAINT fk_txn_detail_dtl_txd_issued_to_emp_id_emp
            FOREIGN KEY (txd_issued_to_emp_id_emp)
            REFERENCES hrc_employee_mst (emp_employee_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_inv_bls_mst_ibm_issued_to_emp_id_emp'
    ) THEN
        ALTER TABLE inv_bls_mst
            ADD CONSTRAINT fk_inv_bls_mst_ibm_issued_to_emp_id_emp
            FOREIGN KEY (ibm_issued_to_emp_id_emp)
            REFERENCES hrc_employee_mst (emp_employee_id);
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS ix_txn_detail_issued_to
    ON txn_detail_dtl (txd_issued_to_emp_id_emp)
    WHERE txd_issued_to_emp_id_emp IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_inv_bls_issued_to
    ON inv_bls_mst (ibm_issued_to_emp_id_emp)
    WHERE ibm_issued_to_emp_id_emp IS NOT NULL;

COMMENT ON COLUMN txn_detail_dtl.txd_issued_to_emp_id_emp
    IS 'Employee the asset unit is issued to when line condition is Issued';

COMMENT ON COLUMN inv_bls_mst.ibm_issued_to_emp_id_emp
    IS 'Employee currently holding this BLS unit (copied from txn line when condition is Issued)';

-- Verify
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'caits_local'
  AND column_name IN ('txd_issued_to_emp_id_emp', 'ibm_issued_to_emp_id_emp')
ORDER BY table_name, column_name;
