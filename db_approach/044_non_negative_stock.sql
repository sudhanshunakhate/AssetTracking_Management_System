-- Restore asset serials that were zeroed by same-store issue (custody should not leave stock),
-- skip serials already on-hand at another location, drop 041 recon batches, and forbid negative qty.
-- Re-runnable.

SET search_path TO caits_local;

DO $$
DECLARE
  n int := 0;
BEGIN
  UPDATE inv_stock_mst s
  SET stk_current_qty = 1,
      stk_available_qty = 1,
      stk_modified_on = NOW(),
      stk_modified_by = 'repair-044'
  FROM inv_bls_mst b
  JOIN inv_item_mst i ON i.itm_item_id = b.ibm_item_id_itm
  WHERE s.stk_isactive IS TRUE
    AND COALESCE(s.stk_current_qty, 0) = 0
    AND b.ibm_isactive IS TRUE
    AND COALESCE(b.ibm_is_dummy, FALSE) IS FALSE
    AND i.itm_item_type IS NOT NULL
    AND lower(i.itm_item_type) <> 'consumable'
    AND s.stk_item_id_itm = b.ibm_item_id_itm
    AND s.stk_location_id_loc = b.ibm_current_location_id_loc
    AND UPPER(TRIM(COALESCE(s.stk_batch_lot_no, ''))) = UPPER(TRIM(COALESCE(
          NULLIF(b.ibm_serial_no, ''),
          NULLIF(b.ibm_batch_no, ''),
          NULLIF(b.ibm_lot_no, ''),
          ''
        )))
    AND NOT EXISTS (
      SELECT 1
      FROM inv_stock_mst o
      WHERE o.stk_item_id_itm = s.stk_item_id_itm
        AND o.stk_isactive IS TRUE
        AND COALESCE(o.stk_current_qty, 0) > 0
        AND UPPER(TRIM(COALESCE(o.stk_batch_lot_no, ''))) = UPPER(TRIM(COALESCE(s.stk_batch_lot_no, '')))
        AND o.stk_stock_id IS DISTINCT FROM s.stk_stock_id
    );

  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE '044: restored % zeroed asset serial stock row(s)', n;

  UPDATE inv_stock_mst
  SET stk_current_qty = 0,
      stk_available_qty = 0,
      stk_modified_on = NOW(),
      stk_modified_by = 'repair-044'
  WHERE stk_isactive IS TRUE
    AND COALESCE(stk_current_qty, 0) > 0
    AND stk_batch_lot_no LIKE 'LEDGER-RECON-%';
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE '044: cleared % ledger recon batch(es)', n;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ck_inv_stock_current_qty_nonneg'
  ) THEN
    ALTER TABLE inv_stock_mst
      ADD CONSTRAINT ck_inv_stock_current_qty_nonneg
      CHECK (stk_current_qty >= 0);
  END IF;
END $$;
