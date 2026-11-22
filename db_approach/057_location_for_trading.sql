-- For Trading locations: selectable only on Material Transfer and Gatepass
-- (hidden from Opening Stock, GRN, Issue, Requisition, Inspection, etc.).
-- Applies to both local schemas when present. Re-runnable.

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

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = sch
        AND table_name = 'org_location_mst'
        AND column_name = 'loc_for_trading'
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I.org_location_mst ADD COLUMN loc_for_trading BOOLEAN NOT NULL DEFAULT FALSE',
        sch
      );
      RAISE NOTICE 'Added %.org_location_mst.loc_for_trading', sch;
    ELSE
      RAISE NOTICE '%.org_location_mst.loc_for_trading already exists — skipped', sch;
    END IF;
  END LOOP;
END $$;
