-- 053: Copy missing vendors + items (+ item OU/location maps) from caits_local into caits.
-- Remaps FKs by business codes. Does not copy stock / BLS / transactions. Safe to re-run.

-- ---------------------------------------------------------------------------
-- Vendors
-- ---------------------------------------------------------------------------
INSERT INTO caits.inv_vendor_mst (
    vnd_vendor_code, vnd_vendor_name, vnd_party_type,
    vnd_gstin, vnd_pan_no, vnd_rating,
    vnd_add1, vnd_add2, vnd_city, vnd_state, vnd_pin, vnd_country,
    vnd_contact_person, vnd_phone, vnd_alt_phone, vnd_email, vnd_website, vnd_notes,
    vnd_isactive, vnd_created_by, vnd_created_on, vnd_modified_by, vnd_modified_on
)
SELECT
    src.vnd_vendor_code,
    src.vnd_vendor_name,
    src.vnd_party_type,
    src.vnd_gstin,
    src.vnd_pan_no,
    src.vnd_rating,
    src.vnd_add1,
    src.vnd_add2,
    src.vnd_city,
    src.vnd_state,
    src.vnd_pin,
    src.vnd_country,
    src.vnd_contact_person,
    src.vnd_phone,
    src.vnd_alt_phone,
    src.vnd_email,
    src.vnd_website,
    src.vnd_notes,
    COALESCE(src.vnd_isactive, TRUE),
    COALESCE(src.vnd_created_by, 'system'),
    COALESCE(src.vnd_created_on, NOW()),
    src.vnd_modified_by,
    src.vnd_modified_on
FROM caits_local.inv_vendor_mst src
WHERE NOT EXISTS (
    SELECT 1 FROM caits.inv_vendor_mst t
    WHERE UPPER(t.vnd_vendor_code) = UPPER(src.vnd_vendor_code)
);

-- ---------------------------------------------------------------------------
-- Items (map category / subcategory / UOM / location / entity by codes)
-- ---------------------------------------------------------------------------
INSERT INTO caits.inv_item_mst (
    itm_item_code, itm_item_name, itm_item_type,
    itm_category_id_cat, itm_subcategory_id_scat, itm_uom_id_unt,
    itm_standard_cost, itm_image_url, itm_desc, itm_remarks,
    itm_asset_type, itm_make_brand, itm_model, itm_useful_life_years,
    itm_depreciation_method, itm_depreciation_rate,
    itm_current_location_id_loc,
    itm_is_serialized, itm_is_returnable, itm_is_under_amc, itm_is_insurance_required,
    itm_consumable_type, itm_track_batch_lot, itm_track_expiry, itm_is_consumable,
    itm_allow_negative_stock, itm_isactive,
    itm_created_by, itm_created_on, itm_modified_by, itm_modified_on,
    itm_inspection_needed, itm_ram, itm_storage, itm_processor, itm_product_no,
    itm_entity_id_ent, itm_bu_access_scope, itm_location_access_scope
)
SELECT
    src.itm_item_code,
    src.itm_item_name,
    src.itm_item_type,
    dc.cat_category_id,
    ds.scat_subcategory_id,
    du.unt_unit_id,
    src.itm_standard_cost,
    src.itm_image_url,
    src.itm_desc,
    src.itm_remarks,
    src.itm_asset_type,
    src.itm_make_brand,
    src.itm_model,
    src.itm_useful_life_years,
    src.itm_depreciation_method,
    src.itm_depreciation_rate,
    dl.loc_location_id,
    COALESCE(src.itm_is_serialized, FALSE),
    COALESCE(src.itm_is_returnable, FALSE),
    COALESCE(src.itm_is_under_amc, FALSE),
    COALESCE(src.itm_is_insurance_required, FALSE),
    src.itm_consumable_type,
    COALESCE(src.itm_track_batch_lot, FALSE),
    COALESCE(src.itm_track_expiry, FALSE),
    COALESCE(src.itm_is_consumable, FALSE),
    COALESCE(src.itm_allow_negative_stock, FALSE),
    COALESCE(src.itm_isactive, TRUE),
    COALESCE(src.itm_created_by, 'system'),
    COALESCE(src.itm_created_on, NOW()),
    src.itm_modified_by,
    src.itm_modified_on,
    COALESCE(src.itm_inspection_needed, FALSE),
    src.itm_ram,
    src.itm_storage,
    src.itm_processor,
    src.itm_product_no,
    e.ent_entity_id,
    COALESCE(src.itm_bu_access_scope, 'ALL'),
    COALESCE(src.itm_location_access_scope, 'ALL')
