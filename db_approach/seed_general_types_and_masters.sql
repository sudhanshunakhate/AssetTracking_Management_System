-- CAITS — Seed General Types + General Masters (lookup parameters)
-- Schema: caits_local
-- Safe to re-run: inserts only when code is missing

SET search_path TO caits_local;

-- ---------------------------------------------------------------------------
-- 1) General Types (lookup groups)
-- ---------------------------------------------------------------------------
INSERT INTO gentype_mst (
    gtyp_type_code, gtyp_type_name, gtyp_desc,
    gtyp_isactive, gtyp_created_by, gtyp_created_on
)
SELECT v.code, v.name, v.descr, TRUE, 'system', NOW()
FROM (VALUES
    ('GTY-ITMPAR', 'Item Parameters',
     'Item classification used across masters and transactions — Asset vs Consumable'),
    ('GTY-RCPT',   'Receipt Purpose',
     'Purpose of material receipt (GRN / inward). Description carries Returnable / Non-Returnable rule'),
    ('GTY-ISSUE',  'Issue Purpose',
     'Purpose of material issue / store issue. Description carries Returnable / Non-Returnable rule'),
    ('GTY-IMR',    'Internal Material Return Reasons',
     'Standard reasons for internal material return'),
    ('GTY-STRLOC', 'Store Locations',
     'Standard store location types (Main / Damaged / Rejected)')
) AS v(code, name, descr)
WHERE NOT EXISTS (
    SELECT 1 FROM gentype_mst t WHERE UPPER(t.gtyp_type_code) = UPPER(v.code)
);

-- ---------------------------------------------------------------------------
-- 2) General Masters (values under each type)
--    gmst_desc stores returnable rule where applicable:
--      NON_RETURNABLE | RETURNABLE | RETURNABLE_OR_NON_RETURNABLE | N/A
-- ---------------------------------------------------------------------------
INSERT INTO genmaster_mst (
    gmst_value_code, gmst_value_name, gmst_gentype_id_gtyp,
    gmst_sort_order, gmst_desc, gmst_isactive, gmst_created_by, gmst_created_on
)
SELECT
    v.code,
    v.name,
    t.gtyp_gentype_id,
    v.sort_no,
    v.descr,
    TRUE,
    'system',
    NOW()
FROM (VALUES
    -- Item Parameters (GTY-ITMPAR)
    ('GTY-ITMPAR', 'GNM-ASSET',  'Assets',     1, 'Item parameter: Asset / fixed asset'),
    ('GTY-ITMPAR', 'GNM-CONS',   'Consumable', 2, 'Item parameter: Consumable / inventory'),

    -- Receipt Purpose (GTY-RCPT)
    ('GTY-RCPT', 'GNM-OWN',   'Own material', 1, 'NON_RETURNABLE — Own material receipt'),
    ('GTY-RCPT', 'GNM-LOAN',  'On loan',      2, 'RETURNABLE — Material received on loan'),
    ('GTY-RCPT', 'GNM-SAMP',  'Sample',       3, 'RETURNABLE_OR_NON_RETURNABLE — Sample receipt'),
    ('GTY-RCPT', 'GNM-TRIAL', 'Trial',        4, 'RETURNABLE — Trial material'),
    ('GTY-RCPT', 'GNM-STBY',  'Standby',      5, 'RETURNABLE_OR_NON_RETURNABLE — Standby material'),

    -- Issue Purpose (GTY-ISSUE)
    ('GTY-ISSUE', 'GNM-CONSMP',  'For consumption', 1, 'NON_RETURNABLE — Issue for consumption'),
    ('GTY-ISSUE', 'GNM-USE',     'For Use',         2, 'N/A — For Use (in case of Assets)'),
    ('GTY-ISSUE', 'GNM-REPAIR',  'For Repairs',     3, 'RETURNABLE — Issue for repairs'),
    ('GTY-ISSUE', 'GNM-LOANRET', 'Loan Return',     4, 'N/A — Loan return issue'),
    ('GTY-ISSUE', 'GNM-SAMPRET', 'Sample Return',   5, 'RETURNABLE — Sample return'),
    ('GTY-ISSUE', 'GNM-SALE',    'For sale',        6, 'N/A — Issue for sale'),
    ('GTY-ISSUE', 'GNM-SCRAP',   'For Scrap',       7, 'N/A — Issue for scrap'),

    -- Internal Material Return Reasons (GTY-IMR)
    ('GTY-IMR', 'GNM-DMG',  'Damaged',     1, 'Internal return reason: Damaged'),
    ('GTY-IMR', 'GNM-REPL', 'Replacement', 2, 'Internal return reason: Replacement'),
    ('GTY-IMR', 'GNM-REJ',  'Rejected',    3, 'Internal return reason: Rejected'),

    -- Store Locations (GTY-STRLOC)
    ('GTY-STRLOC', 'GNM-MAIN',  'Main Stores',     1, 'Store location type: Main Stores'),
    ('GTY-STRLOC', 'GNM-DMGST', 'Damaged Stores',  2, 'Store location type: Damaged Stores'),
    ('GTY-STRLOC', 'GNM-REJST', 'Rejected Stores', 3, 'Store location type: Rejected Stores')
) AS v(type_code, code, name, sort_no, descr)
JOIN gentype_mst t ON UPPER(t.gtyp_type_code) = UPPER(v.type_code)
WHERE NOT EXISTS (
    SELECT 1
    FROM genmaster_mst m
    WHERE UPPER(m.gmst_value_code) = UPPER(v.code)
      AND m.gmst_gentype_id_gtyp = t.gtyp_gentype_id
);

-- Verification
SELECT 'gentypes' AS kind, COUNT(*) AS cnt
FROM gentype_mst
WHERE gtyp_type_code IN ('GTY-ITMPAR','GTY-RCPT','GTY-ISSUE','GTY-IMR','GTY-STRLOC')
UNION ALL
SELECT 'genmasters', COUNT(*)
FROM genmaster_mst m
JOIN gentype_mst t ON t.gtyp_gentype_id = m.gmst_gentype_id_gtyp
WHERE t.gtyp_type_code IN ('GTY-ITMPAR','GTY-RCPT','GTY-ISSUE','GTY-IMR','GTY-STRLOC')
ORDER BY 1;

SELECT t.gtyp_type_code AS type_code, t.gtyp_type_name AS type_name,
       m.gmst_value_code AS value_code, m.gmst_value_name AS value_name,
       m.gmst_sort_order AS sort_order, m.gmst_desc AS description
FROM genmaster_mst m
JOIN gentype_mst t ON t.gtyp_gentype_id = m.gmst_gentype_id_gtyp
WHERE t.gtyp_type_code IN ('GTY-ITMPAR','GTY-RCPT','GTY-ISSUE','GTY-IMR','GTY-STRLOC')
ORDER BY t.gtyp_type_code, m.gmst_sort_order;
