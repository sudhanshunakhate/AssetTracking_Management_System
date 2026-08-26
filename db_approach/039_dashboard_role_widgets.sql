-- CAITS — role-based dashboard widgets
-- Schema: caits_local
-- Safe to re-run: IF NOT EXISTS / ON CONFLICT

SET search_path TO caits_local;

-- Catalog of dashboard building blocks (not hardcoded in UI layout).
CREATE TABLE IF NOT EXISTS dash_widget_mst (
    dshw_widget_id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dshw_widget_code        character varying(40) NOT NULL,
    dshw_widget_type        character varying(20) NOT NULL,
    dshw_title              character varying(120) NOT NULL,
    dshw_subtitle           character varying(200),
    dshw_icon               character varying(40),
    dshw_tone               character varying(20),
    dshw_link_path          character varying(200),
    dshw_required_menu_code character varying(20),
    dshw_default_col_span   integer NOT NULL DEFAULT 1,
    dshw_default_sort       integer NOT NULL DEFAULT 100,
    dshw_isactive           boolean NOT NULL DEFAULT true,
    dshw_created_on         timestamp without time zone NOT NULL DEFAULT now(),
    CONSTRAINT uq_dash_widget_code UNIQUE (dshw_widget_code),
    CONSTRAINT ck_dash_widget_type CHECK (dshw_widget_type IN (
        'KPI', 'ALERT', 'CHART', 'PANEL', 'LIST', 'SHORTCUTS'
    ))
);

