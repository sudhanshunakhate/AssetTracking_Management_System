-- 031: Remove DEMO-* masters, all transactions that touch them, and related stock/BLS.
-- Safe to re-run: skips when no DEMO items exist.
-- Does NOT re-seed demo baseline (unlike 025).

SET search_path TO caits_local;

DO $$
DECLARE
  v_item_ids integer[];
  v_hdr_ids integer[];
  v_loc_ids integer[];
  v_loc_fallback integer;
  v_deleted_items integer;
BEGIN
  SELECT COALESCE(array_agg(itm_item_id), ARRAY[]::integer[])
  INTO v_item_ids
  FROM inv_item_mst
  WHERE itm_item_code LIKE 'DEMO-%';

  SELECT COALESCE(array_agg(loc_location_id), ARRAY[]::integer[])
  INTO v_loc_ids
  FROM org_location_mst
  WHERE loc_location_code LIKE 'DEMO-%';

  IF cardinality(v_item_ids) = 0 AND cardinality(v_loc_ids) = 0 THEN
    RAISE NOTICE '031: no DEMO-* items or locations — nothing to delete';
    RETURN;
  END IF;

  SELECT loc_location_id INTO v_loc_fallback
  FROM org_location_mst
  WHERE loc_location_code = 'LOC-002'
  LIMIT 1;
  IF v_loc_fallback IS NULL THEN
    SELECT loc_location_id INTO v_loc_fallback
    FROM org_location_mst
    WHERE COALESCE(loc_isactive, true)
      AND loc_location_code NOT LIKE 'DEMO-%'
    ORDER BY loc_location_id
    LIMIT 1;
  END IF;

  -- Transaction headers tied to demo data
  SELECT COALESCE(array_agg(DISTINCT h.txh_txn_header_id), ARRAY[]::integer[])
  INTO v_hdr_ids
  FROM txn_header_mst h
  WHERE h.txh_doc_no ILIKE '%DEMO%'
     OR COALESCE(h.txh_reference_no, '') ILIKE '%DEMO%'
     OR COALESCE(h.txh_remarks, '') ILIKE '%DEMO-%'
     OR COALESCE(h.txh_remarks, '') ILIKE '%UI demo%'
     OR COALESCE(h.txh_remarks, '') ILIKE '%024 demo%'
     OR (cardinality(v_item_ids) > 0 AND EXISTS (
           SELECT 1 FROM txn_detail_dtl d
           WHERE d.txd_txn_header_id_txh = h.txh_txn_header_id
             AND d.txd_item_id_itm = ANY (v_item_ids)))
     OR (cardinality(v_loc_ids) > 0 AND (
           h.txh_location_id_loc = ANY (v_loc_ids)
           OR h.txh_from_location_id_loc = ANY (v_loc_ids)
           OR h.txh_to_location_id_loc = ANY (v_loc_ids)));

  -- Include inspection approvals / issues linked to demo GRNs
  IF cardinality(v_hdr_ids) > 0 THEN
    SELECT COALESCE(array_agg(DISTINCT h.txh_txn_header_id), ARRAY[]::integer[])
    INTO v_hdr_ids
    FROM txn_header_mst h
    WHERE h.txh_txn_header_id = ANY (v_hdr_ids)
       OR h.txh_ref_txn_header_id_txh = ANY (v_hdr_ids)
       OR h.txh_doc_no ILIKE '%DEMO%'
       OR COALESCE(h.txh_reference_no, '') ILIKE '%DEMO%'
       OR COALESCE(h.txh_remarks, '') ILIKE '%DEMO-%'
       OR COALESCE(h.txh_remarks, '') ILIKE '%UI demo%'
       OR COALESCE(h.txh_remarks, '') ILIKE '%024 demo%'
       OR (cardinality(v_item_ids) > 0 AND EXISTS (
             SELECT 1 FROM txn_detail_dtl d
             WHERE d.txd_txn_header_id_txh = h.txh_txn_header_id
               AND d.txd_item_id_itm = ANY (v_item_ids)))
       OR (cardinality(v_loc_ids) > 0 AND (
             h.txh_location_id_loc = ANY (v_loc_ids)
             OR h.txh_from_location_id_loc = ANY (v_loc_ids)
             OR h.txh_to_location_id_loc = ANY (v_loc_ids)));
  END IF;

  RAISE NOTICE '031: deleting % txn headers, % demo items, % demo locations',
    cardinality(v_hdr_ids), cardinality(v_item_ids), cardinality(v_loc_ids);

  IF cardinality(v_hdr_ids) > 0 THEN
    UPDATE inv_stock_mst
    SET stk_last_txn_header_id_txh = NULL
    WHERE stk_last_txn_header_id_txh = ANY (v_hdr_ids);

    UPDATE txn_header_mst
    SET txh_ref_txn_header_id_txh = NULL
    WHERE txh_ref_txn_header_id_txh = ANY (v_hdr_ids);

    UPDATE txn_detail_dtl
    SET txd_bls_id_ibm = NULL
    WHERE txd_txn_header_id_txh = ANY (v_hdr_ids);

    DELETE FROM txn_detail_dtl
    WHERE txd_txn_header_id_txh = ANY (v_hdr_ids);

    DELETE FROM txn_header_mst
    WHERE txh_txn_header_id = ANY (v_hdr_ids);
  END IF;

  IF cardinality(v_item_ids) > 0 THEN
    UPDATE inv_stock_mst SET stk_last_txn_header_id_txh = NULL
    WHERE stk_item_id_itm = ANY (v_item_ids);

    DELETE FROM inv_stock_mst
    WHERE stk_item_id_itm = ANY (v_item_ids);

    UPDATE txn_detail_dtl SET txd_bls_id_ibm = NULL
    WHERE txd_bls_id_ibm IN (
      SELECT ibm_bls_id FROM inv_bls_mst WHERE ibm_item_id_itm = ANY (v_item_ids)
    );

    DELETE FROM inv_bls_mst
    WHERE ibm_item_id_itm = ANY (v_item_ids);

    UPDATE inv_item_mst SET itm_parent_item_id_itm = NULL
    WHERE itm_parent_item_id_itm = ANY (v_item_ids);

    DELETE FROM inv_item_mst
    WHERE itm_item_id = ANY (v_item_ids);

    GET DIAGNOSTICS v_deleted_items = ROW_COUNT;
    RAISE NOTICE '031: deleted % DEMO items', v_deleted_items;
  END IF;

  IF cardinality(v_loc_ids) > 0 THEN
    DELETE FROM inv_stock_mst
    WHERE stk_location_id_loc = ANY (v_loc_ids);

    DELETE FROM sysm_user_location_mapping_dtl
    WHERE uloc_location_id_loc = ANY (v_loc_ids);

    UPDATE sysm_userlogin_mst
    SET usr_location_id_loc = v_loc_fallback
    WHERE usr_location_id_loc = ANY (v_loc_ids);

    IF v_loc_fallback IS NOT NULL THEN
      UPDATE hrc_employee_mst
      SET emp_base_location_id_loc = v_loc_fallback
      WHERE emp_base_location_id_loc = ANY (v_loc_ids);
    END IF;

    DELETE FROM org_location_mst
    WHERE loc_location_id = ANY (v_loc_ids);
  END IF;

  DELETE FROM inv_vendor_mst
  WHERE vnd_vendor_code LIKE 'DEMO-%';

  DELETE FROM subcategory_mst sc
  WHERE sc.scat_subcategory_code LIKE 'DEMO-%'
    AND NOT EXISTS (
      SELECT 1 FROM inv_item_mst i WHERE i.itm_subcategory_id_scat = sc.scat_subcategory_id
    );

  DELETE FROM category_mst c
  WHERE c.cat_category_code LIKE 'DEMO-%'
    AND NOT EXISTS (
      SELECT 1 FROM inv_item_mst i WHERE i.itm_category_id_cat = c.cat_category_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM subcategory_mst sc WHERE sc.scat_category_id_cat = c.cat_category_id
    );

  DELETE FROM unit_mst u
  WHERE u.unt_unit_code LIKE 'DEMO-%'
    AND NOT EXISTS (
      SELECT 1 FROM inv_item_mst i WHERE i.itm_uom_id_unt = u.unt_unit_id
    );

  DELETE FROM org_businessunit_mst bu
  WHERE bu.bu_bu_code LIKE 'DEMO-%'
    AND NOT EXISTS (
      SELECT 1 FROM org_location_mst l WHERE l.loc_bu_id_bu = bu.bu_bu_id
    );

  DELETE FROM org_entity_mst ent
  WHERE ent.ent_entity_code LIKE 'DEMO-%'
    AND NOT EXISTS (
      SELECT 1 FROM org_businessunit_mst bu WHERE bu.bu_entity_id_ent = ent.ent_entity_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM org_location_mst l WHERE l.loc_entity_id_ent = ent.ent_entity_id
    );

  RAISE NOTICE '031: demo data cleanup complete';
END $$;
