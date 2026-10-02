-- Hide Catalog Need Request menu (CNR) while keeping schema tables for future use.
-- Re-runnable. Applies to both caits_local and caits.

DO $$
DECLARE
  sch text;
BEGIN
  FOREACH sch IN ARRAY ARRAY['caits_local', 'caits']
  LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = sch) THEN
      RAISE NOTICE 'Schema % missing — skip', sch;
      CONTINUE;
    END IF;

    EXECUTE format($f$
      UPDATE %I.sysm_menutree_mst
      SET mtree_isactive = FALSE,
          mtree_modified_by = 'system',
          mtree_modified_on = NOW()
      WHERE mtree_menu_code = 'CNR'
    $f$, sch);

    RAISE NOTICE 'CNR menu deactivated on %', sch;
  END LOOP;
END
$$;
