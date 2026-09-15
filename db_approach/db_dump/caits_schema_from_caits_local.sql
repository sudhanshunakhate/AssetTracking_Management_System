--
-- PostgreSQL database dump
--


-- Dumped from database version 15.15
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY caits.sysm_user_location_mapping_dtl DROP CONSTRAINT IF EXISTS sysm_user_location_mapping_dtl_uloc_user_id_usr_fkey;
ALTER TABLE IF EXISTS ONLY caits.sysm_user_location_mapping_dtl DROP CONSTRAINT IF EXISTS sysm_user_location_mapping_dtl_uloc_location_id_loc_fkey;
ALTER TABLE IF EXISTS ONLY caits.inv_item_location_mapping_dtl DROP CONSTRAINT IF EXISTS inv_item_location_mapping_dtl_ilim_location_id_loc_fkey;
ALTER TABLE IF EXISTS ONLY caits.inv_item_location_mapping_dtl DROP CONSTRAINT IF EXISTS inv_item_location_mapping_dtl_ilim_item_id_itm_fkey;
ALTER TABLE IF EXISTS ONLY caits.inv_item_bu_mapping_dtl DROP CONSTRAINT IF EXISTS inv_item_bu_mapping_dtl_iibm_item_id_itm_fkey;
ALTER TABLE IF EXISTS ONLY caits.inv_item_bu_mapping_dtl DROP CONSTRAINT IF EXISTS inv_item_bu_mapping_dtl_iibm_bu_id_bu_fkey;
ALTER TABLE IF EXISTS ONLY caits.inv_bls_mst DROP CONSTRAINT IF EXISTS inv_bls_mst_ibm_item_id_itm_fkey;
ALTER TABLE IF EXISTS ONLY caits.inv_bls_mst DROP CONSTRAINT IF EXISTS inv_bls_mst_ibm_entity_id_ent_fkey;
ALTER TABLE IF EXISTS ONLY caits.inv_bls_mst DROP CONSTRAINT IF EXISTS inv_bls_mst_ibm_current_location_id_loc_fkey;
ALTER TABLE IF EXISTS ONLY caits.sysm_user_favourite_menu_dtl DROP CONSTRAINT IF EXISTS fk_user_favourite_user;
ALTER TABLE IF EXISTS ONLY caits.txn_header_mst DROP CONSTRAINT IF EXISTS fk_txn_header_mst_txh_to_location_id_loc_org_locati_a60cc529;
ALTER TABLE IF EXISTS ONLY caits.txn_header_mst DROP CONSTRAINT IF EXISTS fk_txn_header_mst_txh_ref_txn_header_id_txh_txn_hea_6522e207;
ALTER TABLE IF EXISTS ONLY caits.txn_header_mst DROP CONSTRAINT IF EXISTS fk_txn_header_mst_txh_received_by_emp_id_emp_hrc_em_f505f8fc;
ALTER TABLE IF EXISTS ONLY caits.txn_header_mst DROP CONSTRAINT IF EXISTS fk_txn_header_mst_txh_prepared_by_emp_id_emp;
ALTER TABLE IF EXISTS ONLY caits.txn_header_mst DROP CONSTRAINT IF EXISTS fk_txn_header_mst_txh_party_id_vnd_inv_vendor_mst_v_dfb69feb;
ALTER TABLE IF EXISTS ONLY caits.txn_header_mst DROP CONSTRAINT IF EXISTS fk_txn_header_mst_txh_location_id_loc_org_location__2914cd60;
ALTER TABLE IF EXISTS ONLY caits.txn_header_mst DROP CONSTRAINT IF EXISTS fk_txn_header_mst_txh_inspected_by_emp_id_emp_hrc_e_d65e0abb;
ALTER TABLE IF EXISTS ONLY caits.txn_header_mst DROP CONSTRAINT IF EXISTS fk_txn_header_mst_txh_initiated_by_emp_id_emp_hrc_e_c00d567b;
ALTER TABLE IF EXISTS ONLY caits.txn_header_mst DROP CONSTRAINT IF EXISTS fk_txn_header_mst_txh_handed_over_to_emp_id_emp_hrc_62532ba4;
ALTER TABLE IF EXISTS ONLY caits.txn_header_mst DROP CONSTRAINT IF EXISTS fk_txn_header_mst_txh_from_location_id_loc_org_loca_5fa8788a;
ALTER TABLE IF EXISTS ONLY caits.txn_header_mst DROP CONSTRAINT IF EXISTS fk_txn_header_mst_txh_entity_id_ent_org_entity_mst__6cbc7a95;
ALTER TABLE IF EXISTS ONLY caits.txn_header_mst DROP CONSTRAINT IF EXISTS fk_txn_header_mst_txh_approved_by_emp_id_emp_hrc_em_92f64cdb;
ALTER TABLE IF EXISTS ONLY caits.txn_detail_dtl DROP CONSTRAINT IF EXISTS fk_txn_detail_dtl_txd_uom_id_unt_unit_mst_unt_unit_id;
ALTER TABLE IF EXISTS ONLY caits.txn_detail_dtl DROP CONSTRAINT IF EXISTS fk_txn_detail_dtl_txd_txn_header_id_txh_txn_header__94298fce;
ALTER TABLE IF EXISTS ONLY caits.txn_detail_dtl DROP CONSTRAINT IF EXISTS fk_txn_detail_dtl_txd_location_id_loc_org_location__12589534;
ALTER TABLE IF EXISTS ONLY caits.txn_detail_dtl DROP CONSTRAINT IF EXISTS fk_txn_detail_dtl_txd_item_id_itm_inv_item_mst_itm_item_id;
ALTER TABLE IF EXISTS ONLY caits.txn_detail_dtl DROP CONSTRAINT IF EXISTS fk_txn_detail_dtl_txd_issued_to_emp_id_emp;
ALTER TABLE IF EXISTS ONLY caits.txn_detail_dtl DROP CONSTRAINT IF EXISTS fk_txn_detail_bls;
ALTER TABLE IF EXISTS ONLY caits.txn_header_mst DROP CONSTRAINT IF EXISTS fk_txh_department_dept;
ALTER TABLE IF EXISTS ONLY caits.sysm_userlogin_mst DROP CONSTRAINT IF EXISTS fk_sysm_userlogin_mst_usr_role_id_rol_sysm_roles_ms_842e11fa;
ALTER TABLE IF EXISTS ONLY caits.sysm_userlogin_mst DROP CONSTRAINT IF EXISTS fk_sysm_userlogin_mst_usr_location_id_loc_org_locat_538eaae6;
ALTER TABLE IF EXISTS ONLY caits.sysm_userlogin_mst DROP CONSTRAINT IF EXISTS fk_sysm_userlogin_mst_usr_entity_id_ent_org_entity__e5983a22;
ALTER TABLE IF EXISTS ONLY caits.sysm_userlogin_mst DROP CONSTRAINT IF EXISTS fk_sysm_userlogin_mst_usr_employee_id_emp_hrc_emplo_3322c8a3;
ALTER TABLE IF EXISTS ONLY caits.sysm_useraccess_exception_dtl DROP CONSTRAINT IF EXISTS fk_sysm_useraccess_exception_dtl_uexc_menu_code_mtr_5759a49f;
ALTER TABLE IF EXISTS ONLY caits.sysm_useraccess_exception_dtl DROP CONSTRAINT IF EXISTS fk_sysm_useraccess_exception_dtl_uexc_employee_id_e_407f5c0d;
ALTER TABLE IF EXISTS ONLY caits.sysm_user_bu_mapping_dtl DROP CONSTRAINT IF EXISTS fk_sysm_user_bu_mapping_dtl_uboa_user_id_usr_sysm_u_ef6ac91b;
ALTER TABLE IF EXISTS ONLY caits.sysm_user_bu_mapping_dtl DROP CONSTRAINT IF EXISTS fk_sysm_user_bu_mapping_dtl_uboa_bu_id_bu_org_busin_fe7d7110;
ALTER TABLE IF EXISTS ONLY caits.sysm_rolepermission_dtl DROP CONSTRAINT IF EXISTS fk_sysm_rolepermission_dtl_rlpm_role_id_rol_sysm_ro_5b4edd0a;
ALTER TABLE IF EXISTS ONLY caits.subcategory_mst DROP CONSTRAINT IF EXISTS fk_subcategory_mst_scat_category_id_cat_category_ms_6c1f14e1;
ALTER TABLE IF EXISTS ONLY caits.sysm_rolepermission_dtl DROP CONSTRAINT IF EXISTS fk_rlpm_menu_id_mtree;
ALTER TABLE IF EXISTS ONLY caits.org_location_mst DROP CONSTRAINT IF EXISTS fk_org_location_mst_loc_manager_emp_id_emp_hrc_empl_c5a492bf;
ALTER TABLE IF EXISTS ONLY caits.org_location_mst DROP CONSTRAINT IF EXISTS fk_org_location_mst_loc_entity_id_ent_org_entity_ms_040dd84e;
ALTER TABLE IF EXISTS ONLY caits.org_location_mst DROP CONSTRAINT IF EXISTS fk_org_location_mst_loc_bu_id_bu_org_businessunit_m_c2b70f71;
ALTER TABLE IF EXISTS ONLY caits.org_businessunit_mst DROP CONSTRAINT IF EXISTS fk_org_businessunit_mst_bu_manager_emp_id_emp_hrc_e_2cc1db0b;
ALTER TABLE IF EXISTS ONLY caits.org_businessunit_mst DROP CONSTRAINT IF EXISTS fk_org_businessunit_mst_bu_entity_id_ent_org_entity_0069ae61;
ALTER TABLE IF EXISTS ONLY caits.ntf_notification_mst DROP CONSTRAINT IF EXISTS fk_ntf_user;
ALTER TABLE IF EXISTS ONLY caits.ntf_push_subscription_dtl DROP CONSTRAINT IF EXISTS fk_nps_user;
ALTER TABLE IF EXISTS ONLY caits.inv_item_mst DROP CONSTRAINT IF EXISTS fk_item_parent_item;
ALTER TABLE IF EXISTS ONLY caits.inv_stock_mst DROP CONSTRAINT IF EXISTS fk_inv_stock_mst_stk_uom_id_unt_unit_mst_unt_unit_id;
ALTER TABLE IF EXISTS ONLY caits.inv_stock_mst DROP CONSTRAINT IF EXISTS fk_inv_stock_mst_stk_location_id_loc_org_location_m_81f5aaa8;
ALTER TABLE IF EXISTS ONLY caits.inv_stock_mst DROP CONSTRAINT IF EXISTS fk_inv_stock_mst_stk_last_txn_header_id_txh_txn_hea_256f23e9;
ALTER TABLE IF EXISTS ONLY caits.inv_stock_mst DROP CONSTRAINT IF EXISTS fk_inv_stock_mst_stk_item_id_itm_inv_item_mst_itm_item_id;
ALTER TABLE IF EXISTS ONLY caits.inv_item_mst DROP CONSTRAINT IF EXISTS fk_inv_item_mst_itm_uom_id_unt_unit_mst_unt_unit_id;
ALTER TABLE IF EXISTS ONLY caits.inv_item_mst DROP CONSTRAINT IF EXISTS fk_inv_item_mst_itm_subcategory_id_scat_subcategory_99d309d6;
ALTER TABLE IF EXISTS ONLY caits.inv_item_mst DROP CONSTRAINT IF EXISTS fk_inv_item_mst_itm_entity_id_ent;
ALTER TABLE IF EXISTS ONLY caits.inv_item_mst DROP CONSTRAINT IF EXISTS fk_inv_item_mst_itm_current_location_id_loc_org_loc_cf8e0bec;
ALTER TABLE IF EXISTS ONLY caits.inv_item_mst DROP CONSTRAINT IF EXISTS fk_inv_item_mst_itm_category_id_cat_category_mst_ca_2fa999ed;
ALTER TABLE IF EXISTS ONLY caits.inv_bls_mst DROP CONSTRAINT IF EXISTS fk_inv_bls_mst_ibm_issued_to_emp_id_emp;
ALTER TABLE IF EXISTS ONLY caits.hrc_employee_mst DROP CONSTRAINT IF EXISTS fk_hrc_employee_mst_emp_role_id_rol_sysm_roles_mst__6430f9b7;
ALTER TABLE IF EXISTS ONLY caits.hrc_employee_mst DROP CONSTRAINT IF EXISTS fk_hrc_employee_mst_emp_reporting_to_emp_id_emp_hrc_97372481;
ALTER TABLE IF EXISTS ONLY caits.hrc_employee_mst DROP CONSTRAINT IF EXISTS fk_hrc_employee_mst_emp_base_location_id_loc_org_lo_bc850ca1;
ALTER TABLE IF EXISTS ONLY caits.genmaster_mst DROP CONSTRAINT IF EXISTS fk_genmaster_mst_gmst_gentype_id_gtyp_gentype_mst_g_aef4b84f;
ALTER TABLE IF EXISTS ONLY caits.hrc_employee_mst DROP CONSTRAINT IF EXISTS fk_emp_department_dept;
ALTER TABLE IF EXISTS ONLY caits.hrc_department_mst DROP CONSTRAINT IF EXISTS fk_dept_location;
ALTER TABLE IF EXISTS ONLY caits.hrc_department_mst DROP CONSTRAINT IF EXISTS fk_dept_head_emp;
ALTER TABLE IF EXISTS ONLY caits.hrc_department_mst DROP CONSTRAINT IF EXISTS fk_dept_entity;
ALTER TABLE IF EXISTS ONLY caits.hrc_department_mst DROP CONSTRAINT IF EXISTS fk_dept_bu;
ALTER TABLE IF EXISTS ONLY caits.dash_role_widget_dtl DROP CONSTRAINT IF EXISTS fk_dash_widget;
ALTER TABLE IF EXISTS ONLY caits.dash_role_widget_dtl DROP CONSTRAINT IF EXISTS fk_dash_role;
DROP INDEX IF EXISTS caits.uq_rlpm_role_menu;
DROP INDEX IF EXISTS caits.uq_org_location_entity_system_role;
DROP INDEX IF EXISTS caits.uq_inv_item_location_mapping;
DROP INDEX IF EXISTS caits.uq_inv_item_bu_mapping;
DROP INDEX IF EXISTS caits.uq_bls_serial_no;
DROP INDEX IF EXISTS caits.uq_bls_item_batch;
DROP INDEX IF EXISTS caits.uq_bls_dummy_per_item;
DROP INDEX IF EXISTS caits.uq_access_exception;
DROP INDEX IF EXISTS caits.ix_user_favourite_user;
DROP INDEX IF EXISTS caits.ix_user_access_exception_emp;
DROP INDEX IF EXISTS caits.ix_uloc_user;
DROP INDEX IF EXISTS caits.ix_txn_header_type_status;
DROP INDEX IF EXISTS caits.ix_txn_header_type_date;
DROP INDEX IF EXISTS caits.ix_txn_header_to_loc;
DROP INDEX IF EXISTS caits.ix_txn_header_location;
DROP INDEX IF EXISTS caits.ix_txn_header_list;
DROP INDEX IF EXISTS caits.ix_txn_header_from_loc;
DROP INDEX IF EXISTS caits.ix_txn_detail_serial_lower;
DROP INDEX IF EXISTS caits.ix_txn_detail_item;
DROP INDEX IF EXISTS caits.ix_txn_detail_issued_to;
DROP INDEX IF EXISTS caits.ix_txn_detail_header;
DROP INDEX IF EXISTS caits.ix_txn_detail_bls;
DROP INDEX IF EXISTS caits.ix_stock_location_active;
DROP INDEX IF EXISTS caits.ix_stock_item_location;
DROP INDEX IF EXISTS caits.ix_role_permission_role;
DROP INDEX IF EXISTS caits.ix_ntf_user_unread;
DROP INDEX IF EXISTS caits.ix_ntf_user_created;
DROP INDEX IF EXISTS caits.ix_nps_user;
DROP INDEX IF EXISTS caits.ix_item_parent;
DROP INDEX IF EXISTS caits.ix_item_code_lower;
DROP INDEX IF EXISTS caits.ix_inv_bls_issued_to;
DROP INDEX IF EXISTS caits.ix_employee_email_lower;
DROP INDEX IF EXISTS caits.ix_dept_location;
DROP INDEX IF EXISTS caits.ix_dept_bu;
DROP INDEX IF EXISTS caits.ix_dash_role_widget_role;
DROP INDEX IF EXISTS caits.ix_bls_location;
DROP INDEX IF EXISTS caits.ix_bls_item;
DROP INDEX IF EXISTS caits.ix_bls_active_issued;
ALTER TABLE IF EXISTS ONLY caits.sysm_user_location_mapping_dtl DROP CONSTRAINT IF EXISTS uq_user_location;
ALTER TABLE IF EXISTS ONLY caits.sysm_user_favourite_menu_dtl DROP CONSTRAINT IF EXISTS uq_user_favourite_menu;
ALTER TABLE IF EXISTS ONLY caits.txn_header_mst DROP CONSTRAINT IF EXISTS uq_txn_header_mst_txh_doc_type_txh_doc_no;
ALTER TABLE IF EXISTS ONLY caits.ntf_push_subscription_dtl DROP CONSTRAINT IF EXISTS uq_nps_endpoint;
ALTER TABLE IF EXISTS ONLY caits.hrc_department_mst DROP CONSTRAINT IF EXISTS uq_dept_code;
ALTER TABLE IF EXISTS ONLY caits.dash_widget_mst DROP CONSTRAINT IF EXISTS uq_dash_widget_code;
ALTER TABLE IF EXISTS ONLY caits.dash_role_widget_dtl DROP CONSTRAINT IF EXISTS uq_dash_role_widget;
ALTER TABLE IF EXISTS ONLY caits.unit_mst DROP CONSTRAINT IF EXISTS unit_mst_unt_unit_code_key;
ALTER TABLE IF EXISTS ONLY caits.unit_mst DROP CONSTRAINT IF EXISTS unit_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits.txn_header_mst DROP CONSTRAINT IF EXISTS txn_header_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits.txn_detail_dtl DROP CONSTRAINT IF EXISTS txn_detail_dtl_pkey;
ALTER TABLE IF EXISTS ONLY caits.sysm_userlogin_mst DROP CONSTRAINT IF EXISTS sysm_userlogin_mst_usr_login_id_key;
ALTER TABLE IF EXISTS ONLY caits.sysm_userlogin_mst DROP CONSTRAINT IF EXISTS sysm_userlogin_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits.sysm_useraccess_exception_dtl DROP CONSTRAINT IF EXISTS sysm_useraccess_exception_dtl_pkey;
ALTER TABLE IF EXISTS ONLY caits.sysm_user_location_mapping_dtl DROP CONSTRAINT IF EXISTS sysm_user_location_mapping_dtl_pkey;
ALTER TABLE IF EXISTS ONLY caits.sysm_user_favourite_menu_dtl DROP CONSTRAINT IF EXISTS sysm_user_favourite_menu_dtl_pkey;
ALTER TABLE IF EXISTS ONLY caits.sysm_user_bu_mapping_dtl DROP CONSTRAINT IF EXISTS sysm_user_bu_mapping_dtl_pkey;
ALTER TABLE IF EXISTS ONLY caits.sysm_roles_mst DROP CONSTRAINT IF EXISTS sysm_roles_mst_rol_role_code_key;
ALTER TABLE IF EXISTS ONLY caits.sysm_roles_mst DROP CONSTRAINT IF EXISTS sysm_roles_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits.sysm_rolepermission_dtl DROP CONSTRAINT IF EXISTS sysm_rolepermission_dtl_pkey;
ALTER TABLE IF EXISTS ONLY caits.sysm_menutree_mst DROP CONSTRAINT IF EXISTS sysm_menutree_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits.sysm_menutree_mst DROP CONSTRAINT IF EXISTS sysm_menutree_mst_mtree_menu_code_key;
ALTER TABLE IF EXISTS ONLY caits.subcategory_mst DROP CONSTRAINT IF EXISTS subcategory_mst_scat_subcategory_code_key;
ALTER TABLE IF EXISTS ONLY caits.subcategory_mst DROP CONSTRAINT IF EXISTS subcategory_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits.org_location_mst DROP CONSTRAINT IF EXISTS org_location_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits.org_location_mst DROP CONSTRAINT IF EXISTS org_location_mst_loc_location_code_key;
ALTER TABLE IF EXISTS ONLY caits.org_entity_mst DROP CONSTRAINT IF EXISTS org_entity_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits.org_entity_mst DROP CONSTRAINT IF EXISTS org_entity_mst_ent_entity_code_key;
ALTER TABLE IF EXISTS ONLY caits.org_businessunit_mst DROP CONSTRAINT IF EXISTS org_businessunit_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits.org_businessunit_mst DROP CONSTRAINT IF EXISTS org_businessunit_mst_bu_bu_code_key;
ALTER TABLE IF EXISTS ONLY caits.ntf_push_subscription_dtl DROP CONSTRAINT IF EXISTS ntf_push_subscription_dtl_pkey;
ALTER TABLE IF EXISTS ONLY caits.ntf_notification_mst DROP CONSTRAINT IF EXISTS ntf_notification_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits.inv_vendor_mst DROP CONSTRAINT IF EXISTS inv_vendor_mst_vnd_vendor_code_key;
ALTER TABLE IF EXISTS ONLY caits.inv_vendor_mst DROP CONSTRAINT IF EXISTS inv_vendor_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits.inv_stock_mst DROP CONSTRAINT IF EXISTS inv_stock_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits.inv_item_mst DROP CONSTRAINT IF EXISTS inv_item_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits.inv_item_mst DROP CONSTRAINT IF EXISTS inv_item_mst_itm_item_code_key;
ALTER TABLE IF EXISTS ONLY caits.inv_item_location_mapping_dtl DROP CONSTRAINT IF EXISTS inv_item_location_mapping_dtl_pkey;
ALTER TABLE IF EXISTS ONLY caits.inv_item_bu_mapping_dtl DROP CONSTRAINT IF EXISTS inv_item_bu_mapping_dtl_pkey;
ALTER TABLE IF EXISTS ONLY caits.inv_bls_mst DROP CONSTRAINT IF EXISTS inv_bls_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits.hrc_employee_mst DROP CONSTRAINT IF EXISTS hrc_employee_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits.hrc_employee_mst DROP CONSTRAINT IF EXISTS hrc_employee_mst_emp_employee_code_key;
ALTER TABLE IF EXISTS ONLY caits.hrc_employee_mst DROP CONSTRAINT IF EXISTS hrc_employee_mst_emp_email_key;
ALTER TABLE IF EXISTS ONLY caits.hrc_department_mst DROP CONSTRAINT IF EXISTS hrc_department_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits.gentype_mst DROP CONSTRAINT IF EXISTS gentype_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits.gentype_mst DROP CONSTRAINT IF EXISTS gentype_mst_gtyp_type_code_key;
ALTER TABLE IF EXISTS ONLY caits.genmaster_mst DROP CONSTRAINT IF EXISTS genmaster_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits.genmaster_mst DROP CONSTRAINT IF EXISTS genmaster_mst_gmst_value_code_key;
ALTER TABLE IF EXISTS ONLY caits.dash_widget_mst DROP CONSTRAINT IF EXISTS dash_widget_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits.dash_role_widget_dtl DROP CONSTRAINT IF EXISTS dash_role_widget_dtl_pkey;
ALTER TABLE IF EXISTS ONLY caits.category_mst DROP CONSTRAINT IF EXISTS category_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits.category_mst DROP CONSTRAINT IF EXISTS category_mst_cat_category_code_key;
ALTER TABLE IF EXISTS caits.sysm_user_location_mapping_dtl ALTER COLUMN uloc_user_loc_access_id DROP DEFAULT;
ALTER TABLE IF EXISTS caits.inv_item_location_mapping_dtl ALTER COLUMN ilim_item_loc_access_id DROP DEFAULT;
ALTER TABLE IF EXISTS caits.inv_item_bu_mapping_dtl ALTER COLUMN iibm_item_bu_access_id DROP DEFAULT;
ALTER TABLE IF EXISTS caits.inv_bls_mst ALTER COLUMN ibm_bls_id DROP DEFAULT;
DROP TABLE IF EXISTS caits.unit_mst;
DROP TABLE IF EXISTS caits.txn_header_mst;
DROP TABLE IF EXISTS caits.txn_detail_dtl;
DROP TABLE IF EXISTS caits.sysm_userlogin_mst;
DROP TABLE IF EXISTS caits.sysm_useraccess_exception_dtl;
DROP SEQUENCE IF EXISTS caits.sysm_user_location_mapping_dtl_uloc_user_loc_access_id_seq;
DROP TABLE IF EXISTS caits.sysm_user_location_mapping_dtl;
DROP TABLE IF EXISTS caits.sysm_user_favourite_menu_dtl;
DROP TABLE IF EXISTS caits.sysm_user_bu_mapping_dtl;
DROP TABLE IF EXISTS caits.sysm_roles_mst;
DROP TABLE IF EXISTS caits.sysm_rolepermission_dtl;
DROP TABLE IF EXISTS caits.sysm_menutree_mst;
DROP TABLE IF EXISTS caits.subcategory_mst;
DROP TABLE IF EXISTS caits.org_location_mst;
DROP TABLE IF EXISTS caits.org_entity_mst;
DROP TABLE IF EXISTS caits.org_businessunit_mst;
DROP TABLE IF EXISTS caits.ntf_push_subscription_dtl;
DROP TABLE IF EXISTS caits.ntf_notification_mst;
DROP TABLE IF EXISTS caits.inv_vendor_mst;
DROP TABLE IF EXISTS caits.inv_stock_mst;
DROP TABLE IF EXISTS caits.inv_item_mst;
DROP SEQUENCE IF EXISTS caits.inv_item_location_mapping_dtl_ilim_item_loc_access_id_seq;
DROP TABLE IF EXISTS caits.inv_item_location_mapping_dtl;
DROP SEQUENCE IF EXISTS caits.inv_item_bu_mapping_dtl_iibm_item_bu_access_id_seq;
DROP TABLE IF EXISTS caits.inv_item_bu_mapping_dtl;
DROP SEQUENCE IF EXISTS caits.inv_bls_mst_ibm_bls_id_seq;
DROP TABLE IF EXISTS caits.inv_bls_mst;
DROP TABLE IF EXISTS caits.hrc_employee_mst;
DROP TABLE IF EXISTS caits.hrc_department_mst;
DROP TABLE IF EXISTS caits.gentype_mst;
DROP TABLE IF EXISTS caits.genmaster_mst;
DROP TABLE IF EXISTS caits.dash_widget_mst;
DROP TABLE IF EXISTS caits.dash_role_widget_dtl;
DROP TABLE IF EXISTS caits.category_mst;
DROP SCHEMA IF EXISTS caits;
--
-- Name: caits; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA caits;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: category_mst; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.category_mst (
    cat_category_id integer NOT NULL,
    cat_category_code character varying(20) NOT NULL,
    cat_category_name character varying(100) NOT NULL,
    cat_desc character varying(255),
    cat_isactive boolean NOT NULL,
    cat_created_by character varying(50),
    cat_created_on timestamp without time zone NOT NULL,
    cat_modified_by character varying(50),
    cat_modified_on timestamp without time zone
);


