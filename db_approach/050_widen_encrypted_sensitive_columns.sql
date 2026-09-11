-- Widen S4 columns so AES-GCM ciphertext (enc:v1:…) fits.
-- Plain values remain readable; EncryptedStringConverter encrypts on next write.
-- Re-runnable: skips when already wide enough.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'caits' AND table_name = 'inv_vendor_mst'
      AND column_name = 'vnd_gstin' AND character_maximum_length IS NOT NULL
      AND character_maximum_length < 512
  ) THEN
    ALTER TABLE caits.inv_vendor_mst ALTER COLUMN vnd_gstin TYPE varchar(512);
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'caits' AND table_name = 'inv_vendor_mst'
      AND column_name = 'vnd_pan_no' AND character_maximum_length IS NOT NULL
      AND character_maximum_length < 512
  ) THEN
    ALTER TABLE caits.inv_vendor_mst ALTER COLUMN vnd_pan_no TYPE varchar(512);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'caits' AND table_name = 'org_entity_mst'
      AND column_name = 'ent_gstin' AND character_maximum_length IS NOT NULL
      AND character_maximum_length < 512
  ) THEN
    ALTER TABLE caits.org_entity_mst ALTER COLUMN ent_gstin TYPE varchar(512);
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'caits' AND table_name = 'org_entity_mst'
      AND column_name = 'ent_pan_no' AND character_maximum_length IS NOT NULL
      AND character_maximum_length < 512
  ) THEN
    ALTER TABLE caits.org_entity_mst ALTER COLUMN ent_pan_no TYPE varchar(512);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'caits' AND table_name = 'txn_header_mst'
      AND column_name = 'txh_party_gstin' AND character_maximum_length IS NOT NULL
      AND character_maximum_length < 512
  ) THEN
    ALTER TABLE caits.txn_header_mst ALTER COLUMN txh_party_gstin TYPE varchar(512);
  END IF;

  -- Also widen caits_local if present (clone source / dual-schema hosts).
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'caits_local' AND table_name = 'inv_vendor_mst'
      AND column_name = 'vnd_gstin' AND character_maximum_length IS NOT NULL
      AND character_maximum_length < 512
  ) THEN
    ALTER TABLE caits_local.inv_vendor_mst ALTER COLUMN vnd_gstin TYPE varchar(512);
    ALTER TABLE caits_local.inv_vendor_mst ALTER COLUMN vnd_pan_no TYPE varchar(512);
    ALTER TABLE caits_local.org_entity_mst ALTER COLUMN ent_gstin TYPE varchar(512);
    ALTER TABLE caits_local.org_entity_mst ALTER COLUMN ent_pan_no TYPE varchar(512);
    ALTER TABLE caits_local.txn_header_mst ALTER COLUMN txh_party_gstin TYPE varchar(512);
  END IF;
END $$;
