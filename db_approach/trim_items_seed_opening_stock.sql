-- 024: Trim Item Master to 10 scenario items and seed Opening Stock with all fields filled.
-- Re-runnable: if DEMO-* items and OST-DEMO-* docs already exist, skips recreate after a clean check.
-- WARNING: Deletes ALL transactions, stock, and BLS rows so item FKs can be cleared.

SET search_path TO caits_local;

DO $$
DECLARE
  v_loc_admin integer;
  v_loc_it integer;
  v_entity integer := 2;
  v_vendor integer;
  v_emp integer;
  v_uom_nos integer;
  v_uom_pcs integer;
  v_uom_rm integer;
  v_uom_btl integer;
  v_uom_box integer;
  v_uom_lic integer;
  v_cat_it integer;
  v_cat_phy integer;
  v_cat_dig integer;
  v_cat_cons integer;
  v_cat_spare integer;
  v_cat_pack integer;
  v_cat_office integer;
  v_sc_laptop integer;
  v_sc_server integer;
  v_sc_network integer;
  v_sc_furn integer;
  v_sc_license integer;
  v_sc_consgen integer;
  v_sc_chem integer;
  v_sc_clean integer;
  v_sc_spit integer;
  v_sc_wrap integer;
  v_sc_office integer;
  v_hdr_asset integer;
  v_hdr_cons integer;
  v_item integer;
  v_bls integer;
  v_demo_count integer;
  v_ost_count integer;
  v_today date := CURRENT_DATE;