--
-- Name: category_mst_cat_category_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

ALTER TABLE caits.category_mst ALTER COLUMN cat_category_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits.category_mst_cat_category_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: dash_role_widget_dtl; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.dash_role_widget_dtl (
    dshr_id integer NOT NULL,
    dshr_role_id_rol integer NOT NULL,
    dshr_widget_id_dshw integer NOT NULL,
    dshr_sort_order integer DEFAULT 100 NOT NULL,
    dshr_col_span integer DEFAULT 1 NOT NULL,
    dshr_is_visible boolean DEFAULT true NOT NULL
);


--
-- Name: TABLE dash_role_widget_dtl; Type: COMMENT; Schema: caits; Owner: -
--

COMMENT ON TABLE caits.dash_role_widget_dtl IS 'Role → widget assignment so each role gets a different dashboard';


--
-- Name: dash_role_widget_dtl_dshr_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

ALTER TABLE caits.dash_role_widget_dtl ALTER COLUMN dshr_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits.dash_role_widget_dtl_dshr_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: dash_widget_mst; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.dash_widget_mst (
    dshw_widget_id integer NOT NULL,
    dshw_widget_code character varying(40) NOT NULL,
    dshw_widget_type character varying(20) NOT NULL,
    dshw_title character varying(120) NOT NULL,
    dshw_subtitle character varying(200),
    dshw_icon character varying(40),
    dshw_tone character varying(20),
    dshw_link_path character varying(200),
    dshw_required_menu_code character varying(20),
    dshw_default_col_span integer DEFAULT 1 NOT NULL,
    dshw_default_sort integer DEFAULT 100 NOT NULL,
    dshw_isactive boolean DEFAULT true NOT NULL,
    dshw_created_on timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_dash_widget_type CHECK (((dshw_widget_type)::text = ANY ((ARRAY['KPI'::character varying, 'ALERT'::character varying, 'CHART'::character varying, 'PANEL'::character varying, 'LIST'::character varying, 'SHORTCUTS'::character varying])::text[])))
);


