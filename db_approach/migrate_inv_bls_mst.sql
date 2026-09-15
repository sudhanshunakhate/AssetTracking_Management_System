-- Batch / Lot / Serial register (BLS).
-- Item Master stays catalog-only; each physical unit or batch is a row here.
-- Non-tracked items get one reusable dummy BLS (ibm_is_dummy = true).

CREATE TABLE IF NOT EXISTS caits_local.inv_bls_mst (
    ibm_bls_id              SERIAL PRIMARY KEY,
    ibm_entity_id_ent       INTEGER REFERENCES caits_local.org_entity_mst (ent_entity_id),
    ibm_item_id_itm         INTEGER NOT NULL REFERENCES caits_local.inv_item_mst (itm_item_id),
    ibm_batch_no            VARCHAR(50),
    ibm_lot_no              VARCHAR(50),
    ibm_serial_no           VARCHAR(100),
    ibm_mfg_date            DATE,
    ibm_expiry_date         DATE,
    ibm_best_before_date    DATE,
    ibm_ip_address          VARCHAR(45),
    ibm_mac_address         VARCHAR(17),
    ibm_hostname            VARCHAR(150),
    ibm_item_condition      VARCHAR(50),
    ibm_current_location_id_loc INTEGER REFERENCES caits_local.org_location_mst (loc_location_id),
    ibm_is_dummy            BOOLEAN NOT NULL DEFAULT FALSE,
    ibm_isactive            BOOLEAN NOT NULL DEFAULT TRUE,
    ibm_islocked            BOOLEAN NOT NULL DEFAULT FALSE,
    ibm_locked_reason       VARCHAR(200),
    ibm_locked_on           TIMESTAMP,
    ibm_created_by          VARCHAR(50),
    ibm_created_on          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ibm_modified_by         VARCHAR(50),
    ibm_modified_on         TIMESTAMP
);

-- One live serial number globally (when present).
CREATE UNIQUE INDEX IF NOT EXISTS uq_bls_serial_no
    ON caits_local.inv_bls_mst (lower(btrim(ibm_serial_no)))
    WHERE ibm_serial_no IS NOT NULL AND btrim(ibm_serial_no) <> '' AND ibm_isactive = TRUE;

-- One dummy BLS per item (shared by all non-tracked stock of that item).
CREATE UNIQUE INDEX IF NOT EXISTS uq_bls_dummy_per_item
    ON caits_local.inv_bls_mst (ibm_item_id_itm)
    WHERE ibm_is_dummy = TRUE AND ibm_isactive = TRUE;

-- Active batch per item (when batch is used without serial).
CREATE UNIQUE INDEX IF NOT EXISTS uq_bls_item_batch
    ON caits_local.inv_bls_mst (ibm_item_id_itm, lower(btrim(ibm_batch_no)))
    WHERE ibm_batch_no IS NOT NULL AND btrim(ibm_batch_no) <> ''
      AND (ibm_serial_no IS NULL OR btrim(ibm_serial_no) = '')
      AND ibm_is_dummy = FALSE
      AND ibm_isactive = TRUE;

CREATE INDEX IF NOT EXISTS ix_bls_item ON caits_local.inv_bls_mst (ibm_item_id_itm);
CREATE INDEX IF NOT EXISTS ix_bls_location ON caits_local.inv_bls_mst (ibm_current_location_id_loc);

-- Link each transaction line to the BLS it created / used.
ALTER TABLE caits_local.txn_detail_dtl
    ADD COLUMN IF NOT EXISTS txd_bls_id_ibm INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_txn_detail_bls'
    ) THEN
        ALTER TABLE caits_local.txn_detail_dtl
            ADD CONSTRAINT fk_txn_detail_bls
            FOREIGN KEY (txd_bls_id_ibm) REFERENCES caits_local.inv_bls_mst (ibm_bls_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_txn_detail_bls ON caits_local.txn_detail_dtl (txd_bls_id_ibm);