-- Which widgets a role sees (and in what order / width).
CREATE TABLE IF NOT EXISTS dash_role_widget_dtl (
    dshr_id                 integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dshr_role_id_rol        integer NOT NULL,
    dshr_widget_id_dshw     integer NOT NULL,
    dshr_sort_order         integer NOT NULL DEFAULT 100,
    dshr_col_span           integer NOT NULL DEFAULT 1,
    dshr_is_visible         boolean NOT NULL DEFAULT true,
    CONSTRAINT uq_dash_role_widget UNIQUE (dshr_role_id_rol, dshr_widget_id_dshw),
    CONSTRAINT fk_dash_role FOREIGN KEY (dshr_role_id_rol)
        REFERENCES sysm_roles_mst (rol_role_id) ON DELETE CASCADE,
    CONSTRAINT fk_dash_widget FOREIGN KEY (dshr_widget_id_dshw)
        REFERENCES dash_widget_mst (dshw_widget_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_dash_role_widget_role
    ON dash_role_widget_dtl (dshr_role_id_rol, dshr_sort_order);

COMMENT ON TABLE dash_widget_mst IS 'Dashboard widget catalog; UI renders by type/code, not a fixed layout';
COMMENT ON TABLE dash_role_widget_dtl IS 'Role → widget assignment so each role gets a different dashboard';
COMMENT ON COLUMN dash_widget_mst.dshw_required_menu_code
    IS 'If set, widget is shown only when the user has view permission on that menu';

-- Seed catalog (idempotent).
INSERT INTO dash_widget_mst (
    dshw_widget_code, dshw_widget_type, dshw_title, dshw_subtitle, dshw_icon, dshw_tone,
    dshw_link_path, dshw_required_menu_code, dshw_default_col_span, dshw_default_sort
) VALUES
    ('KPI_ITEMS', 'KPI', 'Total Items', 'Open item master', 'itemMaster', 'sky',
     '/masters/items', 'AIM', 1, 10),
    ('KPI_VENDORS', 'KPI', 'Vendors', 'Open vendor master', 'vendorParty', 'blue',
     '/masters/vendors', 'VPM', 1, 20),
    ('KPI_TXNS', 'KPI', 'Transactions', 'Full document trail', 'materialTransfer', 'warm',
     '/reports/full-report', 'FULLRPT', 1, 30),
    ('KPI_LOW_STOCK', 'KPI', 'Low Stock', 'Needs reorder attention', 'lowStockAlert', 'danger',
     '/reports/stock-register', 'STKREG', 1, 40),
    ('KPI_STOCK_ROWS', 'KPI', 'Stock Rows', 'Stock register positions', 'storeWiseStock', 'success',
     '/reports/stock-register', 'STKREG', 1, 50),
    ('KPI_PENDING_IAPR', 'KPI', 'Pending Inspections', 'Awaiting inspection approval', 'storeIssue', 'warm',
     '/transactions/inspection-approvals', 'IAPR', 1, 55),
    ('KPI_PENDING_SR', 'KPI', 'Open Requisitions', 'Requested — ready to issue', 'storeRequisitions', 'sky',
     '/transactions/issues/pick-requisition', 'ISS', 1, 56),
    ('ALERT_LOW_STOCK', 'ALERT', 'Low stock alert', 'Items at or below reorder', 'lowStockAlert', 'warm',
     '/reports/stock-register', 'STKREG', 12, 5),
    ('CHART_STOCK_BY_STORE', 'CHART', 'Stock by store', 'Who holds the most on-hand quantity', 'storeWiseStock', NULL,
     '/reports/stock-register', 'STKREG', 7, 100),
    ('CHART_DOC_BY_TYPE', 'CHART', 'Documents by type', 'Document mix across types', 'fullReport', NULL,
     '/reports/full-report', 'FULLRPT', 5, 110),
    ('PANEL_STOCK_HEALTH', 'PANEL', 'Stock health', 'How positions split across status', 'stockRegister', NULL,
     '/reports/stock-register', 'STKREG', 4, 200),
    ('LIST_STOCK_FOCUS', 'LIST', 'Stock focus', 'Top or low stock positions', 'lowStockAlert', NULL,
     '/reports/stock-register', 'STKREG', 4, 210),
    ('LIST_RECENT_ACTIVITY', 'LIST', 'Recent activity', 'Latest document lines', 'materialTransfer', NULL,
     '/reports/full-report', 'FULLRPT', 4, 220),
    ('SHORTCUTS_TXN', 'SHORTCUTS', 'Quick actions', 'Jump to transactions you can use', 'dashboard', NULL,
     NULL, NULL, 12, 300)
ON CONFLICT (dshw_widget_code) DO UPDATE SET
    dshw_widget_type = EXCLUDED.dshw_widget_type,
    dshw_title = EXCLUDED.dshw_title,
    dshw_subtitle = EXCLUDED.dshw_subtitle,
    dshw_icon = EXCLUDED.dshw_icon,
    dshw_tone = EXCLUDED.dshw_tone,
    dshw_link_path = EXCLUDED.dshw_link_path,
    dshw_required_menu_code = EXCLUDED.dshw_required_menu_code,
    dshw_default_col_span = EXCLUDED.dshw_default_col_span,
    dshw_default_sort = EXCLUDED.dshw_default_sort,
    dshw_isactive = true;

-- ADMIN: full operational + master overview
INSERT INTO dash_role_widget_dtl (dshr_role_id_rol, dshr_widget_id_dshw, dshr_sort_order, dshr_col_span)
SELECT r.rol_role_id, w.dshw_widget_id, v.sort_order, v.col_span
FROM caits_local.sysm_roles_mst r
CROSS JOIN (VALUES
    ('ALERT_LOW_STOCK', 5, 12),
    ('KPI_ITEMS', 10, 1),
    ('KPI_VENDORS', 20, 1),
    ('KPI_TXNS', 30, 1),
    ('KPI_LOW_STOCK', 40, 1),
    ('KPI_STOCK_ROWS', 50, 1),
    ('KPI_PENDING_IAPR', 55, 1),
    ('CHART_STOCK_BY_STORE', 100, 7),
    ('CHART_DOC_BY_TYPE', 110, 5),
    ('PANEL_STOCK_HEALTH', 200, 4),
    ('LIST_STOCK_FOCUS', 210, 4),
    ('LIST_RECENT_ACTIVITY', 220, 4),
    ('SHORTCUTS_TXN', 300, 12)
) AS v(code, sort_order, col_span)
JOIN dash_widget_mst w ON w.dshw_widget_code = v.code
WHERE upper(r.rol_role_code) = 'ADMIN'
ON CONFLICT (dshr_role_id_rol, dshr_widget_id_dshw) DO UPDATE SET
    dshr_sort_order = EXCLUDED.dshr_sort_order,
    dshr_col_span = EXCLUDED.dshr_col_span,
    dshr_is_visible = true;

-- STRMGR: store operations focus (no vendor / full-report / admin masters)
INSERT INTO dash_role_widget_dtl (dshr_role_id_rol, dshr_widget_id_dshw, dshr_sort_order, dshr_col_span)
SELECT r.rol_role_id, w.dshw_widget_id, v.sort_order, v.col_span
FROM caits_local.sysm_roles_mst r
CROSS JOIN (VALUES
    ('ALERT_LOW_STOCK', 5, 12),
    ('KPI_ITEMS', 10, 1),
    ('KPI_LOW_STOCK', 20, 1),
    ('KPI_STOCK_ROWS', 30, 1),
    ('KPI_PENDING_SR', 40, 1),
    ('KPI_PENDING_IAPR', 50, 1),
    ('CHART_STOCK_BY_STORE', 100, 12),
    ('PANEL_STOCK_HEALTH', 200, 6),
    ('LIST_STOCK_FOCUS', 210, 6),
    ('SHORTCUTS_TXN', 300, 12)
) AS v(code, sort_order, col_span)
JOIN dash_widget_mst w ON w.dshw_widget_code = v.code
WHERE upper(r.rol_role_code) = 'STRMGR'
ON CONFLICT (dshr_role_id_rol, dshr_widget_id_dshw) DO UPDATE SET
    dshr_sort_order = EXCLUDED.dshr_sort_order,
    dshr_col_span = EXCLUDED.dshr_col_span,
    dshr_is_visible = true;

-- Any other active role with no mapping yet: inherit widget defaults filtered by menus at runtime.
-- (No rows needed here — backend falls back when role has zero mappings.)

SELECT 'dash_widget_mst' AS table_name, count(*) AS rows FROM dash_widget_mst
UNION ALL
SELECT 'dash_role_widget_dtl', count(*) FROM dash_role_widget_dtl;
