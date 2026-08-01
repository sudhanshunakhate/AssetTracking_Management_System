-- CAITS — Item Master gap fields from "Assets Office Detail" workbook
-- Adds hardware specs, network identity, condition/disposition and peripheral linkage.
-- Schema: caits_local
-- Safe to re-run.

SET search_path TO caits_local;

-- ---------------------------------------------------------------------------
-- 1) Item columns
-- ---------------------------------------------------------------------------
ALTER TABLE inv_item_mst
    -- Hardware specification
    ADD COLUMN IF NOT EXISTS itm_ram              varchar(50),
    ADD COLUMN IF NOT EXISTS itm_storage          varchar(100),
    ADD COLUMN IF NOT EXISTS itm_processor        varchar(100),
    ADD COLUMN IF NOT EXISTS itm_product_no       varchar(100),
    -- Network identity
    ADD COLUMN IF NOT EXISTS itm_ip_address       varchar(45),
    ADD COLUMN IF NOT EXISTS itm_mac_address      varchar(50),
    ADD COLUMN IF NOT EXISTS itm_ip_assign_mode   varchar(20),
    ADD COLUMN IF NOT EXISTS itm_hostname         varchar(150),
    -- Condition / disposition
    ADD COLUMN IF NOT EXISTS itm_asset_condition  varchar(50),
    ADD COLUMN IF NOT EXISTS itm_fault_desc       text,
    -- Peripheral / component linkage (monitor, keyboard, salvaged parts)
    ADD COLUMN IF NOT EXISTS itm_parent_item_id_itm integer;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_item_parent_item'
    ) THEN
        ALTER TABLE inv_item_mst
            ADD CONSTRAINT fk_item_parent_item
            FOREIGN KEY (itm_parent_item_id_itm) REFERENCES inv_item_mst (itm_item_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_item_parent ON inv_item_mst (itm_parent_item_id_itm);
CREATE INDEX IF NOT EXISTS ix_item_serial ON inv_item_mst (itm_serial_no);

COMMENT ON COLUMN inv_item_mst.itm_ram IS 'Installed RAM, e.g. 16 GB';
COMMENT ON COLUMN inv_item_mst.itm_storage IS 'Installed storage, e.g. 512GB SSD (NVMe)';
COMMENT ON COLUMN inv_item_mst.itm_product_no IS 'Manufacturer product number, distinct from serial no';
COMMENT ON COLUMN inv_item_mst.itm_ip_assign_mode IS 'Static or DHCP';
COMMENT ON COLUMN inv_item_mst.itm_asset_condition IS 'In Stock / Issued / In Custody / Faulty / Under Repair / Scrap / Dead';
COMMENT ON COLUMN inv_item_mst.itm_parent_item_id_itm IS 'Parent asset when this item is an attached peripheral or component';

-- ---------------------------------------------------------------------------
-- 2) Lookups — Asset Condition + IP Assignment Mode
-- ---------------------------------------------------------------------------
INSERT INTO gentype_mst (
    gtyp_type_code, gtyp_type_name, gtyp_desc,
    gtyp_isactive, gtyp_created_by, gtyp_created_on
)
SELECT v.code, v.name, v.descr, TRUE, 'system', NOW()
FROM (VALUES
    ('GTY-ASSETCOND', 'Asset Condition',
     'Physical condition / disposition of an asset'),
    ('GTY-IPMODE',    'IP Assignment Mode',
     'Static or DHCP IP allocation')
) AS v(code, name, descr)
WHERE NOT EXISTS (
    SELECT 1 FROM gentype_mst t WHERE UPPER(t.gtyp_type_code) = UPPER(v.code)
);

INSERT INTO genmaster_mst (
    gmst_value_code, gmst_value_name, gmst_gentype_id_gtyp,
    gmst_sort_order, gmst_desc, gmst_isactive, gmst_created_by, gmst_created_on
)
SELECT v.code, v.name, t.gtyp_gentype_id, v.sort_no, v.descr, TRUE, 'system', NOW()
FROM (VALUES
    ('GTY-ASSETCOND', 'AC-INSTOCK',  'In Stock',     1, 'Asset condition'),
    ('GTY-ASSETCOND', 'AC-ISSUED',   'Issued',       2, 'Asset condition'),
    ('GTY-ASSETCOND', 'AC-CUSTODY',  'In Custody',   3, 'Asset condition'),
    ('GTY-ASSETCOND', 'AC-FAULTY',   'Faulty',       4, 'Asset condition'),
    ('GTY-ASSETCOND', 'AC-REPAIR',   'Under Repair', 5, 'Asset condition'),
    ('GTY-ASSETCOND', 'AC-SCRAP',    'Scrap',        6, 'Asset condition'),
    ('GTY-ASSETCOND', 'AC-DEAD',     'Dead',         7, 'Asset condition'),
    ('GTY-IPMODE',    'IPM-STATIC',  'Static',       1, 'IP assignment mode'),
    ('GTY-IPMODE',    'IPM-DHCP',    'DHCP',         2, 'IP assignment mode')
) AS v(type_code, code, name, sort_no, descr)
JOIN gentype_mst t ON UPPER(t.gtyp_type_code) = UPPER(v.type_code)
WHERE NOT EXISTS (
    SELECT 1 FROM genmaster_mst g WHERE UPPER(g.gmst_value_code) = UPPER(v.code)
);
