-- 049: Copy reference lookups (gentype / genmaster) into empty schema caits from caits_local.
-- Does NOT copy business/transaction data. Safe to re-run.

-- 1) Types missing in caits
INSERT INTO caits.gentype_mst (
    gtyp_type_code, gtyp_type_name, gtyp_desc,
    gtyp_isactive, gtyp_created_by, gtyp_created_on,
    gtyp_modified_by, gtyp_modified_on
)
SELECT
    src.gtyp_type_code,
    src.gtyp_type_name,
    src.gtyp_desc,
    src.gtyp_isactive,
    COALESCE(src.gtyp_created_by, 'system'),
    COALESCE(src.gtyp_created_on, NOW()),
    src.gtyp_modified_by,
    src.gtyp_modified_on
FROM caits_local.gentype_mst src
WHERE NOT EXISTS (
    SELECT 1
    FROM caits.gentype_mst t
    WHERE UPPER(t.gtyp_type_code) = UPPER(src.gtyp_type_code)
);

-- 2) Master values — map by type code so new identity IDs still link correctly
INSERT INTO caits.genmaster_mst (
    gmst_gentype_id_gtyp, gmst_value_code, gmst_value_name, gmst_desc,
    gmst_sort_order, gmst_isactive, gmst_created_by, gmst_created_on,
    gmst_modified_by, gmst_modified_on
)
SELECT
    dest_type.gtyp_gentype_id,
    src.gmst_value_code,
    src.gmst_value_name,
    src.gmst_desc,
    src.gmst_sort_order,
    src.gmst_isactive,
    COALESCE(src.gmst_created_by, 'system'),
    COALESCE(src.gmst_created_on, NOW()),
    src.gmst_modified_by,
    src.gmst_modified_on
FROM caits_local.genmaster_mst src
JOIN caits_local.gentype_mst src_type
  ON src_type.gtyp_gentype_id = src.gmst_gentype_id_gtyp
JOIN caits.gentype_mst dest_type
  ON UPPER(dest_type.gtyp_type_code) = UPPER(src_type.gtyp_type_code)
WHERE NOT EXISTS (
    SELECT 1
    FROM caits.genmaster_mst m
    WHERE UPPER(m.gmst_value_code) = UPPER(src.gmst_value_code)
);