--
-- Name: TABLE dash_widget_mst; Type: COMMENT; Schema: caits; Owner: -
--

COMMENT ON TABLE caits.dash_widget_mst IS 'Dashboard widget catalog; UI renders by type/code, not a fixed layout';


--
-- Name: COLUMN dash_widget_mst.dshw_required_menu_code; Type: COMMENT; Schema: caits; Owner: -
--

COMMENT ON COLUMN caits.dash_widget_mst.dshw_required_menu_code IS 'If set, widget is shown only when the user has view permission on that menu';


--
-- Name: dash_widget_mst_dshw_widget_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

ALTER TABLE caits.dash_widget_mst ALTER COLUMN dshw_widget_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits.dash_widget_mst_dshw_widget_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: genmaster_mst; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.genmaster_mst (
    gmst_genmaster_id integer NOT NULL,
    gmst_value_code character varying(20) NOT NULL,
    gmst_value_name character varying(100) NOT NULL,
    gmst_gentype_id_gtyp integer NOT NULL,
    gmst_sort_order integer,
    gmst_desc character varying(255),
    gmst_isactive boolean NOT NULL,
    gmst_created_by character varying(50),
    gmst_created_on timestamp without time zone NOT NULL,
    gmst_modified_by character varying(50),
    gmst_modified_on timestamp without time zone
);


--
-- Name: genmaster_mst_gmst_genmaster_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

ALTER TABLE caits.genmaster_mst ALTER COLUMN gmst_genmaster_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits.genmaster_mst_gmst_genmaster_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: gentype_mst; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.gentype_mst (
    gtyp_gentype_id integer NOT NULL,
    gtyp_type_code character varying(20) NOT NULL,
    gtyp_type_name character varying(100) NOT NULL,
    gtyp_desc character varying(255),
    gtyp_isactive boolean NOT NULL,
    gtyp_created_by character varying(50),
    gtyp_created_on timestamp without time zone NOT NULL,
    gtyp_modified_by character varying(50),
    gtyp_modified_on timestamp without time zone
);


--
-- Name: gentype_mst_gtyp_gentype_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

ALTER TABLE caits.gentype_mst ALTER COLUMN gtyp_gentype_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits.gentype_mst_gtyp_gentype_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: hrc_department_mst; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.hrc_department_mst (
    dept_department_id integer NOT NULL,
    dept_department_code character varying(20) NOT NULL,
    dept_department_name character varying(100) NOT NULL,
    dept_entity_id_ent integer NOT NULL,
    dept_head_emp_id_emp integer,
    dept_desc character varying(250),
    dept_isactive boolean DEFAULT true NOT NULL,
    dept_created_by character varying(50),
    dept_created_on timestamp without time zone DEFAULT now() NOT NULL,
    dept_modified_by character varying(50),
    dept_modified_on timestamp without time zone,
    dept_bu_id_bu integer,
    dept_location_id_loc integer NOT NULL
);


--
-- Name: COLUMN hrc_department_mst.dept_bu_id_bu; Type: COMMENT; Schema: caits; Owner: -
--

COMMENT ON COLUMN caits.hrc_department_mst.dept_bu_id_bu IS 'Operating Unit this department belongs to (optional; must match dept_entity_id_ent)';


--
-- Name: COLUMN hrc_department_mst.dept_location_id_loc; Type: COMMENT; Schema: caits; Owner: -
--

COMMENT ON COLUMN caits.hrc_department_mst.dept_location_id_loc IS 'Default store/location for this department (required for requisitions and issues).';


--
-- Name: hrc_department_mst_dept_department_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

ALTER TABLE caits.hrc_department_mst ALTER COLUMN dept_department_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME caits.hrc_department_mst_dept_department_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: hrc_employee_mst; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.hrc_employee_mst (
    emp_employee_id integer NOT NULL,
    emp_employee_code character varying(20) NOT NULL,
    emp_first_name character varying(50) NOT NULL,
    emp_last_name character varying(50),
    emp_gender character varying(1),
    emp_dob date,
    emp_joining_date date,
    emp_employment_type character varying(20),
    emp_designation character varying(100),
    emp_email character varying(100) NOT NULL,
    emp_phone character varying(15),
    emp_alt_phone character varying(15),
    emp_role_id_rol integer,
    emp_base_location_id_loc integer,
    emp_reporting_to_emp_id_emp integer,
    emp_isactive boolean NOT NULL,
    emp_created_by character varying(50),
    emp_created_on timestamp without time zone NOT NULL,
    emp_modified_by character varying(50),
    emp_modified_on timestamp without time zone,
    emp_department_id_dept integer,
    emp_is_system_employee boolean DEFAULT false NOT NULL
);


--
-- Name: COLUMN hrc_employee_mst.emp_is_system_employee; Type: COMMENT; Schema: caits; Owner: -
--

COMMENT ON COLUMN caits.hrc_employee_mst.emp_is_system_employee IS 'Hidden bootstrap employee (not listed in Employee Master)';


--
-- Name: hrc_employee_mst_emp_employee_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

ALTER TABLE caits.hrc_employee_mst ALTER COLUMN emp_employee_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits.hrc_employee_mst_emp_employee_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: inv_bls_mst; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.inv_bls_mst (
    ibm_bls_id integer NOT NULL,
    ibm_entity_id_ent integer,
    ibm_item_id_itm integer NOT NULL,
    ibm_batch_no character varying(50),
    ibm_lot_no character varying(50),
    ibm_serial_no character varying(100),
    ibm_mfg_date date,
    ibm_expiry_date date,
    ibm_best_before_date date,
    ibm_ip_address character varying(45),
    ibm_mac_address character varying(17),
    ibm_hostname character varying(150),
    ibm_item_condition character varying(50),
    ibm_current_location_id_loc integer,
    ibm_is_dummy boolean DEFAULT false NOT NULL,
    ibm_isactive boolean DEFAULT true NOT NULL,
    ibm_islocked boolean DEFAULT false NOT NULL,
    ibm_locked_reason character varying(200),
    ibm_locked_on timestamp without time zone,
    ibm_created_by character varying(50),
    ibm_created_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ibm_modified_by character varying(50),
    ibm_modified_on timestamp without time zone,
    ibm_issued_to_emp_id_emp integer
);


--
-- Name: COLUMN inv_bls_mst.ibm_issued_to_emp_id_emp; Type: COMMENT; Schema: caits; Owner: -
--

COMMENT ON COLUMN caits.inv_bls_mst.ibm_issued_to_emp_id_emp IS 'Employee currently holding this BLS unit (copied from txn line when condition is Issued)';


--
-- Name: inv_bls_mst_ibm_bls_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

CREATE SEQUENCE caits.inv_bls_mst_ibm_bls_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inv_bls_mst_ibm_bls_id_seq; Type: SEQUENCE OWNED BY; Schema: caits; Owner: -
--

ALTER SEQUENCE caits.inv_bls_mst_ibm_bls_id_seq OWNED BY caits.inv_bls_mst.ibm_bls_id;


--
-- Name: inv_item_bu_mapping_dtl; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.inv_item_bu_mapping_dtl (
    iibm_item_bu_access_id integer NOT NULL,
    iibm_item_id_itm integer NOT NULL,
    iibm_bu_id_bu integer NOT NULL
);


--
-- Name: inv_item_bu_mapping_dtl_iibm_item_bu_access_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

CREATE SEQUENCE caits.inv_item_bu_mapping_dtl_iibm_item_bu_access_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inv_item_bu_mapping_dtl_iibm_item_bu_access_id_seq; Type: SEQUENCE OWNED BY; Schema: caits; Owner: -
--

ALTER SEQUENCE caits.inv_item_bu_mapping_dtl_iibm_item_bu_access_id_seq OWNED BY caits.inv_item_bu_mapping_dtl.iibm_item_bu_access_id;


--
-- Name: inv_item_location_mapping_dtl; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.inv_item_location_mapping_dtl (
    ilim_item_loc_access_id integer NOT NULL,
    ilim_item_id_itm integer NOT NULL,
    ilim_location_id_loc integer NOT NULL
);


--
-- Name: inv_item_location_mapping_dtl_ilim_item_loc_access_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

CREATE SEQUENCE caits.inv_item_location_mapping_dtl_ilim_item_loc_access_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inv_item_location_mapping_dtl_ilim_item_loc_access_id_seq; Type: SEQUENCE OWNED BY; Schema: caits; Owner: -
--

ALTER SEQUENCE caits.inv_item_location_mapping_dtl_ilim_item_loc_access_id_seq OWNED BY caits.inv_item_location_mapping_dtl.ilim_item_loc_access_id;


--
-- Name: inv_item_mst; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.inv_item_mst (
    itm_item_id integer NOT NULL,
    itm_item_code character varying(30) NOT NULL,
    itm_item_name character varying(150) NOT NULL,
    itm_item_type character varying(20) NOT NULL,
    itm_category_id_cat integer,
    itm_subcategory_id_scat integer,
    itm_uom_id_unt integer NOT NULL,
    itm_standard_cost numeric(18,2),
    itm_image_url character varying(255),
    itm_desc character varying(500),
    itm_remarks character varying(255),
    itm_asset_type character varying(50),
    itm_make_brand character varying(100),
    itm_model character varying(100),
    itm_useful_life_years numeric(5,2),
    itm_depreciation_method character varying(30),
    itm_depreciation_rate numeric(5,2),
    itm_current_location_id_loc integer,
    itm_is_serialized boolean,
    itm_is_returnable boolean,
    itm_is_under_amc boolean,
    itm_is_insurance_required boolean,
    itm_consumable_type character varying(30),
    itm_track_batch_lot boolean,
    itm_track_expiry boolean,
    itm_is_consumable boolean,
    itm_allow_negative_stock boolean,
    itm_isactive boolean NOT NULL,
    itm_created_by character varying(50),
    itm_created_on timestamp without time zone NOT NULL,
    itm_modified_by character varying(50),
    itm_modified_on timestamp without time zone,
    itm_inspection_needed boolean DEFAULT false,
    itm_ram character varying(50),
    itm_storage character varying(100),
    itm_processor character varying(100),
    itm_product_no character varying(100),
    itm_parent_item_id_itm integer,
    itm_entity_id_ent integer,
    itm_bu_access_scope character varying(20) DEFAULT 'ALL'::character varying,
    itm_location_access_scope character varying(20) DEFAULT 'SELECTED'::character varying
);


--
-- Name: COLUMN inv_item_mst.itm_inspection_needed; Type: COMMENT; Schema: caits; Owner: -
--

COMMENT ON COLUMN caits.inv_item_mst.itm_inspection_needed IS 'When true, item requires inspection on receipt / inward';


--
-- Name: COLUMN inv_item_mst.itm_ram; Type: COMMENT; Schema: caits; Owner: -
--

COMMENT ON COLUMN caits.inv_item_mst.itm_ram IS 'Installed RAM, e.g. 16 GB';


--
-- Name: COLUMN inv_item_mst.itm_storage; Type: COMMENT; Schema: caits; Owner: -
--

COMMENT ON COLUMN caits.inv_item_mst.itm_storage IS 'Installed storage, e.g. 512GB SSD (NVMe)';


--
-- Name: COLUMN inv_item_mst.itm_product_no; Type: COMMENT; Schema: caits; Owner: -
--

COMMENT ON COLUMN caits.inv_item_mst.itm_product_no IS 'Manufacturer product number, distinct from serial no';


--
-- Name: COLUMN inv_item_mst.itm_parent_item_id_itm; Type: COMMENT; Schema: caits; Owner: -
--

COMMENT ON COLUMN caits.inv_item_mst.itm_parent_item_id_itm IS 'Parent asset when this item is an attached peripheral or component';


--
-- Name: COLUMN inv_item_mst.itm_entity_id_ent; Type: COMMENT; Schema: caits; Owner: -
--

COMMENT ON COLUMN caits.inv_item_mst.itm_entity_id_ent IS 'Organization (entity) this catalog item belongs to';


