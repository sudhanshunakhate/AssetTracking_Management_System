-- CAITS — Drop requisition approval status
-- Requisitions no longer use Pending Approval; saved docs are Submitted.
-- Safe to re-run.

SET search_path TO caits_local;

UPDATE txn_header_mst
SET txh_status = 'Submitted',
    txh_modified_by = 'migration-018',
    txh_modified_on = NOW()
WHERE UPPER(txh_doc_type) = 'MATERIAL_REQUISITION'
  AND LOWER(txh_status) = 'pending approval';

DO $$
DECLARE
  n integer;
BEGIN
  SELECT COUNT(*) INTO n FROM txn_header_mst
  WHERE UPPER(txh_doc_type) = 'MATERIAL_REQUISITION' AND txh_status = 'Submitted';
  RAISE NOTICE '018: requisitions now Submitted (count=%). Approval workflow removed for SR.', n;
END $$;
