-- CAITS — Align transaction statuses with UI labels
-- Schema: caits_local
-- Safe to re-run: guarded UPDATEs by doc type + old status

SET search_path TO caits_local;

-- GRN / Opening Stock: draft → In Pending (Completed already correct)
UPDATE txn_header_mst
SET txh_status = 'In Pending',
    txh_modified_by = COALESCE(txh_modified_by, 'system'),
    txh_modified_on = NOW()
WHERE txh_doc_type IN ('GRN', 'OPENING_STOCK')
  AND LOWER(TRIM(txh_status)) = 'draft';

-- Store Requisition: draft → Pending; Submitted/Approved/Pending Approval → Requested
UPDATE txn_header_mst
SET txh_status = 'Pending',
    txh_modified_by = COALESCE(txh_modified_by, 'system'),
    txh_modified_on = NOW()
WHERE txh_doc_type = 'MATERIAL_REQUISITION'
  AND LOWER(TRIM(txh_status)) = 'draft';

UPDATE txn_header_mst
SET txh_status = 'Requested',
    txh_modified_by = COALESCE(txh_modified_by, 'system'),
    txh_modified_on = NOW()
WHERE txh_doc_type = 'MATERIAL_REQUISITION'
  AND LOWER(TRIM(txh_status)) IN ('submitted', 'approved', 'pending approval');

-- Requisitions that already have a completed/issued store issue → Issued
UPDATE txn_header_mst req
SET txh_status = 'Issued',
    txh_modified_by = COALESCE(req.txh_modified_by, 'system'),
    txh_modified_on = NOW()
WHERE req.txh_doc_type = 'MATERIAL_REQUISITION'
  AND LOWER(TRIM(req.txh_status)) IN ('requested', 'submitted', 'approved')
  AND EXISTS (
        SELECT 1
        FROM txn_header_mst iss
        WHERE iss.txh_doc_type = 'MATERIAL_ISSUE'
          AND iss.txh_ref_txn_header_id_txh = req.txh_txn_header_id
          AND LOWER(TRIM(iss.txh_status)) IN ('completed', 'issued')
  );

-- Store Issue: draft → Pending; Completed → Issued
UPDATE txn_header_mst
SET txh_status = 'Pending',
    txh_modified_by = COALESCE(txh_modified_by, 'system'),
    txh_modified_on = NOW()
WHERE txh_doc_type = 'MATERIAL_ISSUE'
  AND LOWER(TRIM(txh_status)) = 'draft';

UPDATE txn_header_mst
SET txh_status = 'Issued',
    txh_modified_by = COALESCE(txh_modified_by, 'system'),
    txh_modified_on = NOW()
WHERE txh_doc_type = 'MATERIAL_ISSUE'
  AND LOWER(TRIM(txh_status)) = 'completed';

-- Material Transfer: draft → Pending; Completed → Transferred
UPDATE txn_header_mst
SET txh_status = 'Pending',
    txh_modified_by = COALESCE(txh_modified_by, 'system'),
    txh_modified_on = NOW()
WHERE txh_doc_type = 'MATERIAL_TRANSFER'
  AND LOWER(TRIM(txh_status)) = 'draft';

UPDATE txn_header_mst
SET txh_status = 'Transferred',
    txh_modified_by = COALESCE(txh_modified_by, 'system'),
    txh_modified_on = NOW()
WHERE txh_doc_type = 'MATERIAL_TRANSFER'
  AND LOWER(TRIM(txh_status)) = 'completed';

-- Material Return: draft → Pending; Completed → Returned
UPDATE txn_header_mst
SET txh_status = 'Pending',
    txh_modified_by = COALESCE(txh_modified_by, 'system'),
    txh_modified_on = NOW()
WHERE txh_doc_type = 'MATERIAL_RETURN'
  AND LOWER(TRIM(txh_status)) = 'draft';

UPDATE txn_header_mst
SET txh_status = 'Returned',
    txh_modified_by = COALESCE(txh_modified_by, 'system'),
    txh_modified_on = NOW()
WHERE txh_doc_type = 'MATERIAL_RETURN'
  AND LOWER(TRIM(txh_status)) = 'completed';

DO $$
BEGIN
  RAISE NOTICE '019: transaction status labels remapped (GRN/OST/SR/Issue/Transfer/Return).';
END $$;
