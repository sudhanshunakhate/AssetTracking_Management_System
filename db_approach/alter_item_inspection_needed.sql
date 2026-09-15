-- CAITS — Add inspection_needed flag on items
SET search_path TO caits_local;

ALTER TABLE inv_item_mst
    ADD COLUMN IF NOT EXISTS itm_inspection_needed boolean DEFAULT FALSE;

UPDATE inv_item_mst
SET itm_inspection_needed = FALSE
WHERE itm_inspection_needed IS NULL;

COMMENT ON COLUMN inv_item_mst.itm_inspection_needed IS 'When true, item requires inspection on receipt / inward';