BEGIN
  -- Already seeded?
  SELECT COUNT(*) INTO v_demo_count
  FROM inv_item_mst
  WHERE itm_item_code LIKE 'DEMO-%';
  SELECT COUNT(*) INTO v_ost_count
  FROM txn_header_mst
  WHERE txh_doc_type = 'OPENING_STOCK'
    AND txh_doc_no IN ('OST-DEMO-ASSET', 'OST-DEMO-CONS');

  IF v_demo_count = 10 AND v_ost_count = 2
     AND (SELECT COUNT(*) FROM inv_item_mst) = 10 THEN
    RAISE NOTICE '024: DEMO catalog (10 items) + OST-DEMO docs already present — skipped';
    RETURN;
  END IF;

  -- Resolve masters (fail clearly if missing)
  SELECT loc_location_id INTO v_loc_admin FROM org_location_mst WHERE loc_location_code = 'LOC-002' LIMIT 1;
  SELECT loc_location_id INTO v_loc_it FROM org_location_mst WHERE loc_location_code = 'LOC-004' LIMIT 1;
  IF v_loc_admin IS NULL THEN
    SELECT loc_location_id INTO v_loc_admin FROM org_location_mst WHERE COALESCE(loc_isactive, true) ORDER BY loc_location_id LIMIT 1;
  END IF;
  IF v_loc_it IS NULL THEN
    v_loc_it := v_loc_admin;
  END IF;
  IF v_loc_admin IS NULL THEN
    RAISE EXCEPTION '024: no location found';
  END IF;

  SELECT vnd_vendor_id INTO v_vendor FROM inv_vendor_mst WHERE COALESCE(vnd_isactive, true) ORDER BY vnd_vendor_id LIMIT 1;
  SELECT emp_employee_id INTO v_emp FROM hrc_employee_mst ORDER BY emp_employee_id LIMIT 1;

  SELECT unt_unit_id INTO v_uom_nos FROM unit_mst WHERE unt_unit_code = 'NOS' LIMIT 1;
  SELECT unt_unit_id INTO v_uom_pcs FROM unit_mst WHERE unt_unit_code = 'PCS' LIMIT 1;
  SELECT unt_unit_id INTO v_uom_rm FROM unit_mst WHERE unt_unit_code = 'RM' LIMIT 1;
  SELECT unt_unit_id INTO v_uom_btl FROM unit_mst WHERE unt_unit_code = 'BTL' LIMIT 1;
  SELECT unt_unit_id INTO v_uom_box FROM unit_mst WHERE unt_unit_code = 'BOX' LIMIT 1;
  SELECT unt_unit_id INTO v_uom_lic FROM unit_mst WHERE unt_unit_code = 'LIC' LIMIT 1;
  v_uom_nos := COALESCE(v_uom_nos, v_uom_pcs, 1);
  v_uom_pcs := COALESCE(v_uom_pcs, v_uom_nos);
  v_uom_rm := COALESCE(v_uom_rm, v_uom_pcs);
  v_uom_btl := COALESCE(v_uom_btl, v_uom_pcs);
  v_uom_box := COALESCE(v_uom_box, v_uom_pcs);
  v_uom_lic := COALESCE(v_uom_lic, v_uom_pcs);

  SELECT cat_category_id INTO v_cat_it FROM category_mst WHERE cat_category_code = 'CAT-IT' LIMIT 1;
  SELECT cat_category_id INTO v_cat_phy FROM category_mst WHERE cat_category_code = 'CAT-PHY' LIMIT 1;
  SELECT cat_category_id INTO v_cat_dig FROM category_mst WHERE cat_category_code = 'CAT-DIG' LIMIT 1;
  SELECT cat_category_id INTO v_cat_cons FROM category_mst WHERE cat_category_code = 'CAT-CONS' LIMIT 1;
  SELECT cat_category_id INTO v_cat_spare FROM category_mst WHERE cat_category_code = 'CAT-SPARE' LIMIT 1;
  SELECT cat_category_id INTO v_cat_pack FROM category_mst WHERE cat_category_code = 'CAT-PACK' LIMIT 1;
  SELECT cat_category_id INTO v_cat_office FROM category_mst WHERE cat_category_code = 'CAT-OFFICE' LIMIT 1;

  SELECT scat_subcategory_id INTO v_sc_laptop FROM subcategory_mst WHERE scat_subcategory_code = 'SC-LAPTOP' LIMIT 1;
  SELECT scat_subcategory_id INTO v_sc_server FROM subcategory_mst WHERE scat_subcategory_code = 'SC-SERVER' LIMIT 1;
  SELECT scat_subcategory_id INTO v_sc_network FROM subcategory_mst WHERE scat_subcategory_code = 'SC-NETWORK' LIMIT 1;
  SELECT scat_subcategory_id INTO v_sc_furn FROM subcategory_mst WHERE scat_subcategory_code = 'SC-FURN' LIMIT 1;
  SELECT scat_subcategory_id INTO v_sc_license FROM subcategory_mst WHERE scat_subcategory_code = 'SC-LICENSE' LIMIT 1;
  SELECT scat_subcategory_id INTO v_sc_consgen FROM subcategory_mst WHERE scat_subcategory_code = 'SC-CONSGEN' LIMIT 1;
  SELECT scat_subcategory_id INTO v_sc_chem FROM subcategory_mst WHERE scat_subcategory_code = 'SC-CHEM' LIMIT 1;
  SELECT scat_subcategory_id INTO v_sc_clean FROM subcategory_mst WHERE scat_subcategory_code = 'SC-CLEAN' LIMIT 1;
  SELECT scat_subcategory_id INTO v_sc_spit FROM subcategory_mst WHERE scat_subcategory_code = 'SC-SPIT' LIMIT 1;
  SELECT scat_subcategory_id INTO v_sc_wrap FROM subcategory_mst WHERE scat_subcategory_code = 'SC-WRAP' LIMIT 1;
  -- Office subcat may not exist; fall back to general consumable
  SELECT scat_subcategory_id INTO v_sc_office
  FROM subcategory_mst
  WHERE scat_category_id_cat = v_cat_office
  ORDER BY scat_subcategory_id
  LIMIT 1;
  v_sc_office := COALESCE(v_sc_office, v_sc_consgen);

  -- -------- wipe dependents so items can be deleted --------
  UPDATE inv_stock_mst SET stk_last_txn_header_id_txh = NULL WHERE stk_last_txn_header_id_txh IS NOT NULL;
  UPDATE txn_header_mst SET txh_ref_txn_header_id_txh = NULL WHERE txh_ref_txn_header_id_txh IS NOT NULL;
  UPDATE txn_detail_dtl SET txd_bls_id_ibm = NULL WHERE txd_bls_id_ibm IS NOT NULL;

  DELETE FROM txn_detail_dtl;
  DELETE FROM txn_header_mst;
  DELETE FROM inv_stock_mst;
  DELETE FROM inv_bls_mst;

  UPDATE inv_item_mst SET itm_parent_item_id_itm = NULL WHERE itm_parent_item_id_itm IS NOT NULL;
  DELETE FROM inv_item_mst;

  -- -------- 10 scenario items --------
  -- 1 Serialized IT laptop (AMC + insurance + inspection + hardware specs)
  INSERT INTO inv_item_mst (
    itm_item_code, itm_item_name, itm_item_type, itm_category_id_cat, itm_subcategory_id_scat,
    itm_uom_id_unt, itm_standard_cost, itm_desc, itm_remarks, itm_asset_type, itm_make_brand, itm_model,
    itm_useful_life_years, itm_depreciation_method, itm_depreciation_rate, itm_current_location_id_loc,
    itm_is_serialized, itm_is_returnable, itm_is_under_amc, itm_is_insurance_required, itm_inspection_needed,
    itm_is_consumable, itm_track_batch_lot, itm_track_expiry, itm_allow_negative_stock,
    itm_ram, itm_storage, itm_processor, itm_product_no, itm_isactive, itm_created_by, itm_created_on
  ) VALUES (
    'DEMO-LAP-01', 'Demo Laptop Dell Latitude 5540', 'asset', v_cat_it, v_sc_laptop,
    v_uom_nos, 68500, 'Serialized IT laptop for issue / transfer / return flows', 'Scenario: serialized IT asset',
    'IT – Laptop', 'Dell', 'Latitude 5540', 4, 'Straight Line (SLM)', 25,
    v_loc_it, true, true, true, true, true, false, false, false, false,
    '16GB', '512GB SSD', 'Intel i7-1355U', '210-BBBB', true, '024-demo-seed', NOW()
  );

  -- 2 Serialized IT server
  INSERT INTO inv_item_mst (
    itm_item_code, itm_item_name, itm_item_type, itm_category_id_cat, itm_subcategory_id_scat,
    itm_uom_id_unt, itm_standard_cost, itm_desc, itm_remarks, itm_asset_type, itm_make_brand, itm_model,
    itm_useful_life_years, itm_depreciation_method, itm_depreciation_rate, itm_current_location_id_loc,
    itm_is_serialized, itm_is_returnable, itm_is_under_amc, itm_is_insurance_required, itm_inspection_needed,
    itm_is_consumable, itm_track_batch_lot, itm_track_expiry, itm_allow_negative_stock,
    itm_ram, itm_storage, itm_processor, itm_isactive, itm_created_by, itm_created_on
  ) VALUES (
    'DEMO-SRV-01', 'Demo Server HP ProLiant DL380', 'asset', v_cat_it, v_sc_server,
    v_uom_nos, 185000, 'Serialized server asset', 'Scenario: IT server',
    'IT – Server', 'HP', 'ProLiant DL380 Gen10', 5, 'Written Down Value (WDV)', 40,
    v_loc_it, true, true, true, true, true, false, false, false, false,
    '64GB', '2x1TB SSD', 'Xeon Gold', true, '024-demo-seed', NOW()
  );

  -- 3 Serialized network / peripheral (IP-MAC-hostname heavy)
  INSERT INTO inv_item_mst (
    itm_item_code, itm_item_name, itm_item_type, itm_category_id_cat, itm_subcategory_id_scat,
    itm_uom_id_unt, itm_standard_cost, itm_desc, itm_remarks, itm_asset_type, itm_make_brand, itm_model,
    itm_useful_life_years, itm_depreciation_method, itm_depreciation_rate, itm_current_location_id_loc,
    itm_is_serialized, itm_is_returnable, itm_is_under_amc, itm_is_insurance_required, itm_inspection_needed,
    itm_is_consumable, itm_track_batch_lot, itm_track_expiry, itm_allow_negative_stock,
    itm_isactive, itm_created_by, itm_created_on
  ) VALUES (
    'DEMO-NET-01', 'Demo Network Switch Cisco C9200', 'asset', v_cat_it, v_sc_network,
    v_uom_nos, 42000, 'Serialized network device', 'Scenario: IT network with instance network fields',
    'IT – Network', 'Cisco', 'Catalyst 9200', 6, 'Straight Line (SLM)', 15,
    v_loc_it, true, true, false, false, true, false, false, false, false,
    true, '024-demo-seed', NOW()
  );

  -- 4 Non-serialized physical furniture (still asset type in UI)
  INSERT INTO inv_item_mst (
    itm_item_code, itm_item_name, itm_item_type, itm_category_id_cat, itm_subcategory_id_scat,
    itm_uom_id_unt, itm_standard_cost, itm_desc, itm_remarks, itm_asset_type, itm_make_brand, itm_model,
    itm_useful_life_years, itm_depreciation_method, itm_depreciation_rate, itm_current_location_id_loc,
    itm_is_serialized, itm_is_returnable, itm_is_under_amc, itm_is_insurance_required, itm_inspection_needed,
    itm_is_consumable, itm_track_batch_lot, itm_track_expiry, itm_allow_negative_stock,
    itm_isactive, itm_created_by, itm_created_on
  ) VALUES (
    'DEMO-CHR-01', 'Demo Office Chair Ergonomic', 'asset', v_cat_phy, v_sc_furn,
    v_uom_pcs, 8500, 'Non-serialized physical furniture asset', 'Scenario: non-serialized physical asset',
    'Physical – Equipment', 'Godrej', 'Interio Pro', 8, 'None', 0,
    v_loc_admin, false, true, false, false, false, false, false, false, false,
    true, '024-demo-seed', NOW()
  );

  -- 5 Digital license asset
  INSERT INTO inv_item_mst (
    itm_item_code, itm_item_name, itm_item_type, itm_category_id_cat, itm_subcategory_id_scat,
    itm_uom_id_unt, itm_standard_cost, itm_desc, itm_remarks, itm_asset_type, itm_make_brand, itm_model,
    itm_useful_life_years, itm_depreciation_method, itm_depreciation_rate, itm_current_location_id_loc,
    itm_is_serialized, itm_is_returnable, itm_is_under_amc, itm_is_insurance_required, itm_inspection_needed,
    itm_is_consumable, itm_track_batch_lot, itm_track_expiry, itm_allow_negative_stock,
    itm_product_no, itm_isactive, itm_created_by, itm_created_on
  ) VALUES (
    'DEMO-LIC-01', 'Demo MS Office 365 License', 'asset', v_cat_dig, v_sc_license,
    v_uom_lic, 12000, 'Digital license tracked by key/serial', 'Scenario: digital license asset',
    'Digital – License', 'Microsoft', 'Office 365 E3', 3, 'None', 0,
    v_loc_admin, true, false, false, false, false, false, false, false, false,
    'O365-E3', true, '024-demo-seed', NOW()
  );

  -- 6 Consumable — batch only (office paper)
  INSERT INTO inv_item_mst (
    itm_item_code, itm_item_name, itm_item_type, itm_category_id_cat, itm_subcategory_id_scat,
    itm_uom_id_unt, itm_standard_cost, itm_desc, itm_remarks, itm_consumable_type, itm_make_brand,
    itm_current_location_id_loc,
    itm_is_serialized, itm_is_returnable, itm_is_under_amc, itm_is_insurance_required, itm_inspection_needed,
    itm_is_consumable, itm_track_batch_lot, itm_track_expiry, itm_allow_negative_stock,
    itm_isactive, itm_created_by, itm_created_on
  ) VALUES (
    'DEMO-PAPER-01', 'Demo A4 Copier Paper Ream', 'consumable', COALESCE(v_cat_office, v_cat_cons), v_sc_office,
    v_uom_rm, 320, 'Batch-tracked office consumable', 'Scenario: consumable batch only',
    'Consumable', 'JK Easy Copier', v_loc_admin,
    false, false, false, false, false, true, true, false, false,
    true, '024-demo-seed', NOW()
  );

  -- 7 Consumable — batch + expiry (ink)
  INSERT INTO inv_item_mst (
    itm_item_code, itm_item_name, itm_item_type, itm_category_id_cat, itm_subcategory_id_scat,
    itm_uom_id_unt, itm_standard_cost, itm_desc, itm_remarks, itm_consumable_type, itm_make_brand, itm_model,
    itm_current_location_id_loc,
    itm_is_serialized, itm_is_returnable, itm_is_under_amc, itm_is_insurance_required, itm_inspection_needed,
    itm_is_consumable, itm_track_batch_lot, itm_track_expiry, itm_allow_negative_stock,
    itm_isactive, itm_created_by, itm_created_on
  ) VALUES (
    'DEMO-INK-01', 'Demo Printer Ink Cartridge Black', 'consumable', v_cat_cons, v_sc_consgen,
    v_uom_pcs, 1450, 'Batch + expiry consumable', 'Scenario: consumable batch and expiry',
    'Consumable', 'HP', '950XL', v_loc_admin,
    false, false, false, false, false, true, true, true, false,
    true, '024-demo-seed', NOW()
  );

  -- 8 Consumable — expiry only (chemical / cleaning fluid)
  INSERT INTO inv_item_mst (
    itm_item_code, itm_item_name, itm_item_type, itm_category_id_cat, itm_subcategory_id_scat,
    itm_uom_id_unt, itm_standard_cost, itm_desc, itm_remarks, itm_consumable_type, itm_make_brand,
    itm_current_location_id_loc,
    itm_is_serialized, itm_is_returnable, itm_is_under_amc, itm_is_insurance_required, itm_inspection_needed,
    itm_is_consumable, itm_track_batch_lot, itm_track_expiry, itm_allow_negative_stock,
    itm_isactive, itm_created_by, itm_created_on
  ) VALUES (
    'DEMO-CHEM-01', 'Demo Disinfectant Cleaner 1L', 'consumable', v_cat_cons, COALESCE(v_sc_chem, v_sc_clean),
    v_uom_btl, 180, 'Expiry-tracked cleaning chemical', 'Scenario: consumable expiry only',
    'Consumable', 'Lysol', v_loc_admin,
    false, false, false, false, false, true, false, true, false,
    true, '024-demo-seed', NOW()
  );

  -- 9 Consumable spare part — batch tracked
  INSERT INTO inv_item_mst (
    itm_item_code, itm_item_name, itm_item_type, itm_category_id_cat, itm_subcategory_id_scat,
    itm_uom_id_unt, itm_standard_cost, itm_desc, itm_remarks, itm_consumable_type, itm_make_brand, itm_model,
    itm_current_location_id_loc,
    itm_is_serialized, itm_is_returnable, itm_is_under_amc, itm_is_insurance_required, itm_inspection_needed,
    itm_is_consumable, itm_track_batch_lot, itm_track_expiry, itm_allow_negative_stock,
    itm_isactive, itm_created_by, itm_created_on
  ) VALUES (
    'DEMO-SPARE-01', 'Demo SSD 256GB Spare Module', 'consumable', v_cat_spare, v_sc_spit,
    v_uom_pcs, 3200, 'IT spare consumable with batch', 'Scenario: spare-part consumable',
    'Spare Part', 'Samsung', '870 EVO 256GB', v_loc_it,
    false, true, false, false, true, true, true, false, false,
    true, '024-demo-seed', NOW()
  );

  -- 10 Packaging consumable — no batch / no expiry (simple qty)
  INSERT INTO inv_item_mst (
    itm_item_code, itm_item_name, itm_item_type, itm_category_id_cat, itm_subcategory_id_scat,
    itm_uom_id_unt, itm_standard_cost, itm_desc, itm_remarks, itm_consumable_type, itm_make_brand,
    itm_current_location_id_loc,
    itm_is_serialized, itm_is_returnable, itm_is_under_amc, itm_is_insurance_required, itm_inspection_needed,
    itm_is_consumable, itm_track_batch_lot, itm_track_expiry, itm_allow_negative_stock,
    itm_isactive, itm_created_by, itm_created_on
  ) VALUES (
    'DEMO-PACK-01', 'Demo Carton Box Medium', 'consumable', v_cat_pack, v_sc_wrap,
    v_uom_box, 45, 'Simple packaging consumable', 'Scenario: consumable without batch/expiry',
    'Packaging', 'Local Pack', v_loc_admin,
    false, false, false, false, false, true, false, false, true,
    true, '024-demo-seed', NOW()
  );

  -- -------- Opening Stock — Assets (all instance fields filled) --------
  INSERT INTO txn_header_mst (
    txh_doc_type, txh_doc_no, txh_doc_date, txh_posting_date, txh_entity_id_ent, txh_location_id_loc,
    txh_party_id_vnd, txh_prepared_by_emp_id_emp, txh_prepared_date, txh_remarks, txh_status,
    txh_created_by, txh_created_on
  ) VALUES (
    'OPENING_STOCK', 'OST-DEMO-ASSET', v_today, v_today, v_entity, v_loc_admin,
    v_vendor, v_emp, v_today,
    '024 demo seed — asset opening stock with full instance fields',
    'Completed', '024-demo-seed', NOW()
  )
  RETURNING txh_txn_header_id INTO v_hdr_asset;

  -- LAP
  SELECT itm_item_id INTO v_item FROM inv_item_mst WHERE itm_item_code = 'DEMO-LAP-01';
  INSERT INTO inv_bls_mst (
    ibm_entity_id_ent, ibm_item_id_itm, ibm_serial_no, ibm_ip_address, ibm_mac_address, ibm_hostname,
    ibm_item_condition, ibm_current_location_id_loc, ibm_is_dummy, ibm_isactive, ibm_islocked,
    ibm_created_by, ibm_created_on
  ) VALUES (
    v_entity, v_item, 'SN-LAP-DEMO-001', '192.168.10.21', 'AA-BB-CC-DD-EE-01', 'LAP-DEMO-001.local',
    'In Stock', v_loc_admin, false, true, false, '024-demo-seed', NOW()
  ) RETURNING ibm_bls_id INTO v_bls;
  INSERT INTO txn_detail_dtl (
    txd_txn_header_id_txh, txd_doc_type, txd_sr_no, txd_item_id_itm, txd_uom_id_unt,
    txd_qty, txd_ordered_qty, txd_received_qty, txd_accepted_qty, txd_requested_qty,
    txd_location_id_loc, txd_serial_no, txd_ip_address, txd_mac_address, txd_hostname,
    txd_item_condition, txd_remark, txd_bls_id_ibm
  ) VALUES (
    v_hdr_asset, 'OPENING_STOCK', 1, v_item, v_uom_nos,
    1, 1, 1, 1, 1,
    v_loc_admin, 'SN-LAP-DEMO-001', '192.168.10.21', 'AA-BB-CC-DD-EE-01', 'LAP-DEMO-001.local',
    'In Stock', 'Opening unit — laptop', v_bls
  );
  INSERT INTO inv_stock_mst (
    stk_item_id_itm, stk_location_id_loc, stk_batch_lot_no, stk_uom_id_unt,
    stk_opening_qty, stk_inward_qty, stk_current_qty, stk_available_qty, stk_reserved_qty,
    stk_last_txn_header_id_txh, stk_last_transaction_date, stk_isactive, stk_created_by, stk_created_on
  ) VALUES (
    v_item, v_loc_admin, 'SN-LAP-DEMO-001', v_uom_nos,
    1, 0, 1, 1, 0, v_hdr_asset, v_today, true, '024-demo-seed', NOW()
  );

  -- SRV
  SELECT itm_item_id INTO v_item FROM inv_item_mst WHERE itm_item_code = 'DEMO-SRV-01';
  INSERT INTO inv_bls_mst (
    ibm_entity_id_ent, ibm_item_id_itm, ibm_serial_no, ibm_ip_address, ibm_mac_address, ibm_hostname,
    ibm_item_condition, ibm_current_location_id_loc, ibm_is_dummy, ibm_isactive, ibm_islocked,
    ibm_created_by, ibm_created_on
  ) VALUES (
    v_entity, v_item, 'SN-SRV-DEMO-001', '192.168.10.50', 'AA-BB-CC-DD-EE-50', 'SRV-DEMO-001.local',
    'In Stock', v_loc_admin, false, true, false, '024-demo-seed', NOW()
  ) RETURNING ibm_bls_id INTO v_bls;
  INSERT INTO txn_detail_dtl (
    txd_txn_header_id_txh, txd_doc_type, txd_sr_no, txd_item_id_itm, txd_uom_id_unt,
    txd_qty, txd_ordered_qty, txd_received_qty, txd_accepted_qty, txd_requested_qty,
    txd_location_id_loc, txd_serial_no, txd_ip_address, txd_mac_address, txd_hostname,
    txd_item_condition, txd_remark, txd_bls_id_ibm
  ) VALUES (
    v_hdr_asset, 'OPENING_STOCK', 2, v_item, v_uom_nos,
    1, 1, 1, 1, 1,
    v_loc_admin, 'SN-SRV-DEMO-001', '192.168.10.50', 'AA-BB-CC-DD-EE-50', 'SRV-DEMO-001.local',
    'In Stock', 'Opening unit — server', v_bls
  );
  INSERT INTO inv_stock_mst (
    stk_item_id_itm, stk_location_id_loc, stk_batch_lot_no, stk_uom_id_unt,
    stk_opening_qty, stk_inward_qty, stk_current_qty, stk_available_qty, stk_reserved_qty,
    stk_last_txn_header_id_txh, stk_last_transaction_date, stk_isactive, stk_created_by, stk_created_on
  ) VALUES (
    v_item, v_loc_admin, 'SN-SRV-DEMO-001', v_uom_nos,
    1, 0, 1, 1, 0, v_hdr_asset, v_today, true, '024-demo-seed', NOW()
  );

  -- NET
  SELECT itm_item_id INTO v_item FROM inv_item_mst WHERE itm_item_code = 'DEMO-NET-01';
  INSERT INTO inv_bls_mst (
    ibm_entity_id_ent, ibm_item_id_itm, ibm_serial_no, ibm_ip_address, ibm_mac_address, ibm_hostname,
    ibm_item_condition, ibm_current_location_id_loc, ibm_is_dummy, ibm_isactive, ibm_islocked,
    ibm_created_by, ibm_created_on
  ) VALUES (
    v_entity, v_item, 'SN-NET-DEMO-001', '192.168.10.1', 'AA-BB-CC-DD-EE-11', 'SW-DEMO-001.local',
    'In Stock', v_loc_admin, false, true, false, '024-demo-seed', NOW()
  ) RETURNING ibm_bls_id INTO v_bls;
  INSERT INTO txn_detail_dtl (
    txd_txn_header_id_txh, txd_doc_type, txd_sr_no, txd_item_id_itm, txd_uom_id_unt,
    txd_qty, txd_ordered_qty, txd_received_qty, txd_accepted_qty, txd_requested_qty,
    txd_location_id_loc, txd_serial_no, txd_ip_address, txd_mac_address, txd_hostname,
    txd_item_condition, txd_remark, txd_bls_id_ibm
  ) VALUES (
    v_hdr_asset, 'OPENING_STOCK', 3, v_item, v_uom_nos,
    1, 1, 1, 1, 1,
    v_loc_admin, 'SN-NET-DEMO-001', '192.168.10.1', 'AA-BB-CC-DD-EE-11', 'SW-DEMO-001.local',
    'In Stock', 'Opening unit — network switch', v_bls
  );
  INSERT INTO inv_stock_mst (
    stk_item_id_itm, stk_location_id_loc, stk_batch_lot_no, stk_uom_id_unt,
    stk_opening_qty, stk_inward_qty, stk_current_qty, stk_available_qty, stk_reserved_qty,
    stk_last_txn_header_id_txh, stk_last_transaction_date, stk_isactive, stk_created_by, stk_created_on
  ) VALUES (
    v_item, v_loc_admin, 'SN-NET-DEMO-001', v_uom_nos,
    1, 0, 1, 1, 0, v_hdr_asset, v_today, true, '024-demo-seed', NOW()
  );

  -- CHR (tag as serial for OST completeness even though master is non-serialized)
  SELECT itm_item_id INTO v_item FROM inv_item_mst WHERE itm_item_code = 'DEMO-CHR-01';
  INSERT INTO inv_bls_mst (
    ibm_entity_id_ent, ibm_item_id_itm, ibm_serial_no, ibm_item_condition, ibm_current_location_id_loc,
    ibm_is_dummy, ibm_isactive, ibm_islocked, ibm_created_by, ibm_created_on
  ) VALUES (
    v_entity, v_item, 'TAG-CHR-DEMO-001', 'In Stock', v_loc_admin,
    false, true, false, '024-demo-seed', NOW()
  ) RETURNING ibm_bls_id INTO v_bls;
  INSERT INTO txn_detail_dtl (
    txd_txn_header_id_txh, txd_doc_type, txd_sr_no, txd_item_id_itm, txd_uom_id_unt,
    txd_qty, txd_ordered_qty, txd_received_qty, txd_accepted_qty, txd_requested_qty,
    txd_location_id_loc, txd_serial_no, txd_item_condition, txd_remark, txd_bls_id_ibm
  ) VALUES (
    v_hdr_asset, 'OPENING_STOCK', 4, v_item, v_uom_pcs,
    1, 1, 1, 1, 1,
    v_loc_admin, 'TAG-CHR-DEMO-001', 'In Stock', 'Opening unit — chair', v_bls
  );
  INSERT INTO inv_stock_mst (
    stk_item_id_itm, stk_location_id_loc, stk_batch_lot_no, stk_uom_id_unt,
    stk_opening_qty, stk_inward_qty, stk_current_qty, stk_available_qty, stk_reserved_qty,
    stk_last_txn_header_id_txh, stk_last_transaction_date, stk_isactive, stk_created_by, stk_created_on
  ) VALUES (
    v_item, v_loc_admin, 'TAG-CHR-DEMO-001', v_uom_pcs,
    1, 0, 1, 1, 0, v_hdr_asset, v_today, true, '024-demo-seed', NOW()
  );

  -- LIC
  SELECT itm_item_id INTO v_item FROM inv_item_mst WHERE itm_item_code = 'DEMO-LIC-01';
  INSERT INTO inv_bls_mst (
    ibm_entity_id_ent, ibm_item_id_itm, ibm_serial_no, ibm_item_condition, ibm_current_location_id_loc,
    ibm_is_dummy, ibm_isactive, ibm_islocked, ibm_created_by, ibm_created_on
  ) VALUES (
    v_entity, v_item, 'LIC-O365-DEMO-001', 'In Stock', v_loc_admin,
    false, true, false, '024-demo-seed', NOW()
  ) RETURNING ibm_bls_id INTO v_bls;
  INSERT INTO txn_detail_dtl (
    txd_txn_header_id_txh, txd_doc_type, txd_sr_no, txd_item_id_itm, txd_uom_id_unt,
    txd_qty, txd_ordered_qty, txd_received_qty, txd_accepted_qty, txd_requested_qty,
    txd_location_id_loc, txd_serial_no, txd_item_condition, txd_remark, txd_bls_id_ibm
  ) VALUES (
    v_hdr_asset, 'OPENING_STOCK', 5, v_item, v_uom_lic,
    1, 1, 1, 1, 1,
    v_loc_admin, 'LIC-O365-DEMO-001', 'In Stock', 'Opening unit — software license', v_bls
  );
  INSERT INTO inv_stock_mst (
    stk_item_id_itm, stk_location_id_loc, stk_batch_lot_no, stk_uom_id_unt,
    stk_opening_qty, stk_inward_qty, stk_current_qty, stk_available_qty, stk_reserved_qty,
    stk_last_txn_header_id_txh, stk_last_transaction_date, stk_isactive, stk_created_by, stk_created_on
  ) VALUES (
    v_item, v_loc_admin, 'LIC-O365-DEMO-001', v_uom_lic,
    1, 0, 1, 1, 0, v_hdr_asset, v_today, true, '024-demo-seed', NOW()
  );

  UPDATE txn_header_mst
  SET txh_party_id_vnd = v_vendor,
      txh_total_accepted_qty = 5,
      txh_total_received_qty = 5,
      txh_total_ordered_qty = 5
  WHERE txh_txn_header_id = v_hdr_asset;

  -- -------- Opening Stock — Consumables (batch / mfg / expiry / supplier / remark) --------
  INSERT INTO txn_header_mst (
    txh_doc_type, txh_doc_no, txh_doc_date, txh_posting_date, txh_entity_id_ent, txh_location_id_loc,
    txh_party_id_vnd, txh_prepared_by_emp_id_emp, txh_prepared_date, txh_remarks, txh_status,
    txh_created_by, txh_created_on
  ) VALUES (
    'OPENING_STOCK', 'OST-DEMO-CONS', v_today, v_today, v_entity, v_loc_admin,
    v_vendor, v_emp, v_today,
    '024 demo seed — consumable opening stock with batch/mfg/expiry filled',
    'Completed', '024-demo-seed', NOW()
  )
  RETURNING txh_txn_header_id INTO v_hdr_cons;

  -- PAPER batch only
  SELECT itm_item_id INTO v_item FROM inv_item_mst WHERE itm_item_code = 'DEMO-PAPER-01';
  INSERT INTO inv_bls_mst (
    ibm_entity_id_ent, ibm_item_id_itm, ibm_batch_no, ibm_mfg_date, ibm_expiry_date,
    ibm_current_location_id_loc, ibm_is_dummy, ibm_isactive, ibm_islocked, ibm_created_by, ibm_created_on
  ) VALUES (
    v_entity, v_item, 'BATCH-PAPER-2401', DATE '2026-01-15', NULL,
    v_loc_admin, false, true, false, '024-demo-seed', NOW()
  ) RETURNING ibm_bls_id INTO v_bls;
  INSERT INTO txn_detail_dtl (
    txd_txn_header_id_txh, txd_doc_type, txd_sr_no, txd_item_id_itm, txd_uom_id_unt,
    txd_qty, txd_ordered_qty, txd_received_qty, txd_accepted_qty, txd_requested_qty,
    txd_batch_lot_no, txd_mfg_date, txd_expiry_date, txd_location_id_loc, txd_remark, txd_bls_id_ibm
  ) VALUES (
    v_hdr_cons, 'OPENING_STOCK', 1, v_item, v_uom_rm,
    50, 50, 50, 50, 50,
    'BATCH-PAPER-2401', DATE '2026-01-15', NULL, v_loc_admin, 'Opening — paper reams', v_bls
  );
  INSERT INTO inv_stock_mst (
    stk_item_id_itm, stk_location_id_loc, stk_batch_lot_no, stk_uom_id_unt,
    stk_opening_qty, stk_inward_qty, stk_current_qty, stk_available_qty, stk_reserved_qty,
    stk_last_txn_header_id_txh, stk_last_transaction_date, stk_isactive, stk_created_by, stk_created_on
  ) VALUES (
    v_item, v_loc_admin, 'BATCH-PAPER-2401', v_uom_rm,
    50, 0, 50, 50, 0, v_hdr_cons, v_today, true, '024-demo-seed', NOW()
  );

  -- INK batch+expiry
  SELECT itm_item_id INTO v_item FROM inv_item_mst WHERE itm_item_code = 'DEMO-INK-01';
  INSERT INTO inv_bls_mst (
    ibm_entity_id_ent, ibm_item_id_itm, ibm_batch_no, ibm_mfg_date, ibm_expiry_date,
    ibm_current_location_id_loc, ibm_is_dummy, ibm_isactive, ibm_islocked, ibm_created_by, ibm_created_on
  ) VALUES (
    v_entity, v_item, 'BATCH-INK-2506', DATE '2025-06-01', DATE '2027-06-01',
    v_loc_admin, false, true, false, '024-demo-seed', NOW()
  ) RETURNING ibm_bls_id INTO v_bls;
  INSERT INTO txn_detail_dtl (
    txd_txn_header_id_txh, txd_doc_type, txd_sr_no, txd_item_id_itm, txd_uom_id_unt,
    txd_qty, txd_ordered_qty, txd_received_qty, txd_accepted_qty, txd_requested_qty,
    txd_batch_lot_no, txd_mfg_date, txd_expiry_date, txd_location_id_loc, txd_remark, txd_bls_id_ibm
  ) VALUES (
    v_hdr_cons, 'OPENING_STOCK', 2, v_item, v_uom_pcs,
    20, 20, 20, 20, 20,
    'BATCH-INK-2506', DATE '2025-06-01', DATE '2027-06-01', v_loc_admin, 'Opening — ink cartridges', v_bls
  );
  INSERT INTO inv_stock_mst (
    stk_item_id_itm, stk_location_id_loc, stk_batch_lot_no, stk_uom_id_unt, stk_expiry_date,
    stk_opening_qty, stk_inward_qty, stk_current_qty, stk_available_qty, stk_reserved_qty,
    stk_last_txn_header_id_txh, stk_last_transaction_date, stk_isactive, stk_created_by, stk_created_on
  ) VALUES (
    v_item, v_loc_admin, 'BATCH-INK-2506', v_uom_pcs, DATE '2027-06-01',
    20, 0, 20, 20, 0, v_hdr_cons, v_today, true, '024-demo-seed', NOW()
  );

  -- CHEM expiry only (use synthetic batch key blank → dummy-like but store expiry on stock)
  SELECT itm_item_id INTO v_item FROM inv_item_mst WHERE itm_item_code = 'DEMO-CHEM-01';
  INSERT INTO inv_bls_mst (
    ibm_entity_id_ent, ibm_item_id_itm, ibm_mfg_date, ibm_expiry_date,
    ibm_current_location_id_loc, ibm_is_dummy, ibm_isactive, ibm_islocked, ibm_created_by, ibm_created_on
  ) VALUES (
    v_entity, v_item, DATE '2025-11-01', DATE '2026-11-01',
    v_loc_admin, true, true, false, '024-demo-seed', NOW()
  ) RETURNING ibm_bls_id INTO v_bls;
  INSERT INTO txn_detail_dtl (
    txd_txn_header_id_txh, txd_doc_type, txd_sr_no, txd_item_id_itm, txd_uom_id_unt,
    txd_qty, txd_ordered_qty, txd_received_qty, txd_accepted_qty, txd_requested_qty,
    txd_batch_lot_no, txd_mfg_date, txd_expiry_date, txd_location_id_loc, txd_remark, txd_bls_id_ibm
  ) VALUES (
    v_hdr_cons, 'OPENING_STOCK', 3, v_item, v_uom_btl,
    30, 30, 30, 30, 30,
    NULL, DATE '2025-11-01', DATE '2026-11-01', v_loc_admin, 'Opening — disinfectant bottles', v_bls
  );
  INSERT INTO inv_stock_mst (
    stk_item_id_itm, stk_location_id_loc, stk_batch_lot_no, stk_uom_id_unt, stk_expiry_date,
    stk_opening_qty, stk_inward_qty, stk_current_qty, stk_available_qty, stk_reserved_qty,
    stk_last_txn_header_id_txh, stk_last_transaction_date, stk_isactive, stk_created_by, stk_created_on
  ) VALUES (
    v_item, v_loc_admin, NULL, v_uom_btl, DATE '2026-11-01',
    30, 0, 30, 30, 0, v_hdr_cons, v_today, true, '024-demo-seed', NOW()
  );

  -- SPARE batch
  SELECT itm_item_id INTO v_item FROM inv_item_mst WHERE itm_item_code = 'DEMO-SPARE-01';
  INSERT INTO inv_bls_mst (
    ibm_entity_id_ent, ibm_item_id_itm, ibm_batch_no, ibm_mfg_date,
    ibm_current_location_id_loc, ibm_is_dummy, ibm_isactive, ibm_islocked, ibm_created_by, ibm_created_on
  ) VALUES (
    v_entity, v_item, 'BATCH-SSD-2601', DATE '2026-01-10',
    v_loc_admin, false, true, false, '024-demo-seed', NOW()
  ) RETURNING ibm_bls_id INTO v_bls;
  INSERT INTO txn_detail_dtl (
    txd_txn_header_id_txh, txd_doc_type, txd_sr_no, txd_item_id_itm, txd_uom_id_unt,
    txd_qty, txd_ordered_qty, txd_received_qty, txd_accepted_qty, txd_requested_qty,
    txd_batch_lot_no, txd_mfg_date, txd_location_id_loc, txd_remark, txd_bls_id_ibm
  ) VALUES (
    v_hdr_cons, 'OPENING_STOCK', 4, v_item, v_uom_pcs,
    10, 10, 10, 10, 10,
    'BATCH-SSD-2601', DATE '2026-01-10', v_loc_admin, 'Opening — SSD spares', v_bls
  );
  INSERT INTO inv_stock_mst (
    stk_item_id_itm, stk_location_id_loc, stk_batch_lot_no, stk_uom_id_unt,
    stk_opening_qty, stk_inward_qty, stk_current_qty, stk_available_qty, stk_reserved_qty,
    stk_last_txn_header_id_txh, stk_last_transaction_date, stk_isactive, stk_created_by, stk_created_on
  ) VALUES (
    v_item, v_loc_admin, 'BATCH-SSD-2601', v_uom_pcs,
    10, 0, 10, 10, 0, v_hdr_cons, v_today, true, '024-demo-seed', NOW()
  );

  -- PACK simple qty (dummy BLS)
  SELECT itm_item_id INTO v_item FROM inv_item_mst WHERE itm_item_code = 'DEMO-PACK-01';
  INSERT INTO inv_bls_mst (
    ibm_entity_id_ent, ibm_item_id_itm, ibm_current_location_id_loc,
    ibm_is_dummy, ibm_isactive, ibm_islocked, ibm_created_by, ibm_created_on
  ) VALUES (
    v_entity, v_item, v_loc_admin, true, true, false, '024-demo-seed', NOW()
  ) RETURNING ibm_bls_id INTO v_bls;
  INSERT INTO txn_detail_dtl (
    txd_txn_header_id_txh, txd_doc_type, txd_sr_no, txd_item_id_itm, txd_uom_id_unt,
    txd_qty, txd_ordered_qty, txd_received_qty, txd_accepted_qty, txd_requested_qty,
    txd_mfg_date, txd_location_id_loc, txd_remark, txd_bls_id_ibm
  ) VALUES (
    v_hdr_cons, 'OPENING_STOCK', 5, v_item, v_uom_box,
    100, 100, 100, 100, 100,
    DATE '2026-02-01', v_loc_admin, 'Opening — carton boxes', v_bls
  );
  INSERT INTO inv_stock_mst (
    stk_item_id_itm, stk_location_id_loc, stk_batch_lot_no, stk_uom_id_unt,
    stk_opening_qty, stk_inward_qty, stk_current_qty, stk_available_qty, stk_reserved_qty,
    stk_last_txn_header_id_txh, stk_last_transaction_date, stk_isactive, stk_created_by, stk_created_on
  ) VALUES (
    v_item, v_loc_admin, NULL, v_uom_box,
    100, 0, 100, 100, 0, v_hdr_cons, v_today, true, '024-demo-seed', NOW()
  );

  UPDATE txn_header_mst
  SET txh_party_id_vnd = v_vendor,
      txh_total_accepted_qty = 210,
      txh_total_received_qty = 210,
      txh_total_ordered_qty = 210
  WHERE txh_txn_header_id = v_hdr_cons;

  RAISE NOTICE '024: seeded 10 DEMO items + OST-DEMO-ASSET + OST-DEMO-CONS at location %', v_loc_admin;
END $$;
