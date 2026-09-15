-- CAITS — per-user favourite menus
-- Schema: caits_local
-- Safe to re-run: guarded by IF NOT EXISTS

SET search_path TO caits_local;

CREATE TABLE IF NOT EXISTS sysm_user_favourite_menu_dtl (
    ufav_favourite_id   integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ufav_user_id_usr    integer NOT NULL,
    ufav_menu_code_mtree character varying(20) NOT NULL,
    ufav_sort_order     integer NOT NULL DEFAULT 0,
    ufav_created_on     timestamp without time zone NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_favourite_menu UNIQUE (ufav_user_id_usr, ufav_menu_code_mtree),
    CONSTRAINT fk_user_favourite_user
        FOREIGN KEY (ufav_user_id_usr)
        REFERENCES sysm_userlogin_mst (usr_user_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_user_favourite_user
    ON sysm_user_favourite_menu_dtl (ufav_user_id_usr, ufav_sort_order);

COMMENT ON TABLE sysm_user_favourite_menu_dtl
    IS 'Menus the user pinned to the top of their sidebar';
COMMENT ON COLUMN sysm_user_favourite_menu_dtl.ufav_menu_code_mtree
    IS 'Matches sysm_menutree_mst.mtree_menu_code / navigation.ts menuCode';

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'caits_local'
  AND table_name = 'sysm_user_favourite_menu_dtl';
