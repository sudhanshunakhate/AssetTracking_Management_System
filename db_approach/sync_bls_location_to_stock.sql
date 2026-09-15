-- Align asset BLS current location with the store that holds on-hand qty for that serial.
-- Needed after material transfers that moved inv_stock but left ibm_current_location_id_loc on From.
-- Re-runnable: only updates rows that still diverge and have exactly one positive stock location.

DO $$
DECLARE
  updated_count integer := 0;
BEGIN
  WITH single_stock AS (
    SELECT
      s.stk_item_id_itm AS item_id,
      UPPER(TRIM(s.stk_batch_lot_no)) AS serial_key,
      MIN(s.stk_location_id_loc) AS location_id
    FROM caits_local.inv_stock_mst s
    WHERE COALESCE(s.stk_current_qty, 0) > 0
      AND s.stk_batch_lot_no IS NOT NULL
      AND TRIM(s.stk_batch_lot_no) <> ''
    GROUP BY s.stk_item_id_itm, UPPER(TRIM(s.stk_batch_lot_no))
    HAVING COUNT(DISTINCT s.stk_location_id_loc) = 1
  ),
  patched AS (
    UPDATE caits_local.inv_bls_mst b
    SET
      ibm_current_location_id_loc = ss.location_id,
      ibm_modified_by = COALESCE(b.ibm_modified_by, 'system'),
      ibm_modified_on = NOW()
    FROM single_stock ss
    WHERE b.ibm_item_id_itm = ss.item_id
      AND UPPER(TRIM(b.ibm_serial_no)) = ss.serial_key
      AND COALESCE(b.ibm_isactive, true) = true
      AND COALESCE(b.ibm_is_dummy, false) = false
      AND b.ibm_current_location_id_loc IS DISTINCT FROM ss.location_id
    RETURNING b.ibm_bls_id
  )
  SELECT COUNT(*) INTO updated_count FROM patched;

  RAISE NOTICE 'sync_bls_location_to_stock: updated % BLS row(s)', updated_count;
END $$;
