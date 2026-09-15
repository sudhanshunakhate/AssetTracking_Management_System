-- Instance-unique attributes captured on transaction lines (not Item Master).
-- When receiving / opening N units of an asset, each unit is its own line.

ALTER TABLE caits_local.txn_detail_dtl
    ADD COLUMN IF NOT EXISTS txd_serial_no VARCHAR(100);

ALTER TABLE caits_local.txn_detail_dtl
    ADD COLUMN IF NOT EXISTS txd_ip_address VARCHAR(45);

ALTER TABLE caits_local.txn_detail_dtl
    ADD COLUMN IF NOT EXISTS txd_mac_address VARCHAR(17);

ALTER TABLE caits_local.txn_detail_dtl
    ADD COLUMN IF NOT EXISTS txd_hostname VARCHAR(150);

CREATE INDEX IF NOT EXISTS ix_txn_detail_serial_lower
    ON caits_local.txn_detail_dtl (lower(btrim(txd_serial_no)))
    WHERE txd_serial_no IS NOT NULL AND btrim(txd_serial_no) <> '';
