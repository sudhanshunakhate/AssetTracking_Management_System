-- Map each department to a mandatory operational location (store).
SET search_path TO caits_local;

ALTER TABLE hrc_department_mst
    ADD COLUMN IF NOT EXISTS dept_location_id_loc INTEGER;

-- Prefer an active non-system location under the department's organization.
UPDATE hrc_department_mst d
SET dept_location_id_loc = sub.loc_location_id
FROM (
    SELECT DISTINCT ON (d2.dept_department_id)
        d2.dept_department_id,
        l.loc_location_id
    FROM hrc_department_mst d2
    JOIN org_location_mst l ON l.loc_entity_id_ent = d2.dept_entity_id_ent
    WHERE d2.dept_location_id_loc IS NULL
      AND l.loc_isactive = TRUE
      AND COALESCE(l.loc_is_system_location, FALSE) = FALSE
    ORDER BY d2.dept_department_id, l.loc_location_id
) sub
WHERE d.dept_department_id = sub.dept_department_id
  AND d.dept_location_id_loc IS NULL;

-- Fallback: any active non-system location.
UPDATE hrc_department_mst d
SET dept_location_id_loc = (
    SELECT l.loc_location_id
    FROM org_location_mst l
    WHERE l.loc_isactive = TRUE
      AND COALESCE(l.loc_is_system_location, FALSE) = FALSE
    ORDER BY l.loc_location_id
    LIMIT 1
)
WHERE d.dept_location_id_loc IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_dept_location'
    ) THEN
        ALTER TABLE hrc_department_mst
            ADD CONSTRAINT fk_dept_location
            FOREIGN KEY (dept_location_id_loc) REFERENCES org_location_mst (loc_location_id);
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS ix_dept_location ON hrc_department_mst (dept_location_id_loc)
    WHERE dept_location_id_loc IS NOT NULL;

COMMENT ON COLUMN hrc_department_mst.dept_location_id_loc
    IS 'Default store/location for this department (required for requisitions and issues).';

-- Enforce NOT NULL only when every row has a location (skip if seed data has no locations yet).
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM hrc_department_mst WHERE dept_location_id_loc IS NULL) THEN
        ALTER TABLE hrc_department_mst
            ALTER COLUMN dept_location_id_loc SET NOT NULL;
    ELSE
        RAISE NOTICE '042_department_location: dept_location_id_loc left nullable — assign locations to all departments then re-run NOT NULL alter.';
    END IF;
END
$$;
