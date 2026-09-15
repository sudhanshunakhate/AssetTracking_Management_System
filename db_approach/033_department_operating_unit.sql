-- Link departments to an Operating Unit (optional; scoped under Organization).
SET search_path TO caits_local;

ALTER TABLE hrc_department_mst
    ADD COLUMN IF NOT EXISTS dept_bu_id_bu INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_dept_bu'
    ) THEN
        ALTER TABLE hrc_department_mst
            ADD CONSTRAINT fk_dept_bu
            FOREIGN KEY (dept_bu_id_bu) REFERENCES org_businessunit_mst (bu_bu_id);
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS ix_dept_bu ON hrc_department_mst (dept_bu_id_bu)
    WHERE dept_bu_id_bu IS NOT NULL;

COMMENT ON COLUMN hrc_department_mst.dept_bu_id_bu
    IS 'Operating Unit this department belongs to (optional; must match dept_entity_id_ent)';
