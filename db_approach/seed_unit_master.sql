-- CAITS — Seed Unit Master (UOM)
-- Schema: caits_local
-- Safe to re-run: inserts only when unit code is missing

SET search_path TO caits_local;

INSERT INTO unit_mst (
    unt_unit_code, unt_unit_name, unt_desc,
    unt_isactive, unt_created_by, unt_created_on
)
SELECT v.code, v.name, v.descr, TRUE, 'system', NOW()
FROM (VALUES
    (
        'NOS',
        'Numbers',
        'Individual physical IT assets and fixed property (e.g. Laptops, Desktops, Monitors, Servers, Switches, Office Chairs). GST: NOS'
    ),
    (
        'PCS',
        'Pieces',
        'Component assets, hardware accessories, and loose workstation items (e.g. Mice, Keyboards, RAM, SSDs, Power Adapters). GST: PCS'
    ),
    (
        'RM',
        'Reams',
        'Office printing consumables (e.g. A4 Copier Paper, Legal Bond Paper, Presentation Sheets). GST: OTH'
    ),
    (
        'BOX',
        'Boxes',
        'Packaged administrative and technical consumables (e.g. Markers, Sticky Notes, RJ45 Connectors, Tissue Boxes). GST: BOX'
    ),
    (
        'SET',
        'Sets',
        'Combined multi-piece asset assemblies (e.g. Video Conferencing Systems, Desktop Combo Packs, Rack Mounting Kits). GST: SET'
    ),
    (
        'MTR',
        'Meters',
        'Network cabling and infrastructure materials (e.g. CAT6 Ethernet, Fiber patches, Power cables, Grounding wire). GST: MTR'
    ),
    (
        'ROL',
        'Rolls',
        'Continuous structural consumables (e.g. Velcro cable wraps, Duct tapes, Label printer rolls). GST: ROL'
    ),
    (
        'PAC',
        'Packs',
        'Pantry, housekeeping, and event consumables (e.g. Coffee beans, Tea bags, ID lanyards, Sanitizer packets). GST: PAC'
    ),
    (
        'BTL',
        'Bottles',
        'Liquid maintenance and pantry consumables (e.g. IPA spray, Screen cleaners, Hand sanitizers, Disinfectants). GST: BTL'
    ),
    (
        'LIC',
        'Licenses',
        'Intangible software assets and allocations (e.g. Microsoft 365 seats, Adobe CC, GitHub Enterprise). GST: OTH'
    ),
    (
        'CORE',
        'Cores',
        'Cloud computing virtual assets (e.g. AWS/Azure VMs, SQL Database core allocations). GST: OTH'
    ),
    (
        'KG',
        'Kilograms',
        'Heavy-duty cleaning powders, waste management disposal tracking, or landscaping raw items'
    ),
    (
        'LTR',
        'Litres',
        'Bulk cleaning chemicals, water dispenser bottles, liquid sanitizers, or generator diesel stock'
    ),
    (
        'PAIR',
        'Pairs',
        'Physical corporate health and safety gear (e.g. technician safety gloves, server room ESD anti-static shoes)'
    ),
    (
        'CAN',
        'Cans',
        'Compressed air dusters for server cabinets, insect sprays, or generic maintenance aerosols'
    )
) AS v(code, name, descr)
WHERE NOT EXISTS (
    SELECT 1 FROM unit_mst u WHERE UPPER(u.unt_unit_code) = UPPER(v.code)
);