--
-- Name: COLUMN inv_item_mst.itm_bu_access_scope; Type: COMMENT; Schema: caits; Owner: -
--

COMMENT ON COLUMN caits.inv_item_mst.itm_bu_access_scope IS 'ALL or SELECTED operating units';


--
-- Name: COLUMN inv_item_mst.itm_location_access_scope; Type: COMMENT; Schema: caits; Owner: -
--

COMMENT ON COLUMN caits.inv_item_mst.itm_location_access_scope IS 'ALL or SELECTED locations';


--
-- Name: inv_item_mst_itm_item_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

ALTER TABLE caits.inv_item_mst ALTER COLUMN itm_item_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits.inv_item_mst_itm_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: inv_stock_mst; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.inv_stock_mst (
    stk_stock_id integer NOT NULL,
    stk_item_id_itm integer NOT NULL,
    stk_location_id_loc integer NOT NULL,
    stk_location_bin character varying(50),
    stk_batch_lot_no character varying(50),
    stk_uom_id_unt integer NOT NULL,
    stk_opening_qty numeric(18,3),
    stk_inward_qty numeric(18,3),
    stk_issued_qty numeric(18,3),
    stk_transferred_in_qty numeric(18,3),
    stk_transferred_out_qty numeric(18,3),
    stk_returned_qty numeric(18,3),
    stk_adjusted_qty numeric(18,3),
    stk_current_qty numeric(18,3) NOT NULL,
    stk_reserved_qty numeric(18,3),
    stk_available_qty numeric(18,3),
    stk_reorder_level numeric(18,3),
    stk_min_stock_level numeric(18,3),
    stk_max_stock_level numeric(18,3),
    stk_avg_rate numeric(18,2),
    stk_stock_value numeric(18,2),
    stk_expiry_date date,
    stk_last_txn_header_id_txh integer,
    stk_last_transaction_date date,
    stk_isactive boolean NOT NULL,
    stk_created_by character varying(50),
    stk_created_on timestamp without time zone NOT NULL,
    stk_modified_by character varying(50),
    stk_modified_on timestamp without time zone,
    CONSTRAINT ck_inv_stock_current_qty_nonneg CHECK ((stk_current_qty >= (0)::numeric))
);


--
-- Name: inv_stock_mst_stk_stock_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

ALTER TABLE caits.inv_stock_mst ALTER COLUMN stk_stock_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits.inv_stock_mst_stk_stock_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: inv_vendor_mst; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.inv_vendor_mst (
    vnd_vendor_id integer NOT NULL,
    vnd_vendor_code character varying(20) NOT NULL,
    vnd_vendor_name character varying(150) NOT NULL,
    vnd_party_type character varying(20) NOT NULL,
    vnd_gstin character varying(20),
    vnd_pan_no character varying(15),
    vnd_rating integer,
    vnd_add1 character varying(150),
    vnd_add2 character varying(150),
    vnd_city character varying(50),
    vnd_state character varying(50),
    vnd_pin character varying(10),
    vnd_country character varying(50),
    vnd_contact_person character varying(100),
    vnd_phone character varying(15) NOT NULL,
    vnd_alt_phone character varying(15),
    vnd_email character varying(100),
    vnd_website character varying(150),
    vnd_notes character varying(255),
    vnd_isactive boolean NOT NULL,
    vnd_created_by character varying(50),
    vnd_created_on timestamp without time zone NOT NULL,
    vnd_modified_by character varying(50),
    vnd_modified_on timestamp without time zone
);


--
-- Name: inv_vendor_mst_vnd_vendor_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

