-- CAITS — Menu section (group) sequence
-- Adds mtree_group_sort_order so Role & Menu Mapping can reorder sidebar sections
-- independently of individual menu sequence.
-- Schema: caits_local
-- Safe to re-run.

SET search_path TO caits_local;

ALTER TABLE sysm_menutree_mst
    ADD COLUMN IF NOT EXISTS mtree_group_sort_order integer;

-- Backfill from known groups (matches seed / frontend navGroups).
UPDATE sysm_menutree_mst
SET mtree_group_sort_order = CASE mtree_menu_group
    WHEN 'Master Setup' THEN 10
    WHEN 'Organization' THEN 20
    WHEN 'Access & People' THEN 30
    WHEN 'Transactions' THEN 40
    WHEN 'Reports' THEN 50
    ELSE 90
END
WHERE mtree_group_sort_order IS NULL;

-- Any leftover nulls (custom groups) get 90.
UPDATE sysm_menutree_mst
SET mtree_group_sort_order = 90
WHERE mtree_group_sort_order IS NULL;

ALTER TABLE sysm_menutree_mst
    ALTER COLUMN mtree_group_sort_order SET DEFAULT 90;

ALTER TABLE sysm_menutree_mst
    ALTER COLUMN mtree_group_sort_order SET NOT NULL;

DO $$
BEGIN
    RAISE NOTICE 'mtree_group_sort_order ready on sysm_menutree_mst';
END $$;
