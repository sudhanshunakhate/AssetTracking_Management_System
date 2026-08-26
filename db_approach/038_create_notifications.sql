-- CAITS — in-app notifications and Web Push subscriptions
-- Schema: caits_local
-- Safe to re-run: IF NOT EXISTS

SET search_path TO caits_local;

CREATE TABLE IF NOT EXISTS ntf_notification_mst (
    ntf_notification_id     integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ntf_user_id_usr         integer NOT NULL,
    ntf_title               character varying(200) NOT NULL,
    ntf_body                character varying(1000) NOT NULL,
    ntf_kind                character varying(40) NOT NULL,
    ntf_menu_code           character varying(20),
    ntf_doc_type            character varying(40),
    ntf_doc_id              integer,
    ntf_link_url            character varying(300),
    ntf_is_read             boolean NOT NULL DEFAULT false,
    ntf_created_on          timestamp without time zone NOT NULL DEFAULT now(),
    CONSTRAINT fk_ntf_user
        FOREIGN KEY (ntf_user_id_usr)
        REFERENCES sysm_userlogin_mst (usr_user_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_ntf_user_created
    ON ntf_notification_mst (ntf_user_id_usr, ntf_created_on DESC);
CREATE INDEX IF NOT EXISTS ix_ntf_user_unread
    ON ntf_notification_mst (ntf_user_id_usr, ntf_is_read);

CREATE TABLE IF NOT EXISTS ntf_push_subscription_dtl (
    nps_subscription_id     integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nps_user_id_usr         integer NOT NULL,
    nps_endpoint            text NOT NULL,
    nps_p256dh              text NOT NULL,
    nps_auth                text NOT NULL,
    nps_user_agent          character varying(400),
    nps_created_on          timestamp without time zone NOT NULL DEFAULT now(),
    nps_modified_on         timestamp without time zone NOT NULL DEFAULT now(),
    CONSTRAINT uq_nps_endpoint UNIQUE (nps_endpoint),
    CONSTRAINT fk_nps_user
        FOREIGN KEY (nps_user_id_usr)
        REFERENCES sysm_userlogin_mst (usr_user_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_nps_user
    ON ntf_push_subscription_dtl (nps_user_id_usr);

COMMENT ON TABLE ntf_notification_mst
    IS 'Per-user in-app notifications; recipients are resolved from role/menu permissions';
COMMENT ON TABLE ntf_push_subscription_dtl
    IS 'Web Push subscriptions so OS notifications work when the browser tab is closed';
