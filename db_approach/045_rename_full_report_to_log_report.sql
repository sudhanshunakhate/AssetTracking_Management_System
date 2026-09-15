-- Rename Reports menu Full Report → Log Report.
SET search_path TO caits_local;

UPDATE sysm_menutree_mst
SET mtree_menu_label = 'Log Report',
    mtree_modified_by = 'migration-045',
    mtree_modified_on = NOW()
WHERE mtree_menu_code = 'FULLRPT'
  AND mtree_menu_label IS DISTINCT FROM 'Log Report';