FROM caits_local.inv_item_mst src
LEFT JOIN caits_local.category_mst sc ON sc.cat_category_id = src.itm_category_id_cat
LEFT JOIN caits.category_mst dc ON dc.cat_category_code IS NOT NULL
     AND UPPER(dc.cat_category_code) = UPPER(sc.cat_category_code)
LEFT JOIN caits_local.subcategory_mst ss ON ss.scat_subcategory_id = src.itm_subcategory_id_scat
LEFT JOIN caits.subcategory_mst ds ON ds.scat_subcategory_code IS NOT NULL
     AND UPPER(ds.scat_subcategory_code) = UPPER(ss.scat_subcategory_code)
LEFT JOIN caits_local.unit_mst su ON su.unt_unit_id = src.itm_uom_id_unt
LEFT JOIN caits.unit_mst du ON du.unt_unit_code IS NOT NULL
     AND UPPER(du.unt_unit_code) = UPPER(su.unt_unit_code)
LEFT JOIN caits_local.org_location_mst sl ON sl.loc_location_id = src.itm_current_location_id_loc
LEFT JOIN caits.org_location_mst dl ON dl.loc_location_code IS NOT NULL
     AND UPPER(dl.loc_location_code) = UPPER(sl.loc_location_code)
CROSS JOIN LATERAL (
    SELECT ent_entity_id
    FROM caits.org_entity_mst
    WHERE ent_isactive = TRUE
    ORDER BY ent_entity_id
    LIMIT 1
) e
WHERE NOT EXISTS (
    SELECT 1 FROM caits.inv_item_mst t
    WHERE UPPER(t.itm_item_code) = UPPER(src.itm_item_code)
);

-- Item ↔ OU mappings
INSERT INTO caits.inv_item_bu_mapping_dtl (iibm_item_id_itm, iibm_bu_id_bu)
SELECT di.itm_item_id, db.bu_bu_id
FROM caits_local.inv_item_bu_mapping_dtl src
JOIN caits_local.inv_item_mst si ON si.itm_item_id = src.iibm_item_id_itm
JOIN caits.inv_item_mst di ON UPPER(di.itm_item_code) = UPPER(si.itm_item_code)
JOIN caits_local.org_businessunit_mst sb ON sb.bu_bu_id = src.iibm_bu_id_bu
JOIN caits.org_businessunit_mst db ON UPPER(db.bu_bu_code) = UPPER(sb.bu_bu_code)
WHERE NOT EXISTS (
    SELECT 1 FROM caits.inv_item_bu_mapping_dtl t
    WHERE t.iibm_item_id_itm = di.itm_item_id AND t.iibm_bu_id_bu = db.bu_bu_id
);

-- Item ↔ location mappings
INSERT INTO caits.inv_item_location_mapping_dtl (ilim_item_id_itm, ilim_location_id_loc)
SELECT di.itm_item_id, dl.loc_location_id
FROM caits_local.inv_item_location_mapping_dtl src
JOIN caits_local.inv_item_mst si ON si.itm_item_id = src.ilim_item_id_itm
JOIN caits.inv_item_mst di ON UPPER(di.itm_item_code) = UPPER(si.itm_item_code)
JOIN caits_local.org_location_mst sl ON sl.loc_location_id = src.ilim_location_id_loc
JOIN caits.org_location_mst dl ON UPPER(dl.loc_location_code) = UPPER(sl.loc_location_code)
WHERE NOT EXISTS (
    SELECT 1 FROM caits.inv_item_location_mapping_dtl t
    WHERE t.ilim_item_id_itm = di.itm_item_id AND t.ilim_location_id_loc = dl.loc_location_id
);
