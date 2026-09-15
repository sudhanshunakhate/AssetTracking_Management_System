-- Repair on-hand qty for assets issued to an employee at the same store.
-- A prior MATERIAL_ISSUE bug depleted stk_current_qty when From = To; custody stayed on BLS.
-- Re-runnable: only restores rows that are still at 0 while BLS shows issued-to at that store.

DO $$
DECLARE
  n int := 0;
BEGIN
  UPDATE caits_local.inv_stock_mst s
  SET stk_current_qty = 1,
      stk_available_qty = 1,
      stk_modified_on = NOW(),
      stk_modified_by = 'repair-040'
  FROM caits_local.inv_bls_mst b
  WHERE s.stk_isactive IS TRUE
    AND COALESCE(s.stk_current_qty, 0) = 0
    AND b.ibm_isactive IS TRUE
    AND COALESCE(b.ibm_is_dummy, FALSE) IS FALSE
    AND b.ibm_issued_to_emp_id_emp IS NOT NULL
    AND b.ibm_item_id_itm = s.stk_item_id_itm
    AND b.ibm_current_location_id_loc = s.stk_location_id_loc
    AND UPPER(TRIM(COALESCE(s.stk_batch_lot_no, ''))) = UPPER(TRIM(COALESCE(
          NULLIF(b.ibm_serial_no, ''),
          NULLIF(b.ibm_batch_no, ''),
          NULLIF(b.ibm_lot_no, ''),
          ''
        )));

  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE '040_repair_same_loc_issue_stock: restored % stock row(s)', n;
END $$;
