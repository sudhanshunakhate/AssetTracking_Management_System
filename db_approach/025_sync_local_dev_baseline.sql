-- 025: Force local and dev to the same demo baseline.
-- Wipes all transactions/stock/BLS/items, removes dev-only demo stores, then re-runs 024 seed.
-- Re-runnable: always wipes first; 024 skip guard does not apply after the wipe.

SET search_path TO caits_local;

DO $$
DECLARE
  v_loc_admin integer;
BEGIN
  SELECT loc_location_id INTO v_loc_admin
  FROM org_location_mst
  WHERE loc_location_code = 'LOC-002'
  LIMIT 1;
  IF v_loc_admin IS NULL THEN
    SELECT loc_location_id INTO v_loc_admin
    FROM org_location_mst
    WHERE COALESCE(loc_isactive, true)
    ORDER BY loc_location_id
    LIMIT 1;
  END IF;

  UPDATE inv_stock_mst SET stk_last_txn_header_id_txh = NULL WHERE stk_last_txn_header_id_txh IS NOT NULL;
  UPDATE txn_header_mst SET txh_ref_txn_header_id_txh = NULL WHERE txh_ref_txn_header_id_txh IS NOT NULL;
  UPDATE txn_detail_dtl SET txd_bls_id_ibm = NULL WHERE txd_bls_id_ibm IS NOT NULL;

  DELETE FROM txn_detail_dtl;
  DELETE FROM txn_header_mst;
  DELETE FROM inv_stock_mst;
  DELETE FROM inv_bls_mst;

  UPDATE inv_item_mst SET itm_parent_item_id_itm = NULL WHERE itm_parent_item_id_itm IS NOT NULL;
  DELETE FROM inv_item_mst;

  -- Drop dev-only demo stores so both environments keep the same four base locations.
  DELETE FROM sysm_user_location_mapping_dtl
  WHERE uloc_location_id_loc IN (
    SELECT loc_location_id FROM org_location_mst
    WHERE loc_location_code IN ('DEMO-STR-A', 'DEMO-STR-B')
  );

  UPDATE sysm_userlogin_mst
  SET usr_location_id_loc = NULL
  WHERE usr_location_id_loc IN (
    SELECT loc_location_id FROM org_location_mst
    WHERE loc_location_code IN ('DEMO-STR-A', 'DEMO-STR-B')
  );

  IF v_loc_admin IS NOT NULL THEN
    UPDATE hrc_employee_mst
    SET emp_base_location_id_loc = v_loc_admin
    WHERE emp_base_location_id_loc IN (
      SELECT loc_location_id FROM org_location_mst
      WHERE loc_location_code IN ('DEMO-STR-A', 'DEMO-STR-B')
    );
  END IF;

  DELETE FROM org_location_mst
  WHERE loc_location_code IN ('DEMO-STR-A', 'DEMO-STR-B');

  RAISE NOTICE '025: wiped txn/stock/items and removed demo-only stores — running 024 seed next';
END $$;

\ir trim_items_seed_opening_stock.sql
