-- Indexes for faster transaction lists, report joins, and stock lookups.
-- Re-runnable: IF NOT EXISTS on every index.

SET search_path TO caits_local;

-- Transaction header list / filter (doc type + sort + status)
CREATE INDEX IF NOT EXISTS ix_txn_header_list
  ON txn_header_mst (txh_doc_type, txh_modified_on DESC, txh_doc_date DESC, txh_txn_header_id DESC);

CREATE INDEX IF NOT EXISTS ix_txn_header_type_date
  ON txn_header_mst (txh_doc_type, txh_doc_date);

CREATE INDEX IF NOT EXISTS ix_txn_header_type_status
  ON txn_header_mst (txh_doc_type, txh_status);

CREATE INDEX IF NOT EXISTS ix_txn_header_location
  ON txn_header_mst (txh_location_id_loc);

CREATE INDEX IF NOT EXISTS ix_txn_header_from_loc
  ON txn_header_mst (txh_from_location_id_loc);

CREATE INDEX IF NOT EXISTS ix_txn_header_to_loc
  ON txn_header_mst (txh_to_location_id_loc);

-- Detail lines: batch fetch by header (reports) and item ledger
CREATE INDEX IF NOT EXISTS ix_txn_detail_header
  ON txn_detail_dtl (txd_txn_header_id_txh);

CREATE INDEX IF NOT EXISTS ix_txn_detail_item
  ON txn_detail_dtl (txd_item_id_itm);

-- Stock dashboard + reports
CREATE INDEX IF NOT EXISTS ix_stock_location_active
  ON inv_stock_mst (stk_location_id_loc)
  WHERE COALESCE(stk_isactive, true) = true;

CREATE INDEX IF NOT EXISTS ix_stock_item_location
  ON inv_stock_mst (stk_item_id_itm, stk_location_id_loc)
  WHERE COALESCE(stk_isactive, true) = true;

-- BLS custody scans (issued-to employee)
CREATE INDEX IF NOT EXISTS ix_bls_active_issued
  ON inv_bls_mst (ibm_item_id_itm, ibm_current_location_id_loc)
  WHERE ibm_isactive = true AND ibm_issued_to_emp_id_emp IS NOT NULL;

-- Auth permission exceptions per employee
CREATE INDEX IF NOT EXISTS ix_user_access_exception_emp
  ON sysm_useraccess_exception_dtl (uexc_employee_id_emp);

-- Role permissions per role (auth /me)
CREATE INDEX IF NOT EXISTS ix_role_permission_role
  ON sysm_rolepermission_dtl (rlpm_role_id_rol);
