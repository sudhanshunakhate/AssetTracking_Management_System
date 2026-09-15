-- CAITS — Drop instance-level columns from inv_item_mst (now owned by inv_bls_mst / txn lines).
-- Keep itm_current_location_id_loc as the item's home / default store for list filtering.
-- Safe to re-run.

SET search_path TO caits_local;

-- Serial uniqueness lived on item master; serials now unique on inv_bls_mst.
DROP INDEX IF EXISTS uq_item_serial_no;
DROP INDEX IF EXISTS ix_item_serial;

ALTER TABLE inv_item_mst
    DROP COLUMN IF EXISTS itm_serial_no,
    DROP COLUMN IF EXISTS itm_purchase_date,
    DROP COLUMN IF EXISTS itm_purchase_cost,
    DROP COLUMN IF EXISTS itm_warranty_expiry,
    DROP COLUMN IF EXISTS itm_assigned_to_emp_id_emp,
    DROP COLUMN IF EXISTS itm_shelf_bin,
    DROP COLUMN IF EXISTS itm_expiry_date,
    DROP COLUMN IF EXISTS itm_batch_lot_no,
    DROP COLUMN IF EXISTS itm_ip_address,
    DROP COLUMN IF EXISTS itm_mac_address,
    DROP COLUMN IF EXISTS itm_ip_assign_mode,
    DROP COLUMN IF EXISTS itm_hostname,
    DROP COLUMN IF EXISTS itm_asset_condition,
    DROP COLUMN IF EXISTS itm_fault_desc;
