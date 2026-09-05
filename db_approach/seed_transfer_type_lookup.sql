-- Transfer Type lookup for Material Transfer + Gatepass Outward (txh_doc_subtype).
-- Codes match what the app persists: INTERNAL | OU  (legacy OPR is treated as OU in code).

SET search_path TO caits_local;

INSERT INTO gentype_mst (gtyp_type_code, gtyp_type_name, gtyp_desc, gtyp_isactive, gtyp_created_by, gtyp_created_on)
SELECT v.code, v.name, v.descr, TRUE, 'system', NOW()
FROM (VALUES
    ('GTY-TRFTYPE', 'Transfer Type', 'Internal vs OU transfer — used on Material Transfer and Gatepass Outward')
) AS v(code, name, descr)
WHERE NOT EXISTS (
    SELECT 1 FROM gentype_mst t WHERE UPPER(t.gtyp_type_code) = UPPER(v.code)
);

INSERT INTO genmaster_mst (
    gmst_value_code, gmst_value_name, gmst_gentype_id_gtyp, gmst_sort_order, gmst_desc,
    gmst_isactive, gmst_created_by, gmst_created_on
)
SELECT v.code, v.name, t.gtyp_gentype_id, v.sort_ord, v.descr, TRUE, 'system', NOW()
FROM (VALUES
    ('INTERNAL', 'Internal Transfer', 1, 'Same-OU store-to-store transfer'),
    ('OU',       'OU Transfer',       2, 'Cross operating-unit transfer (requires outward gatepass)')
) AS v(code, name, sort_ord, descr)
JOIN gentype_mst t ON UPPER(t.gtyp_type_code) = 'GTY-TRFTYPE'
WHERE NOT EXISTS (
    SELECT 1
    FROM genmaster_mst g
    WHERE g.gmst_gentype_id_gtyp = t.gtyp_gentype_id
      AND UPPER(g.gmst_value_code) = UPPER(v.code)
);

SELECT t.gtyp_type_code, g.gmst_value_code, g.gmst_value_name, g.gmst_sort_order
FROM genmaster_mst g
JOIN gentype_mst t ON t.gtyp_gentype_id = g.gmst_gentype_id_gtyp
WHERE t.gtyp_type_code = 'GTY-TRFTYPE'
ORDER BY g.gmst_sort_order;
