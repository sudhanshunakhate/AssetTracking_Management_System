-- CAITS — Extended General Types + Masters for all hardcoded dropdowns (except State)
-- Schema: caits_local
-- Safe to re-run: inserts only when type/value code is missing
-- NOTE: gmst_value_code is UNIQUE globally — all codes are prefixed per type
-- API: GET /api/v1/general-types/{typeCode}/values
--      GET /api/v1/general-masters?typeCode={typeCode}

SET search_path TO caits_local;

-- ---------------------------------------------------------------------------
-- 1) General Types
-- ---------------------------------------------------------------------------
INSERT INTO gentype_mst (
    gtyp_type_code, gtyp_type_name, gtyp_desc,
    gtyp_isactive, gtyp_created_by, gtyp_created_on
)
SELECT v.code, v.name, v.descr, TRUE, 'system', NOW()
FROM (VALUES
    ('GTY-ASSETTYP', 'Asset Type',
     'Asset classification used on Item Master (asset items)'),
    ('GTY-CONSTYP',  'Consumable Type',
     'Consumable / stock classification used on Item Master'),
    ('GTY-DEPR',     'Depreciation Method',
     'Depreciation methods for fixed assets'),
    ('GTY-PARTY',    'Party Type',
     'Vendor / party classification'),
    ('GTY-RATING',   'Vendor Rating',
     '1–5 vendor performance rating'),
    ('GTY-OUTYPE',   'OU Type',
     'Operating unit types'),
    ('GTY-STRTYPE',  'Store Type',
     'Store / location types used on Store Master'),
    ('GTY-GENDER',   'Gender',
     'Employee gender codes'),
    ('GTY-EMPTYP',   'Employment Type',
     'Employee employment / engagement type'),
    ('GTY-ACCTSTAT', 'Account Status',
     'User login account status'),
    ('GTY-OUSCOPE',  'OU Access Scope',
     'User access scope for operating units'),
    ('GTY-EXCTYPE',  'Exception Type',
     'User access exception grant / revoke'),
    ('GTY-ROLELVL',  'Role Level',
     'Access role hierarchy levels 1–10'),
    ('GTY-DOCTYPE',  'Document Type',
     'Transaction / document types for reports and filters'),
    ('GTY-DOCSTAT',  'Document Status',
     'Transaction / document status values'),
    ('GTY-STKSTAT',  'Stock Status',
     'Stock register status filters'),
    ('GTY-GPIN',     'Gatepass Inward Type',
     'Gatepass inward entry mode'),
    ('GTY-RETFLAG',  'Returnable Flag',
     'Returnable / Non-Returnable flag for outward / issue')
) AS v(code, name, descr)
WHERE NOT EXISTS (
    SELECT 1 FROM gentype_mst t WHERE UPPER(t.gtyp_type_code) = UPPER(v.code)
);