ALTER TABLE caits.inv_vendor_mst ALTER COLUMN vnd_vendor_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits.inv_vendor_mst_vnd_vendor_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: ntf_notification_mst; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.ntf_notification_mst (
    ntf_notification_id integer NOT NULL,
    ntf_user_id_usr integer NOT NULL,
    ntf_title character varying(200) NOT NULL,
    ntf_body character varying(1000) NOT NULL,
    ntf_kind character varying(40) NOT NULL,
    ntf_menu_code character varying(20),
    ntf_doc_type character varying(40),
    ntf_doc_id integer,
    ntf_link_url character varying(300),
    ntf_is_read boolean DEFAULT false NOT NULL,
    ntf_created_on timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE ntf_notification_mst; Type: COMMENT; Schema: caits; Owner: -
--

COMMENT ON TABLE caits.ntf_notification_mst IS 'Per-user in-app notifications; recipients are resolved from role/menu permissions';


--
-- Name: ntf_notification_mst_ntf_notification_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

ALTER TABLE caits.ntf_notification_mst ALTER COLUMN ntf_notification_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits.ntf_notification_mst_ntf_notification_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: ntf_push_subscription_dtl; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.ntf_push_subscription_dtl (
    nps_subscription_id integer NOT NULL,
    nps_user_id_usr integer NOT NULL,
    nps_endpoint text NOT NULL,
    nps_p256dh text NOT NULL,
    nps_auth text NOT NULL,
    nps_user_agent character varying(400),
    nps_created_on timestamp without time zone DEFAULT now() NOT NULL,
    nps_modified_on timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE ntf_push_subscription_dtl; Type: COMMENT; Schema: caits; Owner: -
--

COMMENT ON TABLE caits.ntf_push_subscription_dtl IS 'Web Push subscriptions so OS notifications work when the browser tab is closed';


--
-- Name: ntf_push_subscription_dtl_nps_subscription_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

ALTER TABLE caits.ntf_push_subscription_dtl ALTER COLUMN nps_subscription_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits.ntf_push_subscription_dtl_nps_subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: org_businessunit_mst; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.org_businessunit_mst (
    bu_bu_id integer NOT NULL,
    bu_bu_code character varying(20) NOT NULL,
    bu_bu_name character varying(150) NOT NULL,
    bu_entity_id_ent integer NOT NULL,
    bu_bu_type character varying(30),
    bu_manager_emp_id_emp integer,
    bu_add1 character varying(150),
    bu_add2 character varying(150),
    bu_city character varying(50),
    bu_state character varying(50),
    bu_pin character varying(10),
    bu_isactive boolean NOT NULL,
    bu_created_by character varying(50),
    bu_created_on timestamp without time zone NOT NULL,
    bu_modified_by character varying(50),
    bu_modified_on timestamp without time zone
);


--
-- Name: org_businessunit_mst_bu_bu_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

ALTER TABLE caits.org_businessunit_mst ALTER COLUMN bu_bu_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits.org_businessunit_mst_bu_bu_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: org_entity_mst; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.org_entity_mst (
    ent_entity_id integer NOT NULL,
    ent_entity_code character varying(20) NOT NULL,
    ent_entity_name character varying(150) NOT NULL,
    ent_short_name character varying(30),
    ent_legal_name character varying(200),
    ent_gstin character varying(20),
    ent_pan_no character varying(15),
    ent_cin character varying(25),
    ent_add1 character varying(150),
    ent_add2 character varying(150),
    ent_city character varying(50),
    ent_state character varying(50),
    ent_pin character varying(10),
    ent_country character varying(50),
    ent_contact_person character varying(100),
    ent_phone character varying(15),
    ent_email character varying(100),
    ent_isactive boolean NOT NULL,
    ent_created_by character varying(50),
    ent_created_on timestamp without time zone NOT NULL,
    ent_modified_by character varying(50),
    ent_modified_on timestamp without time zone
);


--
-- Name: org_entity_mst_ent_entity_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

ALTER TABLE caits.org_entity_mst ALTER COLUMN ent_entity_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits.org_entity_mst_ent_entity_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: org_location_mst; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.org_location_mst (
    loc_location_id integer NOT NULL,
    loc_location_code character varying(20) NOT NULL,
    loc_location_name character varying(150) NOT NULL,
    loc_location_type character varying(30),
    loc_entity_id_ent integer NOT NULL,
    loc_bu_id_bu integer,
    loc_manager_emp_id_emp integer,
    loc_add1 character varying(150),
    loc_add2 character varying(150),
    loc_city character varying(50),
    loc_pin character varying(10),
    loc_isactive boolean NOT NULL,
    loc_created_by character varying(50),
    loc_created_on timestamp without time zone NOT NULL,
    loc_modified_by character varying(50),
    loc_modified_on timestamp without time zone,
    loc_is_system_location boolean DEFAULT false NOT NULL,
    loc_system_role character varying(30),
    loc_print_location_name character varying(150)
);


--
-- Name: org_location_mst_loc_location_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

ALTER TABLE caits.org_location_mst ALTER COLUMN loc_location_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits.org_location_mst_loc_location_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: subcategory_mst; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.subcategory_mst (
    scat_subcategory_id integer NOT NULL,
    scat_subcategory_code character varying(20) NOT NULL,
    scat_subcategory_name character varying(100) NOT NULL,
    scat_category_id_cat integer NOT NULL,
    scat_desc character varying(255),
    scat_isactive boolean NOT NULL,
    scat_created_by character varying(50),
    scat_created_on timestamp without time zone NOT NULL,
    scat_modified_by character varying(50),
    scat_modified_on timestamp without time zone
);


--
-- Name: subcategory_mst_scat_subcategory_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

ALTER TABLE caits.subcategory_mst ALTER COLUMN scat_subcategory_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits.subcategory_mst_scat_subcategory_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sysm_menutree_mst; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.sysm_menutree_mst (
    mtree_menu_id integer NOT NULL,
    mtree_menu_code character varying(50) NOT NULL,
    mtree_menu_label character varying(100) NOT NULL,
    mtree_menu_group character varying(50) NOT NULL,
    mtree_sort_order integer NOT NULL,
    mtree_icon character varying(10),
    mtree_doc_type character varying(30),
    mtree_supports_view boolean NOT NULL,
    mtree_supports_create boolean NOT NULL,
    mtree_supports_edit boolean NOT NULL,
    mtree_supports_delete boolean NOT NULL,
    mtree_supports_approve boolean NOT NULL,
    mtree_supports_reject boolean NOT NULL,
    mtree_supports_print boolean NOT NULL,
    mtree_supports_export boolean NOT NULL,
    mtree_is_system_menu boolean,
    mtree_isactive boolean NOT NULL,
    mtree_created_by character varying(50),
    mtree_created_on timestamp without time zone NOT NULL,
    mtree_modified_by character varying(50),
    mtree_modified_on timestamp without time zone,
    mtree_group_sort_order integer DEFAULT 90 NOT NULL
);


--
-- Name: sysm_menutree_mst_mtree_menu_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

ALTER TABLE caits.sysm_menutree_mst ALTER COLUMN mtree_menu_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits.sysm_menutree_mst_mtree_menu_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sysm_rolepermission_dtl; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.sysm_rolepermission_dtl (
    rlpm_role_permission_id integer NOT NULL,
    rlpm_role_id_rol integer NOT NULL,
    rlpm_can_view boolean,
    rlpm_can_create boolean,
    rlpm_can_edit boolean,
    rlpm_can_delete boolean,
    rlpm_can_approve boolean,
    rlpm_can_reject boolean,
    rlpm_can_print boolean,
    rlpm_can_export boolean,
    rlpm_menu_id_mtree integer NOT NULL
);


--
-- Name: sysm_rolepermission_dtl_rlpm_role_permission_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

ALTER TABLE caits.sysm_rolepermission_dtl ALTER COLUMN rlpm_role_permission_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits.sysm_rolepermission_dtl_rlpm_role_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sysm_roles_mst; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.sysm_roles_mst (
    rol_role_id integer NOT NULL,
    rol_role_code character varying(50) NOT NULL,
    rol_role_name character varying(100) NOT NULL,
    rol_desc character varying(255),
    rol_is_system_role boolean,
    rol_isactive boolean NOT NULL,
    rol_created_by character varying(50),
    rol_created_on timestamp without time zone NOT NULL,
    rol_modified_by character varying(50),
    rol_modified_on timestamp without time zone
);


--
-- Name: sysm_roles_mst_rol_role_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

ALTER TABLE caits.sysm_roles_mst ALTER COLUMN rol_role_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits.sysm_roles_mst_rol_role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sysm_user_bu_mapping_dtl; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.sysm_user_bu_mapping_dtl (
    uboa_user_bu_access_id integer NOT NULL,
    uboa_user_id_usr integer NOT NULL,
    uboa_bu_id_bu integer NOT NULL
);


--
-- Name: sysm_user_bu_mapping_dtl_uboa_user_bu_access_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

ALTER TABLE caits.sysm_user_bu_mapping_dtl ALTER COLUMN uboa_user_bu_access_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits.sysm_user_bu_mapping_dtl_uboa_user_bu_access_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sysm_user_favourite_menu_dtl; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.sysm_user_favourite_menu_dtl (
    ufav_favourite_id integer NOT NULL,
    ufav_user_id_usr integer NOT NULL,
    ufav_menu_code_mtree character varying(20) NOT NULL,
    ufav_sort_order integer DEFAULT 0 NOT NULL,
    ufav_created_on timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE sysm_user_favourite_menu_dtl; Type: COMMENT; Schema: caits; Owner: -
--

COMMENT ON TABLE caits.sysm_user_favourite_menu_dtl IS 'Menus the user pinned to the top of their sidebar';


--
-- Name: COLUMN sysm_user_favourite_menu_dtl.ufav_menu_code_mtree; Type: COMMENT; Schema: caits; Owner: -
--

COMMENT ON COLUMN caits.sysm_user_favourite_menu_dtl.ufav_menu_code_mtree IS 'Matches sysm_menutree_mst.mtree_menu_code / navigation.ts menuCode';


--
-- Name: sysm_user_favourite_menu_dtl_ufav_favourite_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

ALTER TABLE caits.sysm_user_favourite_menu_dtl ALTER COLUMN ufav_favourite_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits.sysm_user_favourite_menu_dtl_ufav_favourite_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sysm_user_location_mapping_dtl; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.sysm_user_location_mapping_dtl (
    uloc_user_loc_access_id integer NOT NULL,
    uloc_user_id_usr integer NOT NULL,
    uloc_location_id_loc integer NOT NULL
);


--
-- Name: sysm_user_location_mapping_dtl_uloc_user_loc_access_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

CREATE SEQUENCE caits.sysm_user_location_mapping_dtl_uloc_user_loc_access_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sysm_user_location_mapping_dtl_uloc_user_loc_access_id_seq; Type: SEQUENCE OWNED BY; Schema: caits; Owner: -
--

ALTER SEQUENCE caits.sysm_user_location_mapping_dtl_uloc_user_loc_access_id_seq OWNED BY caits.sysm_user_location_mapping_dtl.uloc_user_loc_access_id;


--
-- Name: sysm_useraccess_exception_dtl; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.sysm_useraccess_exception_dtl (
    uexc_exception_id integer NOT NULL,
    uexc_employee_id_emp integer NOT NULL,
    uexc_exception_type character varying(10) NOT NULL,
    uexc_menu_code_mtree character varying(50) NOT NULL,
    uexc_reason character varying(255) NOT NULL,
    uexc_valid_from date,
    uexc_valid_until date,
    uexc_isactive boolean NOT NULL,
    uexc_created_by character varying(50),
    uexc_created_on timestamp without time zone NOT NULL,
    uexc_modified_by character varying(50),
    uexc_modified_on timestamp without time zone
);


--
-- Name: sysm_useraccess_exception_dtl_uexc_exception_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

ALTER TABLE caits.sysm_useraccess_exception_dtl ALTER COLUMN uexc_exception_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits.sysm_useraccess_exception_dtl_uexc_exception_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sysm_userlogin_mst; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.sysm_userlogin_mst (
    usr_user_id integer NOT NULL,
    usr_employee_id_emp integer NOT NULL,
    usr_login_id character varying(50) NOT NULL,
    usr_password_hash character varying(255) NOT NULL,
    usr_role_id_rol integer NOT NULL,
    usr_account_status character varying(20) NOT NULL,
    usr_entity_id_ent integer NOT NULL,
    usr_bu_access_scope character varying(10) NOT NULL,
    usr_location_id_loc integer,
    usr_force_password_reset boolean,
    usr_isactive boolean NOT NULL,
    usr_last_login_on timestamp without time zone,
    usr_last_login_ip character varying(45),
    usr_failed_attempts integer,
    usr_created_by character varying(50),
    usr_created_on timestamp without time zone NOT NULL,
    usr_modified_by character varying(50),
    usr_modified_on timestamp without time zone,
    usr_location_access_scope character varying(20) DEFAULT 'ALL'::character varying NOT NULL,
    usr_is_system_user boolean DEFAULT false NOT NULL
);


--
-- Name: COLUMN sysm_userlogin_mst.usr_location_access_scope; Type: COMMENT; Schema: caits; Owner: -
--

COMMENT ON COLUMN caits.sysm_userlogin_mst.usr_location_access_scope IS 'ALL = every location in org (filtered by OU scope); SELECTED = rows in sysm_user_location_mapping_dtl';


--
-- Name: COLUMN sysm_userlogin_mst.usr_is_system_user; Type: COMMENT; Schema: caits; Owner: -
--

COMMENT ON COLUMN caits.sysm_userlogin_mst.usr_is_system_user IS 'Hidden bootstrap login with full access (not listed in User Access)';


--
-- Name: sysm_userlogin_mst_usr_user_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

ALTER TABLE caits.sysm_userlogin_mst ALTER COLUMN usr_user_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits.sysm_userlogin_mst_usr_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: txn_detail_dtl; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.txn_detail_dtl (
    txd_txn_detail_id integer NOT NULL,
    txd_txn_header_id_txh integer NOT NULL,
    txd_doc_type character varying(30) NOT NULL,
    txd_sr_no integer NOT NULL,
    txd_item_id_itm integer NOT NULL,
    txd_uom_id_unt integer,
    txd_unit character varying(20),
    txd_ordered_qty numeric(18,3),
    txd_received_qty numeric(18,3),
    txd_accepted_qty numeric(18,3),
    txd_rejected_qty numeric(18,3),
    txd_requested_qty numeric(18,3),
    txd_qty numeric(18,3),
    txd_available_stock numeric(18,3),
    txd_amount numeric(18,2),
    txd_rate numeric(18,2),
    txd_mrp numeric(18,2),
    txd_batch_lot_no character varying(50),
    txd_mfg_date date,
    txd_expiry_date date,
    txd_location_id_loc integer,
    txd_location_bin character varying(50),
    txd_item_condition character varying(20),
    txd_remark character varying(255),
    txd_serial_no character varying(100),
    txd_ip_address character varying(45),
    txd_mac_address character varying(17),
    txd_hostname character varying(150),
    txd_bls_id_ibm integer,
    txd_issued_to_emp_id_emp integer
);


--
-- Name: COLUMN txn_detail_dtl.txd_issued_to_emp_id_emp; Type: COMMENT; Schema: caits; Owner: -
--

COMMENT ON COLUMN caits.txn_detail_dtl.txd_issued_to_emp_id_emp IS 'Employee the asset unit is issued to when line condition is Issued';


--
-- Name: txn_detail_dtl_txd_txn_detail_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

ALTER TABLE caits.txn_detail_dtl ALTER COLUMN txd_txn_detail_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits.txn_detail_dtl_txd_txn_detail_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: txn_header_mst; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.txn_header_mst (
    txh_txn_header_id integer NOT NULL,
    txh_doc_type character varying(30) NOT NULL,
    txh_doc_no character varying(30) NOT NULL,
    txh_doc_date date NOT NULL,
    txh_posting_date date,
    txh_required_by_date date,
    txh_entity_id_ent integer,
    txh_location_id_loc integer,
    txh_from_location_id_loc integer,
    txh_to_location_id_loc integer,
    txh_party_id_vnd integer,
    txh_party_add character varying(255),
    txh_party_contact_person character varying(100),
    txh_party_phone character varying(15),
    txh_party_gstin character varying(20),
    txh_ship_to character varying(255),
    txh_initiated_by_emp_id_emp integer,
    txh_employee_ref_code character varying(20),
    txh_designation character varying(100),
    txh_doc_subtype character varying(30),
    txh_return_flag character varying(20),
    txh_ref_txn_header_id_txh integer,
    txh_reference_no character varying(30),
    txh_invoice_no character varying(30),
    txh_invoice_date date,
    txh_po_no character varying(30),
    txh_po_date date,
    txh_purpose character varying(100),
    txh_attachment_url character varying(255),
    txh_inspected_by_emp_id_emp integer,
    txh_inspection_date date,
    txh_handed_over_to_emp_id_emp integer,
    txh_handover_designation character varying(100),
    txh_handover_date date,
    txh_received_by_emp_id_emp integer,
    txh_received_by_name character varying(100),
    txh_received_designation character varying(100),
    txh_received_date date,
    txh_condition_on_return character varying(20),
    txh_total_ordered_qty numeric(18,3),
    txh_total_received_qty numeric(18,3),
    txh_total_accepted_qty numeric(18,3),
    txh_total_rejected_qty numeric(18,3),
    txh_total_pending_qty numeric(18,3),
    txh_total_amount numeric(18,2),
    txh_prepared_date date,
    txh_approved_by_emp_id_emp integer,
    txh_approved_date date,
    txh_footer_remark character varying(500),
    txh_remarks character varying(500),
    txh_status character varying(20) NOT NULL,
    txh_created_by character varying(50),
    txh_created_on timestamp without time zone NOT NULL,
    txh_modified_by character varying(50),
    txh_modified_on timestamp without time zone,
    txh_prepared_by_emp_id_emp integer,
    txh_department_id_dept integer
);


--
-- Name: COLUMN txn_header_mst.txh_prepared_by_emp_id_emp; Type: COMMENT; Schema: caits; Owner: -
--

COMMENT ON COLUMN caits.txn_header_mst.txh_prepared_by_emp_id_emp IS 'Employee who prepared the document (GRN Other Details sign-off)';


--
-- Name: txn_header_mst_txh_txn_header_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

ALTER TABLE caits.txn_header_mst ALTER COLUMN txh_txn_header_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits.txn_header_mst_txh_txn_header_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: unit_mst; Type: TABLE; Schema: caits; Owner: -
--

CREATE TABLE caits.unit_mst (
    unt_unit_id integer NOT NULL,
    unt_unit_code character varying(20) NOT NULL,
    unt_unit_name character varying(100) NOT NULL,
    unt_desc character varying(255),
    unt_isactive boolean NOT NULL,
    unt_created_by character varying(50),
    unt_created_on timestamp without time zone NOT NULL,
    unt_modified_by character varying(50),
    unt_modified_on timestamp without time zone
);


--
-- Name: unit_mst_unt_unit_id_seq; Type: SEQUENCE; Schema: caits; Owner: -
--

ALTER TABLE caits.unit_mst ALTER COLUMN unt_unit_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits.unit_mst_unt_unit_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: inv_bls_mst ibm_bls_id; Type: DEFAULT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_bls_mst ALTER COLUMN ibm_bls_id SET DEFAULT nextval('caits.inv_bls_mst_ibm_bls_id_seq'::regclass);


--
-- Name: inv_item_bu_mapping_dtl iibm_item_bu_access_id; Type: DEFAULT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_item_bu_mapping_dtl ALTER COLUMN iibm_item_bu_access_id SET DEFAULT nextval('caits.inv_item_bu_mapping_dtl_iibm_item_bu_access_id_seq'::regclass);


--
-- Name: inv_item_location_mapping_dtl ilim_item_loc_access_id; Type: DEFAULT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_item_location_mapping_dtl ALTER COLUMN ilim_item_loc_access_id SET DEFAULT nextval('caits.inv_item_location_mapping_dtl_ilim_item_loc_access_id_seq'::regclass);


--
-- Name: sysm_user_location_mapping_dtl uloc_user_loc_access_id; Type: DEFAULT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_user_location_mapping_dtl ALTER COLUMN uloc_user_loc_access_id SET DEFAULT nextval('caits.sysm_user_location_mapping_dtl_uloc_user_loc_access_id_seq'::regclass);


--
-- Name: category_mst category_mst_cat_category_code_key; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.category_mst
    ADD CONSTRAINT category_mst_cat_category_code_key UNIQUE (cat_category_code);


--
-- Name: category_mst category_mst_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.category_mst
    ADD CONSTRAINT category_mst_pkey PRIMARY KEY (cat_category_id);


--
-- Name: dash_role_widget_dtl dash_role_widget_dtl_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.dash_role_widget_dtl
    ADD CONSTRAINT dash_role_widget_dtl_pkey PRIMARY KEY (dshr_id);


--
-- Name: dash_widget_mst dash_widget_mst_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.dash_widget_mst
    ADD CONSTRAINT dash_widget_mst_pkey PRIMARY KEY (dshw_widget_id);


--
-- Name: genmaster_mst genmaster_mst_gmst_value_code_key; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.genmaster_mst
    ADD CONSTRAINT genmaster_mst_gmst_value_code_key UNIQUE (gmst_value_code);


--
-- Name: genmaster_mst genmaster_mst_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.genmaster_mst
    ADD CONSTRAINT genmaster_mst_pkey PRIMARY KEY (gmst_genmaster_id);


--
-- Name: gentype_mst gentype_mst_gtyp_type_code_key; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.gentype_mst
    ADD CONSTRAINT gentype_mst_gtyp_type_code_key UNIQUE (gtyp_type_code);


--
-- Name: gentype_mst gentype_mst_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.gentype_mst
    ADD CONSTRAINT gentype_mst_pkey PRIMARY KEY (gtyp_gentype_id);


--
-- Name: hrc_department_mst hrc_department_mst_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.hrc_department_mst
    ADD CONSTRAINT hrc_department_mst_pkey PRIMARY KEY (dept_department_id);


--
-- Name: hrc_employee_mst hrc_employee_mst_emp_email_key; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.hrc_employee_mst
    ADD CONSTRAINT hrc_employee_mst_emp_email_key UNIQUE (emp_email);


--
-- Name: hrc_employee_mst hrc_employee_mst_emp_employee_code_key; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.hrc_employee_mst
    ADD CONSTRAINT hrc_employee_mst_emp_employee_code_key UNIQUE (emp_employee_code);


--
-- Name: hrc_employee_mst hrc_employee_mst_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.hrc_employee_mst
    ADD CONSTRAINT hrc_employee_mst_pkey PRIMARY KEY (emp_employee_id);


--
-- Name: inv_bls_mst inv_bls_mst_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_bls_mst
    ADD CONSTRAINT inv_bls_mst_pkey PRIMARY KEY (ibm_bls_id);


--
-- Name: inv_item_bu_mapping_dtl inv_item_bu_mapping_dtl_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_item_bu_mapping_dtl
    ADD CONSTRAINT inv_item_bu_mapping_dtl_pkey PRIMARY KEY (iibm_item_bu_access_id);


--
-- Name: inv_item_location_mapping_dtl inv_item_location_mapping_dtl_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_item_location_mapping_dtl
    ADD CONSTRAINT inv_item_location_mapping_dtl_pkey PRIMARY KEY (ilim_item_loc_access_id);


--
-- Name: inv_item_mst inv_item_mst_itm_item_code_key; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_item_mst
    ADD CONSTRAINT inv_item_mst_itm_item_code_key UNIQUE (itm_item_code);


--
-- Name: inv_item_mst inv_item_mst_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_item_mst
    ADD CONSTRAINT inv_item_mst_pkey PRIMARY KEY (itm_item_id);


--
-- Name: inv_stock_mst inv_stock_mst_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_stock_mst
    ADD CONSTRAINT inv_stock_mst_pkey PRIMARY KEY (stk_stock_id);


--
-- Name: inv_vendor_mst inv_vendor_mst_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_vendor_mst
    ADD CONSTRAINT inv_vendor_mst_pkey PRIMARY KEY (vnd_vendor_id);


--
-- Name: inv_vendor_mst inv_vendor_mst_vnd_vendor_code_key; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_vendor_mst
    ADD CONSTRAINT inv_vendor_mst_vnd_vendor_code_key UNIQUE (vnd_vendor_code);


--
-- Name: ntf_notification_mst ntf_notification_mst_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.ntf_notification_mst
    ADD CONSTRAINT ntf_notification_mst_pkey PRIMARY KEY (ntf_notification_id);


--
-- Name: ntf_push_subscription_dtl ntf_push_subscription_dtl_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.ntf_push_subscription_dtl
    ADD CONSTRAINT ntf_push_subscription_dtl_pkey PRIMARY KEY (nps_subscription_id);


--
-- Name: org_businessunit_mst org_businessunit_mst_bu_bu_code_key; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.org_businessunit_mst
    ADD CONSTRAINT org_businessunit_mst_bu_bu_code_key UNIQUE (bu_bu_code);


--
-- Name: org_businessunit_mst org_businessunit_mst_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.org_businessunit_mst
    ADD CONSTRAINT org_businessunit_mst_pkey PRIMARY KEY (bu_bu_id);


--
-- Name: org_entity_mst org_entity_mst_ent_entity_code_key; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.org_entity_mst
    ADD CONSTRAINT org_entity_mst_ent_entity_code_key UNIQUE (ent_entity_code);


--
-- Name: org_entity_mst org_entity_mst_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.org_entity_mst
    ADD CONSTRAINT org_entity_mst_pkey PRIMARY KEY (ent_entity_id);


--
-- Name: org_location_mst org_location_mst_loc_location_code_key; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.org_location_mst
    ADD CONSTRAINT org_location_mst_loc_location_code_key UNIQUE (loc_location_code);


--
-- Name: org_location_mst org_location_mst_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.org_location_mst
    ADD CONSTRAINT org_location_mst_pkey PRIMARY KEY (loc_location_id);


--
-- Name: subcategory_mst subcategory_mst_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.subcategory_mst
    ADD CONSTRAINT subcategory_mst_pkey PRIMARY KEY (scat_subcategory_id);


--
-- Name: subcategory_mst subcategory_mst_scat_subcategory_code_key; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.subcategory_mst
    ADD CONSTRAINT subcategory_mst_scat_subcategory_code_key UNIQUE (scat_subcategory_code);


--
-- Name: sysm_menutree_mst sysm_menutree_mst_mtree_menu_code_key; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_menutree_mst
    ADD CONSTRAINT sysm_menutree_mst_mtree_menu_code_key UNIQUE (mtree_menu_code);


--
-- Name: sysm_menutree_mst sysm_menutree_mst_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_menutree_mst
    ADD CONSTRAINT sysm_menutree_mst_pkey PRIMARY KEY (mtree_menu_id);


--
-- Name: sysm_rolepermission_dtl sysm_rolepermission_dtl_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_rolepermission_dtl
    ADD CONSTRAINT sysm_rolepermission_dtl_pkey PRIMARY KEY (rlpm_role_permission_id);


--
-- Name: sysm_roles_mst sysm_roles_mst_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_roles_mst
    ADD CONSTRAINT sysm_roles_mst_pkey PRIMARY KEY (rol_role_id);


--
-- Name: sysm_roles_mst sysm_roles_mst_rol_role_code_key; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_roles_mst
    ADD CONSTRAINT sysm_roles_mst_rol_role_code_key UNIQUE (rol_role_code);


--
-- Name: sysm_user_bu_mapping_dtl sysm_user_bu_mapping_dtl_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_user_bu_mapping_dtl
    ADD CONSTRAINT sysm_user_bu_mapping_dtl_pkey PRIMARY KEY (uboa_user_bu_access_id);


--
-- Name: sysm_user_favourite_menu_dtl sysm_user_favourite_menu_dtl_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_user_favourite_menu_dtl
    ADD CONSTRAINT sysm_user_favourite_menu_dtl_pkey PRIMARY KEY (ufav_favourite_id);


--
-- Name: sysm_user_location_mapping_dtl sysm_user_location_mapping_dtl_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_user_location_mapping_dtl
    ADD CONSTRAINT sysm_user_location_mapping_dtl_pkey PRIMARY KEY (uloc_user_loc_access_id);


--
-- Name: sysm_useraccess_exception_dtl sysm_useraccess_exception_dtl_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_useraccess_exception_dtl
    ADD CONSTRAINT sysm_useraccess_exception_dtl_pkey PRIMARY KEY (uexc_exception_id);


--
-- Name: sysm_userlogin_mst sysm_userlogin_mst_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_userlogin_mst
    ADD CONSTRAINT sysm_userlogin_mst_pkey PRIMARY KEY (usr_user_id);


--
-- Name: sysm_userlogin_mst sysm_userlogin_mst_usr_login_id_key; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_userlogin_mst
    ADD CONSTRAINT sysm_userlogin_mst_usr_login_id_key UNIQUE (usr_login_id);


--
-- Name: txn_detail_dtl txn_detail_dtl_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.txn_detail_dtl
    ADD CONSTRAINT txn_detail_dtl_pkey PRIMARY KEY (txd_txn_detail_id);


--
-- Name: txn_header_mst txn_header_mst_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.txn_header_mst
    ADD CONSTRAINT txn_header_mst_pkey PRIMARY KEY (txh_txn_header_id);


--
-- Name: unit_mst unit_mst_pkey; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.unit_mst
    ADD CONSTRAINT unit_mst_pkey PRIMARY KEY (unt_unit_id);


--
-- Name: unit_mst unit_mst_unt_unit_code_key; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.unit_mst
    ADD CONSTRAINT unit_mst_unt_unit_code_key UNIQUE (unt_unit_code);


--
-- Name: dash_role_widget_dtl uq_dash_role_widget; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.dash_role_widget_dtl
    ADD CONSTRAINT uq_dash_role_widget UNIQUE (dshr_role_id_rol, dshr_widget_id_dshw);


--
-- Name: dash_widget_mst uq_dash_widget_code; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.dash_widget_mst
    ADD CONSTRAINT uq_dash_widget_code UNIQUE (dshw_widget_code);


--
-- Name: hrc_department_mst uq_dept_code; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.hrc_department_mst
    ADD CONSTRAINT uq_dept_code UNIQUE (dept_department_code);


--
-- Name: ntf_push_subscription_dtl uq_nps_endpoint; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.ntf_push_subscription_dtl
    ADD CONSTRAINT uq_nps_endpoint UNIQUE (nps_endpoint);


--
-- Name: txn_header_mst uq_txn_header_mst_txh_doc_type_txh_doc_no; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.txn_header_mst
    ADD CONSTRAINT uq_txn_header_mst_txh_doc_type_txh_doc_no UNIQUE (txh_doc_type, txh_doc_no);


--
-- Name: sysm_user_favourite_menu_dtl uq_user_favourite_menu; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_user_favourite_menu_dtl
    ADD CONSTRAINT uq_user_favourite_menu UNIQUE (ufav_user_id_usr, ufav_menu_code_mtree);


--
-- Name: sysm_user_location_mapping_dtl uq_user_location; Type: CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_user_location_mapping_dtl
    ADD CONSTRAINT uq_user_location UNIQUE (uloc_user_id_usr, uloc_location_id_loc);


--
-- Name: ix_bls_active_issued; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_bls_active_issued ON caits.inv_bls_mst USING btree (ibm_item_id_itm, ibm_current_location_id_loc) WHERE ((ibm_isactive = true) AND (ibm_issued_to_emp_id_emp IS NOT NULL));


--
-- Name: ix_bls_item; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_bls_item ON caits.inv_bls_mst USING btree (ibm_item_id_itm);


--
-- Name: ix_bls_location; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_bls_location ON caits.inv_bls_mst USING btree (ibm_current_location_id_loc);


--
-- Name: ix_dash_role_widget_role; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_dash_role_widget_role ON caits.dash_role_widget_dtl USING btree (dshr_role_id_rol, dshr_sort_order);


--
-- Name: ix_dept_bu; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_dept_bu ON caits.hrc_department_mst USING btree (dept_bu_id_bu) WHERE (dept_bu_id_bu IS NOT NULL);


--
-- Name: ix_dept_location; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_dept_location ON caits.hrc_department_mst USING btree (dept_location_id_loc) WHERE (dept_location_id_loc IS NOT NULL);


--
-- Name: ix_employee_email_lower; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_employee_email_lower ON caits.hrc_employee_mst USING btree (lower((emp_email)::text));


--
-- Name: ix_inv_bls_issued_to; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_inv_bls_issued_to ON caits.inv_bls_mst USING btree (ibm_issued_to_emp_id_emp) WHERE (ibm_issued_to_emp_id_emp IS NOT NULL);


--
-- Name: ix_item_code_lower; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_item_code_lower ON caits.inv_item_mst USING btree (lower((itm_item_code)::text));


--
-- Name: ix_item_parent; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_item_parent ON caits.inv_item_mst USING btree (itm_parent_item_id_itm);


--
-- Name: ix_nps_user; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_nps_user ON caits.ntf_push_subscription_dtl USING btree (nps_user_id_usr);


--
-- Name: ix_ntf_user_created; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_ntf_user_created ON caits.ntf_notification_mst USING btree (ntf_user_id_usr, ntf_created_on DESC);


--
-- Name: ix_ntf_user_unread; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_ntf_user_unread ON caits.ntf_notification_mst USING btree (ntf_user_id_usr, ntf_is_read);


--
-- Name: ix_role_permission_role; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_role_permission_role ON caits.sysm_rolepermission_dtl USING btree (rlpm_role_id_rol);


--
-- Name: ix_stock_item_location; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_stock_item_location ON caits.inv_stock_mst USING btree (stk_item_id_itm, stk_location_id_loc) WHERE (COALESCE(stk_isactive, true) = true);


--
-- Name: ix_stock_location_active; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_stock_location_active ON caits.inv_stock_mst USING btree (stk_location_id_loc) WHERE (COALESCE(stk_isactive, true) = true);


--
-- Name: ix_txn_detail_bls; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_txn_detail_bls ON caits.txn_detail_dtl USING btree (txd_bls_id_ibm);


--
-- Name: ix_txn_detail_header; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_txn_detail_header ON caits.txn_detail_dtl USING btree (txd_txn_header_id_txh);


--
-- Name: ix_txn_detail_issued_to; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_txn_detail_issued_to ON caits.txn_detail_dtl USING btree (txd_issued_to_emp_id_emp) WHERE (txd_issued_to_emp_id_emp IS NOT NULL);


--
-- Name: ix_txn_detail_item; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_txn_detail_item ON caits.txn_detail_dtl USING btree (txd_item_id_itm);


--
-- Name: ix_txn_detail_serial_lower; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_txn_detail_serial_lower ON caits.txn_detail_dtl USING btree (lower(btrim((txd_serial_no)::text))) WHERE ((txd_serial_no IS NOT NULL) AND (btrim((txd_serial_no)::text) <> ''::text));


--
-- Name: ix_txn_header_from_loc; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_txn_header_from_loc ON caits.txn_header_mst USING btree (txh_from_location_id_loc);


--
-- Name: ix_txn_header_list; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_txn_header_list ON caits.txn_header_mst USING btree (txh_doc_type, txh_modified_on DESC, txh_doc_date DESC, txh_txn_header_id DESC);


--
-- Name: ix_txn_header_location; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_txn_header_location ON caits.txn_header_mst USING btree (txh_location_id_loc);


--
-- Name: ix_txn_header_to_loc; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_txn_header_to_loc ON caits.txn_header_mst USING btree (txh_to_location_id_loc);


--
-- Name: ix_txn_header_type_date; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_txn_header_type_date ON caits.txn_header_mst USING btree (txh_doc_type, txh_doc_date);


--
-- Name: ix_txn_header_type_status; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_txn_header_type_status ON caits.txn_header_mst USING btree (txh_doc_type, txh_status);


--
-- Name: ix_uloc_user; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_uloc_user ON caits.sysm_user_location_mapping_dtl USING btree (uloc_user_id_usr);


--
-- Name: ix_user_access_exception_emp; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_user_access_exception_emp ON caits.sysm_useraccess_exception_dtl USING btree (uexc_employee_id_emp);


--
-- Name: ix_user_favourite_user; Type: INDEX; Schema: caits; Owner: -
--

CREATE INDEX ix_user_favourite_user ON caits.sysm_user_favourite_menu_dtl USING btree (ufav_user_id_usr, ufav_sort_order);


--
-- Name: uq_access_exception; Type: INDEX; Schema: caits; Owner: -
--

CREATE UNIQUE INDEX uq_access_exception ON caits.sysm_useraccess_exception_dtl USING btree (uexc_employee_id_emp, lower((uexc_menu_code_mtree)::text), lower((uexc_exception_type)::text));


--
-- Name: uq_bls_dummy_per_item; Type: INDEX; Schema: caits; Owner: -
--

CREATE UNIQUE INDEX uq_bls_dummy_per_item ON caits.inv_bls_mst USING btree (ibm_item_id_itm) WHERE ((ibm_is_dummy = true) AND (ibm_isactive = true));


--
-- Name: uq_bls_item_batch; Type: INDEX; Schema: caits; Owner: -
--

CREATE UNIQUE INDEX uq_bls_item_batch ON caits.inv_bls_mst USING btree (ibm_item_id_itm, lower(btrim((ibm_batch_no)::text))) WHERE ((ibm_batch_no IS NOT NULL) AND (btrim((ibm_batch_no)::text) <> ''::text) AND ((ibm_serial_no IS NULL) OR (btrim((ibm_serial_no)::text) = ''::text)) AND (ibm_is_dummy = false) AND (ibm_isactive = true));


--
-- Name: uq_bls_serial_no; Type: INDEX; Schema: caits; Owner: -
--

CREATE UNIQUE INDEX uq_bls_serial_no ON caits.inv_bls_mst USING btree (lower(btrim((ibm_serial_no)::text))) WHERE ((ibm_serial_no IS NOT NULL) AND (btrim((ibm_serial_no)::text) <> ''::text) AND (ibm_isactive = true));


--
-- Name: uq_inv_item_bu_mapping; Type: INDEX; Schema: caits; Owner: -
--

CREATE UNIQUE INDEX uq_inv_item_bu_mapping ON caits.inv_item_bu_mapping_dtl USING btree (iibm_item_id_itm, iibm_bu_id_bu);


--
-- Name: uq_inv_item_location_mapping; Type: INDEX; Schema: caits; Owner: -
--

CREATE UNIQUE INDEX uq_inv_item_location_mapping ON caits.inv_item_location_mapping_dtl USING btree (ilim_item_id_itm, ilim_location_id_loc);


--
-- Name: uq_org_location_entity_system_role; Type: INDEX; Schema: caits; Owner: -
--

CREATE UNIQUE INDEX uq_org_location_entity_system_role ON caits.org_location_mst USING btree (loc_entity_id_ent, loc_system_role) WHERE ((loc_is_system_location = true) AND (loc_bu_id_bu IS NULL));


--
-- Name: uq_rlpm_role_menu; Type: INDEX; Schema: caits; Owner: -
--

CREATE UNIQUE INDEX uq_rlpm_role_menu ON caits.sysm_rolepermission_dtl USING btree (rlpm_role_id_rol, rlpm_menu_id_mtree);


--
-- Name: dash_role_widget_dtl fk_dash_role; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.dash_role_widget_dtl
    ADD CONSTRAINT fk_dash_role FOREIGN KEY (dshr_role_id_rol) REFERENCES caits.sysm_roles_mst(rol_role_id) ON DELETE CASCADE;


--
-- Name: dash_role_widget_dtl fk_dash_widget; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.dash_role_widget_dtl
    ADD CONSTRAINT fk_dash_widget FOREIGN KEY (dshr_widget_id_dshw) REFERENCES caits.dash_widget_mst(dshw_widget_id) ON DELETE CASCADE;


--
-- Name: hrc_department_mst fk_dept_bu; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.hrc_department_mst
    ADD CONSTRAINT fk_dept_bu FOREIGN KEY (dept_bu_id_bu) REFERENCES caits.org_businessunit_mst(bu_bu_id);


--
-- Name: hrc_department_mst fk_dept_entity; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.hrc_department_mst
    ADD CONSTRAINT fk_dept_entity FOREIGN KEY (dept_entity_id_ent) REFERENCES caits.org_entity_mst(ent_entity_id);


--
-- Name: hrc_department_mst fk_dept_head_emp; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.hrc_department_mst
    ADD CONSTRAINT fk_dept_head_emp FOREIGN KEY (dept_head_emp_id_emp) REFERENCES caits.hrc_employee_mst(emp_employee_id);


--
-- Name: hrc_department_mst fk_dept_location; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.hrc_department_mst
    ADD CONSTRAINT fk_dept_location FOREIGN KEY (dept_location_id_loc) REFERENCES caits.org_location_mst(loc_location_id);


--
-- Name: hrc_employee_mst fk_emp_department_dept; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.hrc_employee_mst
    ADD CONSTRAINT fk_emp_department_dept FOREIGN KEY (emp_department_id_dept) REFERENCES caits.hrc_department_mst(dept_department_id);


--
-- Name: genmaster_mst fk_genmaster_mst_gmst_gentype_id_gtyp_gentype_mst_g_aef4b84f; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.genmaster_mst
    ADD CONSTRAINT fk_genmaster_mst_gmst_gentype_id_gtyp_gentype_mst_g_aef4b84f FOREIGN KEY (gmst_gentype_id_gtyp) REFERENCES caits.gentype_mst(gtyp_gentype_id);


--
-- Name: hrc_employee_mst fk_hrc_employee_mst_emp_base_location_id_loc_org_lo_bc850ca1; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.hrc_employee_mst
    ADD CONSTRAINT fk_hrc_employee_mst_emp_base_location_id_loc_org_lo_bc850ca1 FOREIGN KEY (emp_base_location_id_loc) REFERENCES caits.org_location_mst(loc_location_id);


--
-- Name: hrc_employee_mst fk_hrc_employee_mst_emp_reporting_to_emp_id_emp_hrc_97372481; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.hrc_employee_mst
    ADD CONSTRAINT fk_hrc_employee_mst_emp_reporting_to_emp_id_emp_hrc_97372481 FOREIGN KEY (emp_reporting_to_emp_id_emp) REFERENCES caits.hrc_employee_mst(emp_employee_id);


--
-- Name: hrc_employee_mst fk_hrc_employee_mst_emp_role_id_rol_sysm_roles_mst__6430f9b7; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.hrc_employee_mst
    ADD CONSTRAINT fk_hrc_employee_mst_emp_role_id_rol_sysm_roles_mst__6430f9b7 FOREIGN KEY (emp_role_id_rol) REFERENCES caits.sysm_roles_mst(rol_role_id);


--
-- Name: inv_bls_mst fk_inv_bls_mst_ibm_issued_to_emp_id_emp; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_bls_mst
    ADD CONSTRAINT fk_inv_bls_mst_ibm_issued_to_emp_id_emp FOREIGN KEY (ibm_issued_to_emp_id_emp) REFERENCES caits.hrc_employee_mst(emp_employee_id);


--
-- Name: inv_item_mst fk_inv_item_mst_itm_category_id_cat_category_mst_ca_2fa999ed; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_item_mst
    ADD CONSTRAINT fk_inv_item_mst_itm_category_id_cat_category_mst_ca_2fa999ed FOREIGN KEY (itm_category_id_cat) REFERENCES caits.category_mst(cat_category_id);


--
-- Name: inv_item_mst fk_inv_item_mst_itm_current_location_id_loc_org_loc_cf8e0bec; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_item_mst
    ADD CONSTRAINT fk_inv_item_mst_itm_current_location_id_loc_org_loc_cf8e0bec FOREIGN KEY (itm_current_location_id_loc) REFERENCES caits.org_location_mst(loc_location_id);


--
-- Name: inv_item_mst fk_inv_item_mst_itm_entity_id_ent; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_item_mst
    ADD CONSTRAINT fk_inv_item_mst_itm_entity_id_ent FOREIGN KEY (itm_entity_id_ent) REFERENCES caits.org_entity_mst(ent_entity_id);


--
-- Name: inv_item_mst fk_inv_item_mst_itm_subcategory_id_scat_subcategory_99d309d6; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_item_mst
    ADD CONSTRAINT fk_inv_item_mst_itm_subcategory_id_scat_subcategory_99d309d6 FOREIGN KEY (itm_subcategory_id_scat) REFERENCES caits.subcategory_mst(scat_subcategory_id);


--
-- Name: inv_item_mst fk_inv_item_mst_itm_uom_id_unt_unit_mst_unt_unit_id; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_item_mst
    ADD CONSTRAINT fk_inv_item_mst_itm_uom_id_unt_unit_mst_unt_unit_id FOREIGN KEY (itm_uom_id_unt) REFERENCES caits.unit_mst(unt_unit_id);


--
-- Name: inv_stock_mst fk_inv_stock_mst_stk_item_id_itm_inv_item_mst_itm_item_id; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_stock_mst
    ADD CONSTRAINT fk_inv_stock_mst_stk_item_id_itm_inv_item_mst_itm_item_id FOREIGN KEY (stk_item_id_itm) REFERENCES caits.inv_item_mst(itm_item_id);


--
-- Name: inv_stock_mst fk_inv_stock_mst_stk_last_txn_header_id_txh_txn_hea_256f23e9; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_stock_mst
    ADD CONSTRAINT fk_inv_stock_mst_stk_last_txn_header_id_txh_txn_hea_256f23e9 FOREIGN KEY (stk_last_txn_header_id_txh) REFERENCES caits.txn_header_mst(txh_txn_header_id);


--
-- Name: inv_stock_mst fk_inv_stock_mst_stk_location_id_loc_org_location_m_81f5aaa8; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_stock_mst
    ADD CONSTRAINT fk_inv_stock_mst_stk_location_id_loc_org_location_m_81f5aaa8 FOREIGN KEY (stk_location_id_loc) REFERENCES caits.org_location_mst(loc_location_id);


--
-- Name: inv_stock_mst fk_inv_stock_mst_stk_uom_id_unt_unit_mst_unt_unit_id; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_stock_mst
    ADD CONSTRAINT fk_inv_stock_mst_stk_uom_id_unt_unit_mst_unt_unit_id FOREIGN KEY (stk_uom_id_unt) REFERENCES caits.unit_mst(unt_unit_id);


--
-- Name: inv_item_mst fk_item_parent_item; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_item_mst
    ADD CONSTRAINT fk_item_parent_item FOREIGN KEY (itm_parent_item_id_itm) REFERENCES caits.inv_item_mst(itm_item_id);


--
-- Name: ntf_push_subscription_dtl fk_nps_user; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.ntf_push_subscription_dtl
    ADD CONSTRAINT fk_nps_user FOREIGN KEY (nps_user_id_usr) REFERENCES caits.sysm_userlogin_mst(usr_user_id) ON DELETE CASCADE;


--
-- Name: ntf_notification_mst fk_ntf_user; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.ntf_notification_mst
    ADD CONSTRAINT fk_ntf_user FOREIGN KEY (ntf_user_id_usr) REFERENCES caits.sysm_userlogin_mst(usr_user_id) ON DELETE CASCADE;


--
-- Name: org_businessunit_mst fk_org_businessunit_mst_bu_entity_id_ent_org_entity_0069ae61; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.org_businessunit_mst
    ADD CONSTRAINT fk_org_businessunit_mst_bu_entity_id_ent_org_entity_0069ae61 FOREIGN KEY (bu_entity_id_ent) REFERENCES caits.org_entity_mst(ent_entity_id);


--
-- Name: org_businessunit_mst fk_org_businessunit_mst_bu_manager_emp_id_emp_hrc_e_2cc1db0b; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.org_businessunit_mst
    ADD CONSTRAINT fk_org_businessunit_mst_bu_manager_emp_id_emp_hrc_e_2cc1db0b FOREIGN KEY (bu_manager_emp_id_emp) REFERENCES caits.hrc_employee_mst(emp_employee_id);


--
-- Name: org_location_mst fk_org_location_mst_loc_bu_id_bu_org_businessunit_m_c2b70f71; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.org_location_mst
    ADD CONSTRAINT fk_org_location_mst_loc_bu_id_bu_org_businessunit_m_c2b70f71 FOREIGN KEY (loc_bu_id_bu) REFERENCES caits.org_businessunit_mst(bu_bu_id);


--
-- Name: org_location_mst fk_org_location_mst_loc_entity_id_ent_org_entity_ms_040dd84e; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.org_location_mst
    ADD CONSTRAINT fk_org_location_mst_loc_entity_id_ent_org_entity_ms_040dd84e FOREIGN KEY (loc_entity_id_ent) REFERENCES caits.org_entity_mst(ent_entity_id);


--
-- Name: org_location_mst fk_org_location_mst_loc_manager_emp_id_emp_hrc_empl_c5a492bf; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.org_location_mst
    ADD CONSTRAINT fk_org_location_mst_loc_manager_emp_id_emp_hrc_empl_c5a492bf FOREIGN KEY (loc_manager_emp_id_emp) REFERENCES caits.hrc_employee_mst(emp_employee_id);


--
-- Name: sysm_rolepermission_dtl fk_rlpm_menu_id_mtree; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_rolepermission_dtl
    ADD CONSTRAINT fk_rlpm_menu_id_mtree FOREIGN KEY (rlpm_menu_id_mtree) REFERENCES caits.sysm_menutree_mst(mtree_menu_id);


--
-- Name: subcategory_mst fk_subcategory_mst_scat_category_id_cat_category_ms_6c1f14e1; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.subcategory_mst
    ADD CONSTRAINT fk_subcategory_mst_scat_category_id_cat_category_ms_6c1f14e1 FOREIGN KEY (scat_category_id_cat) REFERENCES caits.category_mst(cat_category_id);


--
-- Name: sysm_rolepermission_dtl fk_sysm_rolepermission_dtl_rlpm_role_id_rol_sysm_ro_5b4edd0a; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_rolepermission_dtl
    ADD CONSTRAINT fk_sysm_rolepermission_dtl_rlpm_role_id_rol_sysm_ro_5b4edd0a FOREIGN KEY (rlpm_role_id_rol) REFERENCES caits.sysm_roles_mst(rol_role_id);


--
-- Name: sysm_user_bu_mapping_dtl fk_sysm_user_bu_mapping_dtl_uboa_bu_id_bu_org_busin_fe7d7110; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_user_bu_mapping_dtl
    ADD CONSTRAINT fk_sysm_user_bu_mapping_dtl_uboa_bu_id_bu_org_busin_fe7d7110 FOREIGN KEY (uboa_bu_id_bu) REFERENCES caits.org_businessunit_mst(bu_bu_id);


--
-- Name: sysm_user_bu_mapping_dtl fk_sysm_user_bu_mapping_dtl_uboa_user_id_usr_sysm_u_ef6ac91b; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_user_bu_mapping_dtl
    ADD CONSTRAINT fk_sysm_user_bu_mapping_dtl_uboa_user_id_usr_sysm_u_ef6ac91b FOREIGN KEY (uboa_user_id_usr) REFERENCES caits.sysm_userlogin_mst(usr_user_id);


--
-- Name: sysm_useraccess_exception_dtl fk_sysm_useraccess_exception_dtl_uexc_employee_id_e_407f5c0d; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_useraccess_exception_dtl
    ADD CONSTRAINT fk_sysm_useraccess_exception_dtl_uexc_employee_id_e_407f5c0d FOREIGN KEY (uexc_employee_id_emp) REFERENCES caits.hrc_employee_mst(emp_employee_id);


--
-- Name: sysm_useraccess_exception_dtl fk_sysm_useraccess_exception_dtl_uexc_menu_code_mtr_5759a49f; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_useraccess_exception_dtl
    ADD CONSTRAINT fk_sysm_useraccess_exception_dtl_uexc_menu_code_mtr_5759a49f FOREIGN KEY (uexc_menu_code_mtree) REFERENCES caits.sysm_menutree_mst(mtree_menu_code);


--
-- Name: sysm_userlogin_mst fk_sysm_userlogin_mst_usr_employee_id_emp_hrc_emplo_3322c8a3; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_userlogin_mst
    ADD CONSTRAINT fk_sysm_userlogin_mst_usr_employee_id_emp_hrc_emplo_3322c8a3 FOREIGN KEY (usr_employee_id_emp) REFERENCES caits.hrc_employee_mst(emp_employee_id);


--
-- Name: sysm_userlogin_mst fk_sysm_userlogin_mst_usr_entity_id_ent_org_entity__e5983a22; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_userlogin_mst
    ADD CONSTRAINT fk_sysm_userlogin_mst_usr_entity_id_ent_org_entity__e5983a22 FOREIGN KEY (usr_entity_id_ent) REFERENCES caits.org_entity_mst(ent_entity_id);


--
-- Name: sysm_userlogin_mst fk_sysm_userlogin_mst_usr_location_id_loc_org_locat_538eaae6; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_userlogin_mst
    ADD CONSTRAINT fk_sysm_userlogin_mst_usr_location_id_loc_org_locat_538eaae6 FOREIGN KEY (usr_location_id_loc) REFERENCES caits.org_location_mst(loc_location_id);


--
-- Name: sysm_userlogin_mst fk_sysm_userlogin_mst_usr_role_id_rol_sysm_roles_ms_842e11fa; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_userlogin_mst
    ADD CONSTRAINT fk_sysm_userlogin_mst_usr_role_id_rol_sysm_roles_ms_842e11fa FOREIGN KEY (usr_role_id_rol) REFERENCES caits.sysm_roles_mst(rol_role_id);


--
-- Name: txn_header_mst fk_txh_department_dept; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.txn_header_mst
    ADD CONSTRAINT fk_txh_department_dept FOREIGN KEY (txh_department_id_dept) REFERENCES caits.hrc_department_mst(dept_department_id);


--
-- Name: txn_detail_dtl fk_txn_detail_bls; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.txn_detail_dtl
    ADD CONSTRAINT fk_txn_detail_bls FOREIGN KEY (txd_bls_id_ibm) REFERENCES caits.inv_bls_mst(ibm_bls_id);


--
-- Name: txn_detail_dtl fk_txn_detail_dtl_txd_issued_to_emp_id_emp; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.txn_detail_dtl
    ADD CONSTRAINT fk_txn_detail_dtl_txd_issued_to_emp_id_emp FOREIGN KEY (txd_issued_to_emp_id_emp) REFERENCES caits.hrc_employee_mst(emp_employee_id);


--
-- Name: txn_detail_dtl fk_txn_detail_dtl_txd_item_id_itm_inv_item_mst_itm_item_id; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.txn_detail_dtl
    ADD CONSTRAINT fk_txn_detail_dtl_txd_item_id_itm_inv_item_mst_itm_item_id FOREIGN KEY (txd_item_id_itm) REFERENCES caits.inv_item_mst(itm_item_id);


--
-- Name: txn_detail_dtl fk_txn_detail_dtl_txd_location_id_loc_org_location__12589534; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.txn_detail_dtl
    ADD CONSTRAINT fk_txn_detail_dtl_txd_location_id_loc_org_location__12589534 FOREIGN KEY (txd_location_id_loc) REFERENCES caits.org_location_mst(loc_location_id);


--
-- Name: txn_detail_dtl fk_txn_detail_dtl_txd_txn_header_id_txh_txn_header__94298fce; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.txn_detail_dtl
    ADD CONSTRAINT fk_txn_detail_dtl_txd_txn_header_id_txh_txn_header__94298fce FOREIGN KEY (txd_txn_header_id_txh) REFERENCES caits.txn_header_mst(txh_txn_header_id);


--
-- Name: txn_detail_dtl fk_txn_detail_dtl_txd_uom_id_unt_unit_mst_unt_unit_id; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.txn_detail_dtl
    ADD CONSTRAINT fk_txn_detail_dtl_txd_uom_id_unt_unit_mst_unt_unit_id FOREIGN KEY (txd_uom_id_unt) REFERENCES caits.unit_mst(unt_unit_id);


--
-- Name: txn_header_mst fk_txn_header_mst_txh_approved_by_emp_id_emp_hrc_em_92f64cdb; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.txn_header_mst
    ADD CONSTRAINT fk_txn_header_mst_txh_approved_by_emp_id_emp_hrc_em_92f64cdb FOREIGN KEY (txh_approved_by_emp_id_emp) REFERENCES caits.hrc_employee_mst(emp_employee_id);


--
-- Name: txn_header_mst fk_txn_header_mst_txh_entity_id_ent_org_entity_mst__6cbc7a95; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.txn_header_mst
    ADD CONSTRAINT fk_txn_header_mst_txh_entity_id_ent_org_entity_mst__6cbc7a95 FOREIGN KEY (txh_entity_id_ent) REFERENCES caits.org_entity_mst(ent_entity_id);


--
-- Name: txn_header_mst fk_txn_header_mst_txh_from_location_id_loc_org_loca_5fa8788a; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.txn_header_mst
    ADD CONSTRAINT fk_txn_header_mst_txh_from_location_id_loc_org_loca_5fa8788a FOREIGN KEY (txh_from_location_id_loc) REFERENCES caits.org_location_mst(loc_location_id);


--
-- Name: txn_header_mst fk_txn_header_mst_txh_handed_over_to_emp_id_emp_hrc_62532ba4; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.txn_header_mst
    ADD CONSTRAINT fk_txn_header_mst_txh_handed_over_to_emp_id_emp_hrc_62532ba4 FOREIGN KEY (txh_handed_over_to_emp_id_emp) REFERENCES caits.hrc_employee_mst(emp_employee_id);


--
-- Name: txn_header_mst fk_txn_header_mst_txh_initiated_by_emp_id_emp_hrc_e_c00d567b; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.txn_header_mst
    ADD CONSTRAINT fk_txn_header_mst_txh_initiated_by_emp_id_emp_hrc_e_c00d567b FOREIGN KEY (txh_initiated_by_emp_id_emp) REFERENCES caits.hrc_employee_mst(emp_employee_id);


--
-- Name: txn_header_mst fk_txn_header_mst_txh_inspected_by_emp_id_emp_hrc_e_d65e0abb; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.txn_header_mst
    ADD CONSTRAINT fk_txn_header_mst_txh_inspected_by_emp_id_emp_hrc_e_d65e0abb FOREIGN KEY (txh_inspected_by_emp_id_emp) REFERENCES caits.hrc_employee_mst(emp_employee_id);


--
-- Name: txn_header_mst fk_txn_header_mst_txh_location_id_loc_org_location__2914cd60; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.txn_header_mst
    ADD CONSTRAINT fk_txn_header_mst_txh_location_id_loc_org_location__2914cd60 FOREIGN KEY (txh_location_id_loc) REFERENCES caits.org_location_mst(loc_location_id);


--
-- Name: txn_header_mst fk_txn_header_mst_txh_party_id_vnd_inv_vendor_mst_v_dfb69feb; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.txn_header_mst
    ADD CONSTRAINT fk_txn_header_mst_txh_party_id_vnd_inv_vendor_mst_v_dfb69feb FOREIGN KEY (txh_party_id_vnd) REFERENCES caits.inv_vendor_mst(vnd_vendor_id);


--
-- Name: txn_header_mst fk_txn_header_mst_txh_prepared_by_emp_id_emp; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.txn_header_mst
    ADD CONSTRAINT fk_txn_header_mst_txh_prepared_by_emp_id_emp FOREIGN KEY (txh_prepared_by_emp_id_emp) REFERENCES caits.hrc_employee_mst(emp_employee_id);


--
-- Name: txn_header_mst fk_txn_header_mst_txh_received_by_emp_id_emp_hrc_em_f505f8fc; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.txn_header_mst
    ADD CONSTRAINT fk_txn_header_mst_txh_received_by_emp_id_emp_hrc_em_f505f8fc FOREIGN KEY (txh_received_by_emp_id_emp) REFERENCES caits.hrc_employee_mst(emp_employee_id);


--
-- Name: txn_header_mst fk_txn_header_mst_txh_ref_txn_header_id_txh_txn_hea_6522e207; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.txn_header_mst
    ADD CONSTRAINT fk_txn_header_mst_txh_ref_txn_header_id_txh_txn_hea_6522e207 FOREIGN KEY (txh_ref_txn_header_id_txh) REFERENCES caits.txn_header_mst(txh_txn_header_id);


--
-- Name: txn_header_mst fk_txn_header_mst_txh_to_location_id_loc_org_locati_a60cc529; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.txn_header_mst
    ADD CONSTRAINT fk_txn_header_mst_txh_to_location_id_loc_org_locati_a60cc529 FOREIGN KEY (txh_to_location_id_loc) REFERENCES caits.org_location_mst(loc_location_id);


--
-- Name: sysm_user_favourite_menu_dtl fk_user_favourite_user; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_user_favourite_menu_dtl
    ADD CONSTRAINT fk_user_favourite_user FOREIGN KEY (ufav_user_id_usr) REFERENCES caits.sysm_userlogin_mst(usr_user_id) ON DELETE CASCADE;


--
-- Name: inv_bls_mst inv_bls_mst_ibm_current_location_id_loc_fkey; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_bls_mst
    ADD CONSTRAINT inv_bls_mst_ibm_current_location_id_loc_fkey FOREIGN KEY (ibm_current_location_id_loc) REFERENCES caits.org_location_mst(loc_location_id);


--
-- Name: inv_bls_mst inv_bls_mst_ibm_entity_id_ent_fkey; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_bls_mst
    ADD CONSTRAINT inv_bls_mst_ibm_entity_id_ent_fkey FOREIGN KEY (ibm_entity_id_ent) REFERENCES caits.org_entity_mst(ent_entity_id);


--
-- Name: inv_bls_mst inv_bls_mst_ibm_item_id_itm_fkey; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_bls_mst
    ADD CONSTRAINT inv_bls_mst_ibm_item_id_itm_fkey FOREIGN KEY (ibm_item_id_itm) REFERENCES caits.inv_item_mst(itm_item_id);


--
-- Name: inv_item_bu_mapping_dtl inv_item_bu_mapping_dtl_iibm_bu_id_bu_fkey; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_item_bu_mapping_dtl
    ADD CONSTRAINT inv_item_bu_mapping_dtl_iibm_bu_id_bu_fkey FOREIGN KEY (iibm_bu_id_bu) REFERENCES caits.org_businessunit_mst(bu_bu_id);


--
-- Name: inv_item_bu_mapping_dtl inv_item_bu_mapping_dtl_iibm_item_id_itm_fkey; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_item_bu_mapping_dtl
    ADD CONSTRAINT inv_item_bu_mapping_dtl_iibm_item_id_itm_fkey FOREIGN KEY (iibm_item_id_itm) REFERENCES caits.inv_item_mst(itm_item_id);


--
-- Name: inv_item_location_mapping_dtl inv_item_location_mapping_dtl_ilim_item_id_itm_fkey; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_item_location_mapping_dtl
    ADD CONSTRAINT inv_item_location_mapping_dtl_ilim_item_id_itm_fkey FOREIGN KEY (ilim_item_id_itm) REFERENCES caits.inv_item_mst(itm_item_id);


--
-- Name: inv_item_location_mapping_dtl inv_item_location_mapping_dtl_ilim_location_id_loc_fkey; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.inv_item_location_mapping_dtl
    ADD CONSTRAINT inv_item_location_mapping_dtl_ilim_location_id_loc_fkey FOREIGN KEY (ilim_location_id_loc) REFERENCES caits.org_location_mst(loc_location_id);


--
-- Name: sysm_user_location_mapping_dtl sysm_user_location_mapping_dtl_uloc_location_id_loc_fkey; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_user_location_mapping_dtl
    ADD CONSTRAINT sysm_user_location_mapping_dtl_uloc_location_id_loc_fkey FOREIGN KEY (uloc_location_id_loc) REFERENCES caits.org_location_mst(loc_location_id);


--
-- Name: sysm_user_location_mapping_dtl sysm_user_location_mapping_dtl_uloc_user_id_usr_fkey; Type: FK CONSTRAINT; Schema: caits; Owner: -
--

ALTER TABLE ONLY caits.sysm_user_location_mapping_dtl
    ADD CONSTRAINT sysm_user_location_mapping_dtl_uloc_user_id_usr_fkey FOREIGN KEY (uloc_user_id_usr) REFERENCES caits.sysm_userlogin_mst(usr_user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

7xomcUPERC6jVUseq1J1LdwQtm3UQPjwJmKd479zRbATU50eTrQpr3EHPJwPWjE

