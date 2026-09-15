-- CAITS — Seed Category + Subcategory masters
-- Schema: caits_local
-- Safe to re-run: inserts only when code is missing

SET search_path TO caits_local;

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
INSERT INTO category_mst (
    cat_category_code, cat_category_name, cat_desc,
    cat_isactive, cat_created_by, cat_created_on
)
SELECT v.code, v.name, v.descr, TRUE, 'system', NOW()
FROM (VALUES
    ('CAT-IT',     'IT Equipment',        'Computers, servers, network and peripherals'),
    ('CAT-PHY',    'Physical Assets',     'Machinery, plant and equipment'),
    ('CAT-DIG',    'Digital Assets',      'Licenses, subscriptions and digital files'),
    ('CAT-CONS',   'Consumables',         'Stock consumables and materials'),
    ('CAT-RAW',    'Raw Materials',       'Raw / input materials for production'),
    ('CAT-FG',     'Finished Goods',      'Finished / saleable goods'),
    ('CAT-SPARE',  'Spares & Parts',      'Spare parts and service components'),
    ('CAT-PACK',   'Packaging',           'Packaging materials and supplies'),
    ('CAT-OFFICE', 'Office Supplies',     'Stationery and general office consumables'),
    ('CAT-OTHER',  'Other',               'Unclassified / miscellaneous items')
) AS v(code, name, descr)
WHERE NOT EXISTS (
    SELECT 1 FROM category_mst c WHERE UPPER(c.cat_category_code) = UPPER(v.code)
);

-- ---------------------------------------------------------------------------
-- Subcategories (linked by parent category code)
-- ---------------------------------------------------------------------------
INSERT INTO subcategory_mst (
    scat_subcategory_code, scat_subcategory_name, scat_category_id_cat,
    scat_desc, scat_isactive, scat_created_by, scat_created_on
)
SELECT
    v.code,
    v.name,
    c.cat_category_id,
    v.descr,
    TRUE,
    'system',
    NOW()
FROM (VALUES
    -- IT Equipment
    ('CAT-IT', 'SC-LAPTOP',   'Laptops',           'Notebook / laptop computers'),
    ('CAT-IT', 'SC-DESKTOP',  'Desktops',          'Desktop PCs and workstations'),
    ('CAT-IT', 'SC-SERVER',   'Servers',           'Physical / virtual servers'),
    ('CAT-IT', 'SC-NETWORK',  'Network Devices',   'Switches, routers, access points'),
    ('CAT-IT', 'SC-PERIPH',   'Peripherals',       'Monitors, printers, scanners, keyboards'),
    ('CAT-IT', 'SC-MOBILE',   'Mobile Devices',    'Phones, tablets, handhelds'),

    -- Physical Assets
    ('CAT-PHY', 'SC-MACH',    'Machinery',         'Production / plant machinery'),
    ('CAT-PHY', 'SC-EQUIP',   'Equipment',         'Tools and general equipment'),
    ('CAT-PHY', 'SC-FURN',    'Furniture',         'Office and warehouse furniture'),
    ('CAT-PHY', 'SC-VEH',     'Vehicles',          'Company vehicles / material handling'),

    -- Digital Assets
    ('CAT-DIG', 'SC-LICENSE', 'Software License',  'Perpetual / named licenses'),
    ('CAT-DIG', 'SC-SUBSCR',  'Subscription',      'SaaS / recurring subscriptions'),
    ('CAT-DIG', 'SC-FILE',    'Digital File',      'Media, documents, digital content'),

    -- Consumables
    ('CAT-CONS', 'SC-CONSGEN', 'General Consumable', 'Day-to-day consumable stock'),
    ('CAT-CONS', 'SC-CHEM',    'Chemicals',          'Chemicals and reagents'),
    ('CAT-CONS', 'SC-CLEAN',   'Cleaning Supplies',  'Housekeeping / cleaning materials'),

    -- Raw Materials
    ('CAT-RAW', 'SC-RAWMET',  'Metals',            'Metal raw materials'),
    ('CAT-RAW', 'SC-RAWPLAS', 'Plastics',          'Plastic raw materials'),
    ('CAT-RAW', 'SC-RAWOTH',  'Other Raw',         'Other raw inputs'),

    -- Finished Goods
    ('CAT-FG', 'SC-FGSTD',    'Standard FG',       'Standard finished goods'),
    ('CAT-FG', 'SC-FGSEMI',   'Semi-Finished',     'Semi-finished / WIP goods'),

    -- Spares & Parts
    ('CAT-SPARE', 'SC-SPMECH', 'Mechanical Spares', 'Mechanical spare parts'),
    ('CAT-SPARE', 'SC-SPELEC', 'Electrical Spares', 'Electrical / electronic spares'),
    ('CAT-SPARE', 'SC-SPIT',   'IT Spares',         'IT spare parts and kits'),

    -- Packaging
    ('CAT-PACK', 'SC-BOX',    'Boxes & Cartons',   'Corrugated boxes and cartons'),
    ('CAT-PACK', 'SC-WRAP',   'Wrap & Film',       'Stretch wrap, film, tape'),

    -- Office Supplies
    ('CAT-OFFICE', 'SC-STAT', 'Stationery',        'Paper, pens, files'),
    ('CAT-OFFICE', 'SC-PRINT','Print Supplies',    'Toner, ink, ribbons'),

    -- Other
    ('CAT-OTHER', 'SC-MISC',  'Miscellaneous',     'Miscellaneous / uncategorized')
) AS v(cat_code, code, name, descr)
JOIN category_mst c ON UPPER(c.cat_category_code) = UPPER(v.cat_code)
WHERE NOT EXISTS (
    SELECT 1 FROM subcategory_mst s WHERE UPPER(s.scat_subcategory_code) = UPPER(v.code)
);

-- Verification
SELECT c.cat_category_code, c.cat_category_name, COUNT(s.scat_subcategory_id) AS sub_count
FROM category_mst c
LEFT JOIN subcategory_mst s ON s.scat_category_id_cat = c.cat_category_id
GROUP BY c.cat_category_code, c.cat_category_name
ORDER BY c.cat_category_code;

SELECT c.cat_category_code, s.scat_subcategory_code, s.scat_subcategory_name
FROM subcategory_mst s
JOIN category_mst c ON c.cat_category_id = s.scat_category_id_cat
ORDER BY c.cat_category_code, s.scat_subcategory_code;
