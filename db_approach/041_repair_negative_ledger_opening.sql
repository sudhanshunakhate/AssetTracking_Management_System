-- Align live stock with documented receipt/issue so Stock Ledger Opening is not negative.
-- 1) Restore asset qty wiped by same-store Issue (BLS still issued-to at that store).
-- 2) Restore Acer unit that has a stock row at 0 after a counted receipt.
-- 3) Top up remaining ledger deficits with an explicit recon batch (consumables / residual).
-- Re-runnable: guards on qty=0 / recon batch existence.

DO $$
DECLARE
  n int;
  tissue_id int;
  laptop1_id int;
  acer_id int;
  loc_fm int := 1;
BEGIN
  -- (1) Same-store issued assets: BLS location matches stock bucket, qty still 0
  UPDATE caits_local.inv_stock_mst s
  SET stk_current_qty = 1,
      stk_available_qty = 1,
      stk_modified_on = NOW(),
      stk_modified_by = 'repair-041'
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
  RAISE NOTICE '041: restored % same-store issued asset stock row(s)', n;

  -- (2) Acer Monitor SN-18-2026 — receipt in ledger, on-hand was 0
  SELECT itm_item_id INTO acer_id
  FROM caits_local.inv_item_mst
  WHERE UPPER(itm_item_code) = 'DESKTOP-002'
  LIMIT 1;

  IF acer_id IS NOT NULL THEN
    UPDATE caits_local.inv_stock_mst
    SET stk_current_qty = 1,
        stk_available_qty = 1,
        stk_modified_on = NOW(),
        stk_modified_by = 'repair-041'
    WHERE stk_item_id_itm = acer_id
      AND stk_location_id_loc = loc_fm
      AND UPPER(TRIM(COALESCE(stk_batch_lot_no, ''))) = 'SN-18-2026'
      AND COALESCE(stk_current_qty, 0) = 0
      AND stk_isactive IS TRUE;
    GET DIAGNOSTICS n = ROW_COUNT;
    RAISE NOTICE '041: restored Acer SN-18-2026 rows=%', n;
  END IF;

  -- (3a) Tissue (CON-002): docs imply 3 more on-hand than live (Opening -3)
  SELECT itm_item_id INTO tissue_id
  FROM caits_local.inv_item_mst
  WHERE UPPER(itm_item_code) = 'CON-002'
  LIMIT 1;

  IF tissue_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM caits_local.inv_stock_mst
    WHERE stk_item_id_itm = tissue_id
      AND stk_location_id_loc = loc_fm
      AND stk_batch_lot_no = 'LEDGER-RECON-CON-002'
  ) THEN
    INSERT INTO caits_local.inv_stock_mst (
      stk_item_id_itm, stk_location_id_loc, stk_uom_id_unt, stk_batch_lot_no,
      stk_current_qty, stk_available_qty, stk_inward_qty,
      stk_isactive, stk_created_by, stk_created_on
    )
    SELECT tissue_id, loc_fm, itm_uom_id_unt, 'LEDGER-RECON-CON-002',
           3, 3, 3, TRUE, 'repair-041', NOW()
    FROM caits_local.inv_item_mst WHERE itm_item_id = tissue_id;
    RAISE NOTICE '041: added Tissue recon +3';
  END IF;

  -- (3b) ExpertBook (LAPTOP-001): after (1), residual Opening deficit of 1 → recon serial
  SELECT itm_item_id INTO laptop1_id
  FROM caits_local.inv_item_mst
  WHERE UPPER(itm_item_code) = 'LAPTOP-001'
  LIMIT 1;

  IF laptop1_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM caits_local.inv_stock_mst
    WHERE stk_item_id_itm = laptop1_id
      AND stk_batch_lot_no = 'LEDGER-RECON-LAPTOP-001'
  ) THEN
    INSERT INTO caits_local.inv_stock_mst (
      stk_item_id_itm, stk_location_id_loc, stk_uom_id_unt, stk_batch_lot_no,
      stk_current_qty, stk_available_qty, stk_inward_qty,
      stk_isactive, stk_created_by, stk_created_on
    )
    SELECT laptop1_id, loc_fm, itm_uom_id_unt, 'LEDGER-RECON-LAPTOP-001',
           1, 1, 1, TRUE, 'repair-041', NOW()
    FROM caits_local.inv_item_mst WHERE itm_item_id = laptop1_id;
    RAISE NOTICE '041: added ExpertBook recon +1';
  END IF;
END $$;