-- ---------------------------------------------------------------------------
-- 2) General Masters (values) — globally unique value codes
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
    -- Asset Type (form stores valueName)
    ('GTY-ASSETTYP', 'AT-IT_LAPTOP',   'IT – Laptop',            1,  'Asset type'),
    ('GTY-ASSETTYP', 'AT-IT_SERVER',   'IT – Server',            2,  'Asset type'),
    ('GTY-ASSETTYP', 'AT-IT_NETWORK',  'IT – Network',           3,  'Asset type'),
    ('GTY-ASSETTYP', 'AT-IT_PERIPH',   'IT – Peripheral',        4,  'Asset type'),
    ('GTY-ASSETTYP', 'AT-PHY_MACH',    'Physical – Machinery',   5,  'Asset type'),
    ('GTY-ASSETTYP', 'AT-PHY_EQUIP',   'Physical – Equipment',   6,  'Asset type'),
    ('GTY-ASSETTYP', 'AT-DIG_LICENSE', 'Digital – License',      7,  'Asset type'),
    ('GTY-ASSETTYP', 'AT-DIG_FILE',    'Digital – File',         8,  'Asset type'),
    ('GTY-ASSETTYP', 'AT-DIG_SUB',     'Digital – Subscription', 9,  'Asset type'),
    ('GTY-ASSETTYP', 'AT-SPARE',       'Spare Part',            10,  'Asset type'),
    ('GTY-ASSETTYP', 'AT-OTHER',       'Other',                 11,  'Asset type'),

    -- Consumable Type (form stores valueName)
    ('GTY-CONSTYP', 'CT-RAW',   'Raw Material',   1, 'Consumable type'),
    ('GTY-CONSTYP', 'CT-FG',    'Finished Goods', 2, 'Consumable type'),
    ('GTY-CONSTYP', 'CT-SFG',   'Semi-Finished',  3, 'Consumable type'),
    ('GTY-CONSTYP', 'CT-CONS',  'Consumable',     4, 'Consumable type'),
    ('GTY-CONSTYP', 'CT-SPARE', 'Spare Part',     5, 'Consumable type'),
    ('GTY-CONSTYP', 'CT-PACK',  'Packaging',      6, 'Consumable type'),
    ('GTY-CONSTYP', 'CT-OTHER', 'Other',          7, 'Consumable type'),

    -- Depreciation Method (form stores valueName)
    ('GTY-DEPR', 'DEPR-SLM',  'Straight Line (SLM)',      1, 'Depreciation method'),
    ('GTY-DEPR', 'DEPR-WDV',  'Written Down Value (WDV)', 2, 'Depreciation method'),
    ('GTY-DEPR', 'DEPR-NONE', 'None',                     3, 'Depreciation method'),

    -- Party Type (form stores valueName)
    ('GTY-PARTY', 'PT-VENDOR',     'Vendor',     1, 'Party type'),
    ('GTY-PARTY', 'PT-SUPPLIER',   'Supplier',   2, 'Party type'),
    ('GTY-PARTY', 'PT-CUSTOMER',   'Customer',   3, 'Party type'),
    ('GTY-PARTY', 'PT-CONTRACTOR', 'Contractor', 4, 'Party type'),
    ('GTY-PARTY', 'PT-INTERNAL',   'Internal',   5, 'Party type'),
    ('GTY-PARTY', 'PT-OTHER',      'Other',      6, 'Party type'),

    -- Vendor Rating — valueCode is the numeric rating stored on vendor
    ('GTY-RATING', '1', '★ 1 – Poor',           1, 'Vendor rating'),
    ('GTY-RATING', '2', '★★ 2 – Fair',          2, 'Vendor rating'),
    ('GTY-RATING', '3', '★★★ 3 – Avg',         3, 'Vendor rating'),
    ('GTY-RATING', '4', '★★★★ 4 – Good',       4, 'Vendor rating'),
    ('GTY-RATING', '5', '★★★★★ 5 – Excellent', 5, 'Vendor rating'),

    -- OU Type (form stores valueName)
    ('GTY-OUTYPE', 'OU-BRANCH',    'Branch',    1, 'OU type'),
    ('GTY-OUTYPE', 'OU-REGION',    'Region',    2, 'OU type'),
    ('GTY-OUTYPE', 'OU-PLANT',     'Plant',     3, 'OU type'),
    ('GTY-OUTYPE', 'OU-ZONE',      'Zone',      4, 'OU type'),
    ('GTY-OUTYPE', 'OU-CORPORATE', 'Corporate', 5, 'OU type'),
    ('GTY-OUTYPE', 'OU-OTHER',     'Other',     6, 'OU type'),

    -- Store Type (form stores valueName)
    ('GTY-STRTYPE', 'ST-FM',         'FM',            1, 'Store type'),
    ('GTY-STRTYPE', 'ST-GENERAL',    'General Store', 2, 'Store type'),
    ('GTY-STRTYPE', 'ST-IT',         'IT Store',      3, 'Store type'),
    ('GTY-STRTYPE', 'ST-QUARANTINE', 'Quarantine',    4, 'Store type'),
    ('GTY-STRTYPE', 'ST-REJECTED',   'Rejected',      5, 'Store type'),
    ('GTY-STRTYPE', 'ST-WAREHOUSE',  'Warehouse',     6, 'Store type'),

    -- Gender (valueCode stored on employee)
    ('GTY-GENDER', 'M', 'Male',   1, 'Gender'),
    ('GTY-GENDER', 'F', 'Female', 2, 'Gender'),
    ('GTY-GENDER', 'O', 'Other',  3, 'Gender'),

    -- Employment Type (valueCode stored)
    ('GTY-EMPTYP', 'permanent',  'Permanent',  1, 'Employment type'),
    ('GTY-EMPTYP', 'contract',   'Contract',   2, 'Employment type'),
    ('GTY-EMPTYP', 'intern',     'Intern',     3, 'Employment type'),
    ('GTY-EMPTYP', 'consultant', 'Consultant', 4, 'Employment type'),

    -- Account Status (form stores valueName)
    ('GTY-ACCTSTAT', 'AS-ACTIVE',   'Active',   1, 'Account status'),
    ('GTY-ACCTSTAT', 'AS-LOCKED',   'Locked',   2, 'Account status'),
    ('GTY-ACCTSTAT', 'AS-DISABLED', 'Disabled', 3, 'Account status'),

    -- OU Access Scope (valueCode stored)
    ('GTY-OUSCOPE', 'ALL',      'All Operating Units',      1, 'OU access scope'),
    ('GTY-OUSCOPE', 'SELECTED', 'Selected Operating Units', 2, 'OU access scope'),

    -- Exception Type (valueCode stored)
    ('GTY-EXCTYPE', 'Grant',  'Grant Access',  1, 'Exception type'),
    ('GTY-EXCTYPE', 'Revoke', 'Revoke Access', 2, 'Exception type'),

    -- Role Level — valueName is numeric string used as form value (codes unique vs rating)
    ('GTY-ROLELVL', 'RL-1',  '1',  1,  'Role level'),
    ('GTY-ROLELVL', 'RL-2',  '2',  2,  'Role level'),
    ('GTY-ROLELVL', 'RL-3',  '3',  3,  'Role level'),
    ('GTY-ROLELVL', 'RL-4',  '4',  4,  'Role level'),
    ('GTY-ROLELVL', 'RL-5',  '5',  5,  'Role level'),
    ('GTY-ROLELVL', 'RL-6',  '6',  6,  'Role level'),
    ('GTY-ROLELVL', 'RL-7',  '7',  7,  'Role level'),
    ('GTY-ROLELVL', 'RL-8',  '8',  8,  'Role level'),
    ('GTY-ROLELVL', 'RL-9',  '9',  9,  'Role level'),
    ('GTY-ROLELVL', 'RL-10', '10', 10, 'Role level'),

    -- Document Type (valueCode = API txn type)
    ('GTY-DOCTYPE', 'OPENING_STOCK',        'Opening Stock',            1, 'Document type'),
    ('GTY-DOCTYPE', 'MATERIAL_REQUISITION', 'Store Requisition',        2, 'Document type'),
    ('GTY-DOCTYPE', 'MATERIAL_ISSUE',       'Store Issue',              3, 'Document type'),
    ('GTY-DOCTYPE', 'GRN',                  'Goods Receipt Note (GRN)', 4, 'Document type'),
    ('GTY-DOCTYPE', 'MATERIAL_TRANSFER',    'Material Transfer',        5, 'Document type'),
    ('GTY-DOCTYPE', 'MATERIAL_RETURN',      'Material Return',          6, 'Document type'),
    ('GTY-DOCTYPE', 'GATEPASS_INWARD',      'Gatepass Inward',          7, 'Document type'),
    ('GTY-DOCTYPE', 'GATEPASS_OUTWARD',     'Gatepass Outward',         8, 'Document type'),

    -- Document Status (form stores valueName)
    ('GTY-DOCSTAT', 'DS-DRAFT',     'Draft',            1, 'Document status'),
    ('GTY-DOCSTAT', 'DS-APPROVED',  'Approved',         2, 'Document status'),
    ('GTY-DOCSTAT', 'DS-PENDING',   'Pending Approval', 3, 'Document status'),
    ('GTY-DOCSTAT', 'DS-COMPLETED', 'Completed',        4, 'Document status'),
    ('GTY-DOCSTAT', 'DS-REJECTED',  'Rejected',         5, 'Document status'),

    -- Stock Status (form stores valueName)
    ('GTY-STKSTAT', 'SS-IN_STOCK', 'In Stock',     1, 'Stock status'),
    ('GTY-STKSTAT', 'SS-LOW',      'Low Stock',    2, 'Stock status'),
    ('GTY-STKSTAT', 'SS-OUT',      'Out of Stock', 3, 'Stock status'),

    -- Gatepass Inward Type (valueCode stored)
    ('GTY-GPIN', 'returnable', 'Against Returnable Outward', 1, 'Gatepass inward type'),
    ('GTY-GPIN', 'new',        'New Inward Entry',           2, 'Gatepass inward type'),

    -- Returnable Flag (valueCode Y/N)
    ('GTY-RETFLAG', 'N', 'Non Returnable', 1, 'Returnable flag'),
    ('GTY-RETFLAG', 'Y', 'Returnable',     2, 'Returnable flag')
) AS v(type_code, code, name, sort_no, descr)
JOIN gentype_mst t ON UPPER(t.gtyp_type_code) = UPPER(v.type_code)
WHERE NOT EXISTS (
    SELECT 1
    FROM genmaster_mst m
    WHERE UPPER(m.gmst_value_code) = UPPER(v.code)
);

-- Verification
SELECT t.gtyp_type_code AS type_code, COUNT(m.gmst_genmaster_id) AS value_count
FROM gentype_mst t
LEFT JOIN genmaster_mst m ON m.gmst_gentype_id_gtyp = t.gtyp_gentype_id
WHERE t.gtyp_type_code LIKE 'GTY-%'
GROUP BY t.gtyp_type_code
ORDER BY t.gtyp_type_code;
