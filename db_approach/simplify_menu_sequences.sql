-- CAITS — Simplify menu / section sequence numbering
-- Sections: 1, 2, 3, 4, 5
-- Menus:    section N → N1, N2, N3…  (e.g. Master Setup 11–17, Organization 21–23)
-- Schema: caits_local
-- Safe to re-run: plain UPDATEs by menu code.

SET search_path TO caits_local;

-- Section order (mtree_group_sort_order)
UPDATE sysm_menutree_mst SET mtree_group_sort_order = 1 WHERE mtree_menu_group = 'Master Setup';
UPDATE sysm_menutree_mst SET mtree_group_sort_order = 2 WHERE mtree_menu_group = 'Organization';
UPDATE sysm_menutree_mst SET mtree_group_sort_order = 3 WHERE mtree_menu_group = 'Access & People';
UPDATE sysm_menutree_mst SET mtree_group_sort_order = 4 WHERE mtree_menu_group = 'Transactions';
UPDATE sysm_menutree_mst SET mtree_group_sort_order = 5 WHERE mtree_menu_group = 'Reports';

-- Menu order within section (mtree_sort_order)
-- 1. Master Setup → 11..17
UPDATE sysm_menutree_mst SET mtree_sort_order = 11 WHERE UPPER(mtree_menu_code) = 'UOM';
UPDATE sysm_menutree_mst SET mtree_sort_order = 12 WHERE UPPER(mtree_menu_code) = 'AIM';
UPDATE sysm_menutree_mst SET mtree_sort_order = 13 WHERE UPPER(mtree_menu_code) = 'ICM';
UPDATE sysm_menutree_mst SET mtree_sort_order = 14 WHERE UPPER(mtree_menu_code) = 'ISC';
UPDATE sysm_menutree_mst SET mtree_sort_order = 15 WHERE UPPER(mtree_menu_code) = 'GTY';
UPDATE sysm_menutree_mst SET mtree_sort_order = 16 WHERE UPPER(mtree_menu_code) = 'GNM';
UPDATE sysm_menutree_mst SET mtree_sort_order = 17 WHERE UPPER(mtree_menu_code) = 'VPM';

-- 2. Organization → 21..23
UPDATE sysm_menutree_mst SET mtree_sort_order = 21 WHERE UPPER(mtree_menu_code) = 'ORG';
UPDATE sysm_menutree_mst SET mtree_sort_order = 22 WHERE UPPER(mtree_menu_code) = 'OU';
UPDATE sysm_menutree_mst SET mtree_sort_order = 23 WHERE UPPER(mtree_menu_code) = 'STR';

-- 3. Access & People → 31..35
UPDATE sysm_menutree_mst SET mtree_sort_order = 31 WHERE UPPER(mtree_menu_code) = 'ARM';
UPDATE sysm_menutree_mst SET mtree_sort_order = 32 WHERE UPPER(mtree_menu_code) = 'EMP';
UPDATE sysm_menutree_mst SET mtree_sort_order = 33 WHERE UPPER(mtree_menu_code) = 'USR';
UPDATE sysm_menutree_mst SET mtree_sort_order = 34 WHERE UPPER(mtree_menu_code) = 'MNU';
UPDATE sysm_menutree_mst SET mtree_sort_order = 35 WHERE UPPER(mtree_menu_code) = 'UAE';

-- 4. Transactions → 41..47
UPDATE sysm_menutree_mst SET mtree_sort_order = 41 WHERE UPPER(mtree_menu_code) = 'OPN';
UPDATE sysm_menutree_mst SET mtree_sort_order = 42 WHERE UPPER(mtree_menu_code) = 'SR';
UPDATE sysm_menutree_mst SET mtree_sort_order = 43 WHERE UPPER(mtree_menu_code) = 'GRN';
UPDATE sysm_menutree_mst SET mtree_sort_order = 44 WHERE UPPER(mtree_menu_code) = 'GP';
UPDATE sysm_menutree_mst SET mtree_sort_order = 45 WHERE UPPER(mtree_menu_code) = 'ISS';
UPDATE sysm_menutree_mst SET mtree_sort_order = 46 WHERE UPPER(mtree_menu_code) = 'TRF';
UPDATE sysm_menutree_mst SET mtree_sort_order = 47 WHERE UPPER(mtree_menu_code) = 'RTN';

-- 5. Reports → 51..53
UPDATE sysm_menutree_mst SET mtree_sort_order = 51 WHERE UPPER(mtree_menu_code) = 'DASH';
UPDATE sysm_menutree_mst SET mtree_sort_order = 52 WHERE UPPER(mtree_menu_code) = 'STKREG';
UPDATE sysm_menutree_mst SET mtree_sort_order = 53 WHERE UPPER(mtree_menu_code) = 'FULLRPT';

DO $$
BEGIN
    RAISE NOTICE 'Menu sequences simplified: sections 1-5, menus N1/N2/N3…';
END $$;
