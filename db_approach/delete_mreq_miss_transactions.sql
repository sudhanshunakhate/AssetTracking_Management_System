-- 023: Delete Store Requisition (MATERIAL_REQUISITION / MREQ|STRQ) and
-- Store Issue (MATERIAL_ISSUE / MISS|STIS) documents from transaction tables.
-- Re-runnable: no-ops when none remain.
-- Also restores stock for Issued issues (qty was deducted on submit) and clears
-- stock last-txn pointers so FKs do not block the delete.

SET search_path TO caits_local;

DO $$
DECLARE
  hdr_ids integer[];
  n_hdr integer := 0;
  n_dtl integer := 0;
  n_stock_restored integer := 0;
BEGIN
  SELECT COALESCE(array_agg(txh_txn_header_id), ARRAY[]::integer[])
  INTO hdr_ids
  FROM txn_header_mst
  WHERE txh_doc_type IN ('MATERIAL_REQUISITION', 'MATERIAL_ISSUE');

  n_hdr := COALESCE(cardinality(hdr_ids), 0);
  IF n_hdr = 0 THEN
    RAISE NOTICE '023: no MATERIAL_REQUISITION / MATERIAL_ISSUE headers — nothing to delete';
    RETURN;
  END IF;

  -- Restore stock for Issued store issues (outbound −qty on submit).
  WITH issue_lines AS (
    SELECT
      d.txd_item_id_itm AS item_id,
      COALESCE(d.txd_location_id_loc, h.txh_location_id_loc) AS location_id,
      d.txd_uom_id_unt AS uom_id,
      NULLIF(btrim(COALESCE(d.txd_batch_lot_no, d.txd_serial_no, '')), '') AS batch_key,
      COALESCE(d.txd_qty, d.txd_accepted_qty, d.txd_received_qty, 0) AS qty
    FROM txn_detail_dtl d
    JOIN txn_header_mst h ON h.txh_txn_header_id = d.txd_txn_header_id_txh
    WHERE h.txh_doc_type = 'MATERIAL_ISSUE'
      AND UPPER(COALESCE(h.txh_status, '')) = 'ISSUED'
      AND d.txd_item_id_itm IS NOT NULL
      AND COALESCE(d.txd_location_id_loc, h.txh_location_id_loc) IS NOT NULL
      AND COALESCE(d.txd_qty, d.txd_accepted_qty, d.txd_received_qty, 0) > 0
  ),
  upd AS (
    UPDATE inv_stock_mst s
    SET
      stk_current_qty = COALESCE(s.stk_current_qty, 0) + il.qty,
      stk_available_qty = COALESCE(s.stk_available_qty, 0) + il.qty,
      stk_issued_qty = GREATEST(COALESCE(s.stk_issued_qty, 0) - il.qty, 0),
      stk_modified_on = NOW(),
      stk_modified_by = '023-delete-mreq-miss'
    FROM issue_lines il
    WHERE s.stk_item_id_itm = il.item_id
      AND s.stk_location_id_loc = il.location_id
      AND (
        (il.batch_key IS NULL AND (s.stk_batch_lot_no IS NULL OR btrim(s.stk_batch_lot_no) = ''))
        OR (il.batch_key IS NOT NULL AND lower(btrim(COALESCE(s.stk_batch_lot_no, ''))) = lower(il.batch_key))
      )
      AND COALESCE(s.stk_isactive, true)
    RETURNING s.stk_stock_id
  )
  SELECT COUNT(*) INTO n_stock_restored FROM upd;

  -- Clear last-txn pointers on stock
  UPDATE inv_stock_mst
  SET stk_last_txn_header_id_txh = NULL
  WHERE stk_last_txn_header_id_txh = ANY (hdr_ids);

  -- Break self-refs (issues → requisitions) before header delete
  UPDATE txn_header_mst
  SET txh_ref_txn_header_id_txh = NULL
  WHERE txh_ref_txn_header_id_txh = ANY (hdr_ids);

  -- Also clear refs from any other doc type pointing at these headers
  UPDATE txn_header_mst
  SET txh_ref_txn_header_id_txh = NULL
  WHERE txh_txn_header_id <> ALL (hdr_ids)
    AND txh_ref_txn_header_id_txh = ANY (hdr_ids);

  DELETE FROM txn_detail_dtl
  WHERE txd_txn_header_id_txh = ANY (hdr_ids);
  GET DIAGNOSTICS n_dtl = ROW_COUNT;

  DELETE FROM txn_header_mst
  WHERE txh_txn_header_id = ANY (hdr_ids);

  RAISE NOTICE '023: deleted % header(s), % line(s); restored stock on % row(s)',
    n_hdr, n_dtl, n_stock_restored;
END $$;
