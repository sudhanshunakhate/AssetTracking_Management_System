-- Catalog Need Request: common name on items + standalone request tables + CNR menu.
-- Applies to BOTH schemas on the shared server (caits_local and caits).
-- Re-runnable.

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

    -- Item common name (groups brand SKUs: Laptop, A4 Paper, RAM, …)
    EXECUTE format(
      'ALTER TABLE %I.inv_item_mst ADD COLUMN IF NOT EXISTS itm_common_name varchar(120)',
      sch
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS ix_itm_common_name ON %I.inv_item_mst (itm_category_id_cat, itm_subcategory_id_scat, lower(itm_common_name))',
      sch
    );
    -- Soft backfill: blank common names default to item name so the catalog list is usable immediately.
    EXECUTE format(
      'UPDATE %I.inv_item_mst SET itm_common_name = itm_item_name WHERE itm_common_name IS NULL OR btrim(itm_common_name) = ''''',
      sch
    );

    -- Header
    EXECUTE format($f$
      CREATE TABLE IF NOT EXISTS %I.txn_catalog_need_hdr (
        cnh_id              serial PRIMARY KEY,
        cnh_doc_no          varchar(40) NOT NULL,
        cnh_doc_date        date NOT NULL,
        cnh_required_by_date date,
        cnh_status          varchar(30) NOT NULL DEFAULT 'Draft',
        cnh_location_id_loc integer NOT NULL,
        cnh_entity_id_ent   integer,
        cnh_department_id_dept integer,
        cnh_requested_by_emp_id integer NOT NULL,
        cnh_remarks         varchar(500),
        cnh_attachment_url  varchar(500),
        cnh_attachment_name varchar(255),
        cnh_created_by      varchar(80),
        cnh_created_on      timestamptz NOT NULL DEFAULT NOW(),
        cnh_modified_by     varchar(80),
        cnh_modified_on     timestamptz,
        CONSTRAINT uq_cnh_doc_no UNIQUE (cnh_doc_no)
      )
    $f$, sch);

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS ix_cnh_status_date ON %I.txn_catalog_need_hdr (cnh_status, cnh_doc_date DESC)',
      sch
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS ix_cnh_requested_by ON %I.txn_catalog_need_hdr (cnh_requested_by_emp_id)',
      sch
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS ix_cnh_location ON %I.txn_catalog_need_hdr (cnh_location_id_loc)',
      sch
    );

    -- Assignees
    EXECUTE format($f$
      CREATE TABLE IF NOT EXISTS %I.txn_catalog_need_assignee_dtl (
        cna_id              serial PRIMARY KEY,
        cna_header_id_cnh   integer NOT NULL REFERENCES %I.txn_catalog_need_hdr (cnh_id) ON DELETE CASCADE,
        cna_emp_id_emp      integer NOT NULL,
        cna_user_id_usr     integer,
        cna_notify_status   varchar(20) DEFAULT 'Pending',
        cna_acknowledged_on timestamptz,
        CONSTRAINT uq_cna_header_emp UNIQUE (cna_header_id_cnh, cna_emp_id_emp)
      )
    $f$, sch, sch);

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS ix_cna_emp ON %I.txn_catalog_need_assignee_dtl (cna_emp_id_emp)',
      sch
    );

    -- Lines
    EXECUTE format($f$
      CREATE TABLE IF NOT EXISTS %I.txn_catalog_need_line_dtl (
        cnl_id                  serial PRIMARY KEY,
        cnl_header_id_cnh       integer NOT NULL REFERENCES %I.txn_catalog_need_hdr (cnh_id) ON DELETE CASCADE,
        cnl_sr_no               integer NOT NULL,
        cnl_category_id_cat     integer NOT NULL,
        cnl_subcategory_id_scat integer,
        cnl_common_name         varchar(120) NOT NULL,
        cnl_item_id_itm         integer,
        cnl_requested_qty       numeric(18,3) NOT NULL,
        cnl_uom_id_unt          integer,
        cnl_priority            varchar(20) DEFAULT 'Normal',
        cnl_remark              varchar(255),
        cnl_fulfilled_qty       numeric(18,3) DEFAULT 0
      )
    $f$, sch, sch);

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS ix_cnl_header ON %I.txn_catalog_need_line_dtl (cnl_header_id_cnh, cnl_sr_no)',
      sch
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS ix_cnl_cat_common ON %I.txn_catalog_need_line_dtl (cnl_category_id_cat, lower(cnl_common_name))',
      sch
    );

    -- Audit log
    EXECUTE format($f$
      CREATE TABLE IF NOT EXISTS %I.txn_catalog_need_log_dtl (
        cnlg_id             serial PRIMARY KEY,
        cnlg_header_id_cnh  integer NOT NULL REFERENCES %I.txn_catalog_need_hdr (cnh_id) ON DELETE CASCADE,
        cnlg_event_type     varchar(40) NOT NULL,
        cnlg_from_status    varchar(30),
        cnlg_to_status      varchar(30),
        cnlg_emp_id_emp     integer,
        cnlg_message        varchar(500),
        cnlg_payload_json   text,
        cnlg_created_by     varchar(80),
        cnlg_created_on     timestamptz NOT NULL DEFAULT NOW()
      )
    $f$, sch, sch);

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS ix_cnlg_header_on ON %I.txn_catalog_need_log_dtl (cnlg_header_id_cnh, cnlg_created_on DESC)',
      sch
    );

    -- Menu CNR + ADMIN permission
    EXECUTE format($f$
      INSERT INTO %I.sysm_menutree_mst (
        mtree_menu_code, mtree_menu_label, mtree_menu_group, mtree_sort_order, mtree_group_sort_order, mtree_icon, mtree_doc_type,
        mtree_supports_view, mtree_supports_create, mtree_supports_edit, mtree_supports_delete,
        mtree_supports_approve, mtree_supports_reject, mtree_supports_print, mtree_supports_export,
        mtree_is_system_menu, mtree_isactive, mtree_created_by, mtree_created_on
      ) VALUES
      ('CNR', 'Catalog Need Request', 'Transactions', 42, 4, 'CNR', 'CATALOG_NEED_REQUEST',
       TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, TRUE, 'system', NOW())
      ON CONFLICT (mtree_menu_code) DO UPDATE SET
        mtree_menu_label = EXCLUDED.mtree_menu_label,
        mtree_menu_group = EXCLUDED.mtree_menu_group,
        mtree_sort_order = EXCLUDED.mtree_sort_order,
        mtree_group_sort_order = EXCLUDED.mtree_group_sort_order,
        mtree_icon = EXCLUDED.mtree_icon,
        mtree_doc_type = EXCLUDED.mtree_doc_type,
        mtree_isactive = TRUE,
        mtree_modified_by = 'system',
        mtree_modified_on = NOW()
    $f$, sch);

    EXECUTE format($f$
      INSERT INTO %I.sysm_rolepermission_dtl (
        rlpm_role_id_rol, rlpm_menu_id_mtree,
        rlpm_can_view, rlpm_can_create, rlpm_can_edit, rlpm_can_delete,
        rlpm_can_approve, rlpm_can_reject, rlpm_can_print, rlpm_can_export
      )
      SELECT
        r.rol_role_id, m.mtree_menu_id,
        TRUE,
        COALESCE(m.mtree_supports_create, FALSE),
        COALESCE(m.mtree_supports_edit, FALSE),
        COALESCE(m.mtree_supports_delete, FALSE),
        COALESCE(m.mtree_supports_approve, FALSE),
        COALESCE(m.mtree_supports_reject, FALSE),
        COALESCE(m.mtree_supports_print, FALSE),
        COALESCE(m.mtree_supports_export, FALSE)
      FROM %I.sysm_roles_mst r
      CROSS JOIN %I.sysm_menutree_mst m
      WHERE UPPER(r.rol_role_code) = 'ADMIN'
        AND m.mtree_menu_code = 'CNR'
        AND NOT EXISTS (
          SELECT 1 FROM %I.sysm_rolepermission_dtl rp
          WHERE rp.rlpm_role_id_rol = r.rol_role_id AND rp.rlpm_menu_id_mtree = m.mtree_menu_id
        )
    $f$, sch, sch, sch, sch);

    RAISE NOTICE 'Catalog Need Request schema applied on %', sch;
  END LOOP;
END
$$;
