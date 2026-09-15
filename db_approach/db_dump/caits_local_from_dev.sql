--
-- PostgreSQL database dump
--

\restrict sz8qAbuFYfbUmwf6eMQaNvT3VR5EMzC2MTGVDoQz9ocZawnPChU40YDoCJPYm8C

-- Dumped from database version 15.15
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY caits_local.sysm_user_location_mapping_dtl DROP CONSTRAINT IF EXISTS sysm_user_location_mapping_dtl_uloc_user_id_usr_fkey;
ALTER TABLE IF EXISTS ONLY caits_local.sysm_user_location_mapping_dtl DROP CONSTRAINT IF EXISTS sysm_user_location_mapping_dtl_uloc_location_id_loc_fkey;
ALTER TABLE IF EXISTS ONLY caits_local.inv_bls_mst DROP CONSTRAINT IF EXISTS inv_bls_mst_ibm_item_id_itm_fkey;
ALTER TABLE IF EXISTS ONLY caits_local.inv_bls_mst DROP CONSTRAINT IF EXISTS inv_bls_mst_ibm_entity_id_ent_fkey;
ALTER TABLE IF EXISTS ONLY caits_local.inv_bls_mst DROP CONSTRAINT IF EXISTS inv_bls_mst_ibm_current_location_id_loc_fkey;
ALTER TABLE IF EXISTS ONLY caits_local.sysm_user_favourite_menu_dtl DROP CONSTRAINT IF EXISTS fk_user_favourite_user;
ALTER TABLE IF EXISTS ONLY caits_local.txn_header_mst DROP CONSTRAINT IF EXISTS fk_txn_header_mst_txh_to_location_id_loc_org_locati_a60cc529;
ALTER TABLE IF EXISTS ONLY caits_local.txn_header_mst DROP CONSTRAINT IF EXISTS fk_txn_header_mst_txh_ref_txn_header_id_txh_txn_hea_6522e207;
ALTER TABLE IF EXISTS ONLY caits_local.txn_header_mst DROP CONSTRAINT IF EXISTS fk_txn_header_mst_txh_received_by_emp_id_emp_hrc_em_f505f8fc;
ALTER TABLE IF EXISTS ONLY caits_local.txn_header_mst DROP CONSTRAINT IF EXISTS fk_txn_header_mst_txh_prepared_by_emp_id_emp;
ALTER TABLE IF EXISTS ONLY caits_local.txn_header_mst DROP CONSTRAINT IF EXISTS fk_txn_header_mst_txh_party_id_vnd_inv_vendor_mst_v_dfb69feb;
ALTER TABLE IF EXISTS ONLY caits_local.txn_header_mst DROP CONSTRAINT IF EXISTS fk_txn_header_mst_txh_location_id_loc_org_location__2914cd60;
ALTER TABLE IF EXISTS ONLY caits_local.txn_header_mst DROP CONSTRAINT IF EXISTS fk_txn_header_mst_txh_inspected_by_emp_id_emp_hrc_e_d65e0abb;
ALTER TABLE IF EXISTS ONLY caits_local.txn_header_mst DROP CONSTRAINT IF EXISTS fk_txn_header_mst_txh_initiated_by_emp_id_emp_hrc_e_c00d567b;
ALTER TABLE IF EXISTS ONLY caits_local.txn_header_mst DROP CONSTRAINT IF EXISTS fk_txn_header_mst_txh_handed_over_to_emp_id_emp_hrc_62532ba4;
ALTER TABLE IF EXISTS ONLY caits_local.txn_header_mst DROP CONSTRAINT IF EXISTS fk_txn_header_mst_txh_from_location_id_loc_org_loca_5fa8788a;
ALTER TABLE IF EXISTS ONLY caits_local.txn_header_mst DROP CONSTRAINT IF EXISTS fk_txn_header_mst_txh_entity_id_ent_org_entity_mst__6cbc7a95;
ALTER TABLE IF EXISTS ONLY caits_local.txn_header_mst DROP CONSTRAINT IF EXISTS fk_txn_header_mst_txh_approved_by_emp_id_emp_hrc_em_92f64cdb;
ALTER TABLE IF EXISTS ONLY caits_local.txn_detail_dtl DROP CONSTRAINT IF EXISTS fk_txn_detail_dtl_txd_uom_id_unt_unit_mst_unt_unit_id;
ALTER TABLE IF EXISTS ONLY caits_local.txn_detail_dtl DROP CONSTRAINT IF EXISTS fk_txn_detail_dtl_txd_txn_header_id_txh_txn_header__94298fce;
ALTER TABLE IF EXISTS ONLY caits_local.txn_detail_dtl DROP CONSTRAINT IF EXISTS fk_txn_detail_dtl_txd_location_id_loc_org_location__12589534;
ALTER TABLE IF EXISTS ONLY caits_local.txn_detail_dtl DROP CONSTRAINT IF EXISTS fk_txn_detail_dtl_txd_item_id_itm_inv_item_mst_itm_item_id;
ALTER TABLE IF EXISTS ONLY caits_local.txn_detail_dtl DROP CONSTRAINT IF EXISTS fk_txn_detail_dtl_txd_issued_to_emp_id_emp;
ALTER TABLE IF EXISTS ONLY caits_local.txn_detail_dtl DROP CONSTRAINT IF EXISTS fk_txn_detail_bls;
ALTER TABLE IF EXISTS ONLY caits_local.txn_header_mst DROP CONSTRAINT IF EXISTS fk_txh_department_dept;
ALTER TABLE IF EXISTS ONLY caits_local.sysm_userlogin_mst DROP CONSTRAINT IF EXISTS fk_sysm_userlogin_mst_usr_role_id_rol_sysm_roles_ms_842e11fa;
ALTER TABLE IF EXISTS ONLY caits_local.sysm_userlogin_mst DROP CONSTRAINT IF EXISTS fk_sysm_userlogin_mst_usr_location_id_loc_org_locat_538eaae6;
ALTER TABLE IF EXISTS ONLY caits_local.sysm_userlogin_mst DROP CONSTRAINT IF EXISTS fk_sysm_userlogin_mst_usr_entity_id_ent_org_entity__e5983a22;
ALTER TABLE IF EXISTS ONLY caits_local.sysm_userlogin_mst DROP CONSTRAINT IF EXISTS fk_sysm_userlogin_mst_usr_employee_id_emp_hrc_emplo_3322c8a3;
ALTER TABLE IF EXISTS ONLY caits_local.sysm_useraccess_exception_dtl DROP CONSTRAINT IF EXISTS fk_sysm_useraccess_exception_dtl_uexc_menu_code_mtr_5759a49f;
ALTER TABLE IF EXISTS ONLY caits_local.sysm_useraccess_exception_dtl DROP CONSTRAINT IF EXISTS fk_sysm_useraccess_exception_dtl_uexc_employee_id_e_407f5c0d;
ALTER TABLE IF EXISTS ONLY caits_local.sysm_user_bu_mapping_dtl DROP CONSTRAINT IF EXISTS fk_sysm_user_bu_mapping_dtl_uboa_user_id_usr_sysm_u_ef6ac91b;
ALTER TABLE IF EXISTS ONLY caits_local.sysm_user_bu_mapping_dtl DROP CONSTRAINT IF EXISTS fk_sysm_user_bu_mapping_dtl_uboa_bu_id_bu_org_busin_fe7d7110;
ALTER TABLE IF EXISTS ONLY caits_local.sysm_rolepermission_dtl DROP CONSTRAINT IF EXISTS fk_sysm_rolepermission_dtl_rlpm_role_id_rol_sysm_ro_5b4edd0a;
ALTER TABLE IF EXISTS ONLY caits_local.subcategory_mst DROP CONSTRAINT IF EXISTS fk_subcategory_mst_scat_category_id_cat_category_ms_6c1f14e1;
ALTER TABLE IF EXISTS ONLY caits_local.sysm_rolepermission_dtl DROP CONSTRAINT IF EXISTS fk_rlpm_menu_id_mtree;
ALTER TABLE IF EXISTS ONLY caits_local.org_location_mst DROP CONSTRAINT IF EXISTS fk_org_location_mst_loc_manager_emp_id_emp_hrc_empl_c5a492bf;
ALTER TABLE IF EXISTS ONLY caits_local.org_location_mst DROP CONSTRAINT IF EXISTS fk_org_location_mst_loc_entity_id_ent_org_entity_ms_040dd84e;
ALTER TABLE IF EXISTS ONLY caits_local.org_location_mst DROP CONSTRAINT IF EXISTS fk_org_location_mst_loc_bu_id_bu_org_businessunit_m_c2b70f71;
ALTER TABLE IF EXISTS ONLY caits_local.org_businessunit_mst DROP CONSTRAINT IF EXISTS fk_org_businessunit_mst_bu_manager_emp_id_emp_hrc_e_2cc1db0b;
ALTER TABLE IF EXISTS ONLY caits_local.org_businessunit_mst DROP CONSTRAINT IF EXISTS fk_org_businessunit_mst_bu_entity_id_ent_org_entity_0069ae61;
ALTER TABLE IF EXISTS ONLY caits_local.inv_item_mst DROP CONSTRAINT IF EXISTS fk_item_parent_item;
ALTER TABLE IF EXISTS ONLY caits_local.inv_stock_mst DROP CONSTRAINT IF EXISTS fk_inv_stock_mst_stk_uom_id_unt_unit_mst_unt_unit_id;
ALTER TABLE IF EXISTS ONLY caits_local.inv_stock_mst DROP CONSTRAINT IF EXISTS fk_inv_stock_mst_stk_location_id_loc_org_location_m_81f5aaa8;
ALTER TABLE IF EXISTS ONLY caits_local.inv_stock_mst DROP CONSTRAINT IF EXISTS fk_inv_stock_mst_stk_last_txn_header_id_txh_txn_hea_256f23e9;
ALTER TABLE IF EXISTS ONLY caits_local.inv_stock_mst DROP CONSTRAINT IF EXISTS fk_inv_stock_mst_stk_item_id_itm_inv_item_mst_itm_item_id;
ALTER TABLE IF EXISTS ONLY caits_local.inv_item_mst DROP CONSTRAINT IF EXISTS fk_inv_item_mst_itm_uom_id_unt_unit_mst_unt_unit_id;
ALTER TABLE IF EXISTS ONLY caits_local.inv_item_mst DROP CONSTRAINT IF EXISTS fk_inv_item_mst_itm_subcategory_id_scat_subcategory_99d309d6;
ALTER TABLE IF EXISTS ONLY caits_local.inv_item_mst DROP CONSTRAINT IF EXISTS fk_inv_item_mst_itm_current_location_id_loc_org_loc_cf8e0bec;
ALTER TABLE IF EXISTS ONLY caits_local.inv_item_mst DROP CONSTRAINT IF EXISTS fk_inv_item_mst_itm_category_id_cat_category_mst_ca_2fa999ed;
ALTER TABLE IF EXISTS ONLY caits_local.inv_bls_mst DROP CONSTRAINT IF EXISTS fk_inv_bls_mst_ibm_issued_to_emp_id_emp;
ALTER TABLE IF EXISTS ONLY caits_local.hrc_employee_mst DROP CONSTRAINT IF EXISTS fk_hrc_employee_mst_emp_role_id_rol_sysm_roles_mst__6430f9b7;
ALTER TABLE IF EXISTS ONLY caits_local.hrc_employee_mst DROP CONSTRAINT IF EXISTS fk_hrc_employee_mst_emp_reporting_to_emp_id_emp_hrc_97372481;
ALTER TABLE IF EXISTS ONLY caits_local.hrc_employee_mst DROP CONSTRAINT IF EXISTS fk_hrc_employee_mst_emp_base_location_id_loc_org_lo_bc850ca1;
ALTER TABLE IF EXISTS ONLY caits_local.genmaster_mst DROP CONSTRAINT IF EXISTS fk_genmaster_mst_gmst_gentype_id_gtyp_gentype_mst_g_aef4b84f;
ALTER TABLE IF EXISTS ONLY caits_local.hrc_employee_mst DROP CONSTRAINT IF EXISTS fk_emp_department_dept;
ALTER TABLE IF EXISTS ONLY caits_local.hrc_department_mst DROP CONSTRAINT IF EXISTS fk_dept_head_emp;
ALTER TABLE IF EXISTS ONLY caits_local.hrc_department_mst DROP CONSTRAINT IF EXISTS fk_dept_entity;
DROP INDEX IF EXISTS caits_local.uq_rlpm_role_menu;
DROP INDEX IF EXISTS caits_local.uq_bls_serial_no;
DROP INDEX IF EXISTS caits_local.uq_bls_item_batch;
DROP INDEX IF EXISTS caits_local.uq_bls_dummy_per_item;
DROP INDEX IF EXISTS caits_local.uq_access_exception;
DROP INDEX IF EXISTS caits_local.ix_user_favourite_user;
DROP INDEX IF EXISTS caits_local.ix_uloc_user;
DROP INDEX IF EXISTS caits_local.ix_txn_detail_serial_lower;
DROP INDEX IF EXISTS caits_local.ix_txn_detail_issued_to;
DROP INDEX IF EXISTS caits_local.ix_txn_detail_bls;
DROP INDEX IF EXISTS caits_local.ix_item_parent;
DROP INDEX IF EXISTS caits_local.ix_item_code_lower;
DROP INDEX IF EXISTS caits_local.ix_inv_bls_issued_to;
DROP INDEX IF EXISTS caits_local.ix_employee_email_lower;
DROP INDEX IF EXISTS caits_local.ix_bls_location;
DROP INDEX IF EXISTS caits_local.ix_bls_item;
ALTER TABLE IF EXISTS ONLY caits_local.sysm_user_location_mapping_dtl DROP CONSTRAINT IF EXISTS uq_user_location;
ALTER TABLE IF EXISTS ONLY caits_local.sysm_user_favourite_menu_dtl DROP CONSTRAINT IF EXISTS uq_user_favourite_menu;
ALTER TABLE IF EXISTS ONLY caits_local.txn_header_mst DROP CONSTRAINT IF EXISTS uq_txn_header_mst_txh_doc_type_txh_doc_no;
ALTER TABLE IF EXISTS ONLY caits_local.hrc_department_mst DROP CONSTRAINT IF EXISTS uq_dept_code;
ALTER TABLE IF EXISTS ONLY caits_local.unit_mst DROP CONSTRAINT IF EXISTS unit_mst_unt_unit_code_key;
ALTER TABLE IF EXISTS ONLY caits_local.unit_mst DROP CONSTRAINT IF EXISTS unit_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits_local.txn_header_mst DROP CONSTRAINT IF EXISTS txn_header_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits_local.txn_detail_dtl DROP CONSTRAINT IF EXISTS txn_detail_dtl_pkey;
ALTER TABLE IF EXISTS ONLY caits_local.sysm_userlogin_mst DROP CONSTRAINT IF EXISTS sysm_userlogin_mst_usr_login_id_key;
ALTER TABLE IF EXISTS ONLY caits_local.sysm_userlogin_mst DROP CONSTRAINT IF EXISTS sysm_userlogin_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits_local.sysm_useraccess_exception_dtl DROP CONSTRAINT IF EXISTS sysm_useraccess_exception_dtl_pkey;
ALTER TABLE IF EXISTS ONLY caits_local.sysm_user_location_mapping_dtl DROP CONSTRAINT IF EXISTS sysm_user_location_mapping_dtl_pkey;
ALTER TABLE IF EXISTS ONLY caits_local.sysm_user_favourite_menu_dtl DROP CONSTRAINT IF EXISTS sysm_user_favourite_menu_dtl_pkey;
ALTER TABLE IF EXISTS ONLY caits_local.sysm_user_bu_mapping_dtl DROP CONSTRAINT IF EXISTS sysm_user_bu_mapping_dtl_pkey;
ALTER TABLE IF EXISTS ONLY caits_local.sysm_roles_mst DROP CONSTRAINT IF EXISTS sysm_roles_mst_rol_role_code_key;
ALTER TABLE IF EXISTS ONLY caits_local.sysm_roles_mst DROP CONSTRAINT IF EXISTS sysm_roles_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits_local.sysm_rolepermission_dtl DROP CONSTRAINT IF EXISTS sysm_rolepermission_dtl_pkey;
ALTER TABLE IF EXISTS ONLY caits_local.sysm_menutree_mst DROP CONSTRAINT IF EXISTS sysm_menutree_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits_local.sysm_menutree_mst DROP CONSTRAINT IF EXISTS sysm_menutree_mst_mtree_menu_code_key;
ALTER TABLE IF EXISTS ONLY caits_local.subcategory_mst DROP CONSTRAINT IF EXISTS subcategory_mst_scat_subcategory_code_key;
ALTER TABLE IF EXISTS ONLY caits_local.subcategory_mst DROP CONSTRAINT IF EXISTS subcategory_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits_local.org_location_mst DROP CONSTRAINT IF EXISTS org_location_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits_local.org_location_mst DROP CONSTRAINT IF EXISTS org_location_mst_loc_location_code_key;
ALTER TABLE IF EXISTS ONLY caits_local.org_entity_mst DROP CONSTRAINT IF EXISTS org_entity_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits_local.org_entity_mst DROP CONSTRAINT IF EXISTS org_entity_mst_ent_entity_code_key;
ALTER TABLE IF EXISTS ONLY caits_local.org_businessunit_mst DROP CONSTRAINT IF EXISTS org_businessunit_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits_local.org_businessunit_mst DROP CONSTRAINT IF EXISTS org_businessunit_mst_bu_bu_code_key;
ALTER TABLE IF EXISTS ONLY caits_local.inv_vendor_mst DROP CONSTRAINT IF EXISTS inv_vendor_mst_vnd_vendor_code_key;
ALTER TABLE IF EXISTS ONLY caits_local.inv_vendor_mst DROP CONSTRAINT IF EXISTS inv_vendor_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits_local.inv_stock_mst DROP CONSTRAINT IF EXISTS inv_stock_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits_local.inv_item_mst DROP CONSTRAINT IF EXISTS inv_item_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits_local.inv_item_mst DROP CONSTRAINT IF EXISTS inv_item_mst_itm_item_code_key;
ALTER TABLE IF EXISTS ONLY caits_local.inv_bls_mst DROP CONSTRAINT IF EXISTS inv_bls_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits_local.hrc_employee_mst DROP CONSTRAINT IF EXISTS hrc_employee_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits_local.hrc_employee_mst DROP CONSTRAINT IF EXISTS hrc_employee_mst_emp_employee_code_key;
ALTER TABLE IF EXISTS ONLY caits_local.hrc_employee_mst DROP CONSTRAINT IF EXISTS hrc_employee_mst_emp_email_key;
ALTER TABLE IF EXISTS ONLY caits_local.hrc_department_mst DROP CONSTRAINT IF EXISTS hrc_department_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits_local.gentype_mst DROP CONSTRAINT IF EXISTS gentype_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits_local.gentype_mst DROP CONSTRAINT IF EXISTS gentype_mst_gtyp_type_code_key;
ALTER TABLE IF EXISTS ONLY caits_local.genmaster_mst DROP CONSTRAINT IF EXISTS genmaster_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits_local.genmaster_mst DROP CONSTRAINT IF EXISTS genmaster_mst_gmst_value_code_key;
ALTER TABLE IF EXISTS ONLY caits_local.category_mst DROP CONSTRAINT IF EXISTS category_mst_pkey;
ALTER TABLE IF EXISTS ONLY caits_local.category_mst DROP CONSTRAINT IF EXISTS category_mst_cat_category_code_key;
ALTER TABLE IF EXISTS caits_local.sysm_user_location_mapping_dtl ALTER COLUMN uloc_user_loc_access_id DROP DEFAULT;
ALTER TABLE IF EXISTS caits_local.inv_bls_mst ALTER COLUMN ibm_bls_id DROP DEFAULT;
DROP TABLE IF EXISTS caits_local.unit_mst;
DROP TABLE IF EXISTS caits_local.txn_header_mst;
DROP TABLE IF EXISTS caits_local.txn_detail_dtl;
DROP TABLE IF EXISTS caits_local.sysm_userlogin_mst;
DROP TABLE IF EXISTS caits_local.sysm_useraccess_exception_dtl;
DROP SEQUENCE IF EXISTS caits_local.sysm_user_location_mapping_dtl_uloc_user_loc_access_id_seq;
DROP TABLE IF EXISTS caits_local.sysm_user_location_mapping_dtl;
DROP TABLE IF EXISTS caits_local.sysm_user_favourite_menu_dtl;
DROP TABLE IF EXISTS caits_local.sysm_user_bu_mapping_dtl;
DROP TABLE IF EXISTS caits_local.sysm_roles_mst;
DROP TABLE IF EXISTS caits_local.sysm_rolepermission_dtl;
DROP TABLE IF EXISTS caits_local.sysm_menutree_mst;
DROP TABLE IF EXISTS caits_local.subcategory_mst;
DROP TABLE IF EXISTS caits_local.org_location_mst;
DROP TABLE IF EXISTS caits_local.org_entity_mst;
DROP TABLE IF EXISTS caits_local.org_businessunit_mst;
DROP TABLE IF EXISTS caits_local.inv_vendor_mst;
DROP TABLE IF EXISTS caits_local.inv_stock_mst;
DROP TABLE IF EXISTS caits_local.inv_item_mst;
DROP SEQUENCE IF EXISTS caits_local.inv_bls_mst_ibm_bls_id_seq;
DROP TABLE IF EXISTS caits_local.inv_bls_mst;
DROP TABLE IF EXISTS caits_local.hrc_employee_mst;
DROP TABLE IF EXISTS caits_local.hrc_department_mst;
DROP TABLE IF EXISTS caits_local.gentype_mst;
DROP TABLE IF EXISTS caits_local.genmaster_mst;
DROP TABLE IF EXISTS caits_local.category_mst;
DROP SCHEMA IF EXISTS caits_local;
--
-- Name: caits_local; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA caits_local;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: category_mst; Type: TABLE; Schema: caits_local; Owner: -
--

CREATE TABLE caits_local.category_mst (
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
-- Name: category_mst_cat_category_id_seq; Type: SEQUENCE; Schema: caits_local; Owner: -
--

ALTER TABLE caits_local.category_mst ALTER COLUMN cat_category_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits_local.category_mst_cat_category_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: genmaster_mst; Type: TABLE; Schema: caits_local; Owner: -
--

CREATE TABLE caits_local.genmaster_mst (
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
-- Name: genmaster_mst_gmst_genmaster_id_seq; Type: SEQUENCE; Schema: caits_local; Owner: -
--

ALTER TABLE caits_local.genmaster_mst ALTER COLUMN gmst_genmaster_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits_local.genmaster_mst_gmst_genmaster_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: gentype_mst; Type: TABLE; Schema: caits_local; Owner: -
--

CREATE TABLE caits_local.gentype_mst (
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
-- Name: gentype_mst_gtyp_gentype_id_seq; Type: SEQUENCE; Schema: caits_local; Owner: -
--

ALTER TABLE caits_local.gentype_mst ALTER COLUMN gtyp_gentype_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits_local.gentype_mst_gtyp_gentype_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: hrc_department_mst; Type: TABLE; Schema: caits_local; Owner: -
--

CREATE TABLE caits_local.hrc_department_mst (
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
    dept_modified_on timestamp without time zone
);


--
-- Name: hrc_department_mst_dept_department_id_seq; Type: SEQUENCE; Schema: caits_local; Owner: -
--

ALTER TABLE caits_local.hrc_department_mst ALTER COLUMN dept_department_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME caits_local.hrc_department_mst_dept_department_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: hrc_employee_mst; Type: TABLE; Schema: caits_local; Owner: -
--

CREATE TABLE caits_local.hrc_employee_mst (
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
    emp_role_id_rol integer NOT NULL,
    emp_base_location_id_loc integer,
    emp_reporting_to_emp_id_emp integer,
    emp_isactive boolean NOT NULL,
    emp_created_by character varying(50),
    emp_created_on timestamp without time zone NOT NULL,
    emp_modified_by character varying(50),
    emp_modified_on timestamp without time zone,
    emp_department_id_dept integer
);


--
-- Name: hrc_employee_mst_emp_employee_id_seq; Type: SEQUENCE; Schema: caits_local; Owner: -
--

ALTER TABLE caits_local.hrc_employee_mst ALTER COLUMN emp_employee_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits_local.hrc_employee_mst_emp_employee_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: inv_bls_mst; Type: TABLE; Schema: caits_local; Owner: -
--

CREATE TABLE caits_local.inv_bls_mst (
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
-- Name: COLUMN inv_bls_mst.ibm_issued_to_emp_id_emp; Type: COMMENT; Schema: caits_local; Owner: -
--

COMMENT ON COLUMN caits_local.inv_bls_mst.ibm_issued_to_emp_id_emp IS 'Employee currently holding this BLS unit (copied from txn line when condition is Issued)';


--
-- Name: inv_bls_mst_ibm_bls_id_seq; Type: SEQUENCE; Schema: caits_local; Owner: -
--

CREATE SEQUENCE caits_local.inv_bls_mst_ibm_bls_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inv_bls_mst_ibm_bls_id_seq; Type: SEQUENCE OWNED BY; Schema: caits_local; Owner: -
--

ALTER SEQUENCE caits_local.inv_bls_mst_ibm_bls_id_seq OWNED BY caits_local.inv_bls_mst.ibm_bls_id;


--
-- Name: inv_item_mst; Type: TABLE; Schema: caits_local; Owner: -
--

CREATE TABLE caits_local.inv_item_mst (
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
    itm_parent_item_id_itm integer
);


--
-- Name: COLUMN inv_item_mst.itm_inspection_needed; Type: COMMENT; Schema: caits_local; Owner: -
--

COMMENT ON COLUMN caits_local.inv_item_mst.itm_inspection_needed IS 'When true, item requires inspection on receipt / inward';


--
-- Name: COLUMN inv_item_mst.itm_ram; Type: COMMENT; Schema: caits_local; Owner: -
--

COMMENT ON COLUMN caits_local.inv_item_mst.itm_ram IS 'Installed RAM, e.g. 16 GB';


--
-- Name: COLUMN inv_item_mst.itm_storage; Type: COMMENT; Schema: caits_local; Owner: -
--

COMMENT ON COLUMN caits_local.inv_item_mst.itm_storage IS 'Installed storage, e.g. 512GB SSD (NVMe)';


--
-- Name: COLUMN inv_item_mst.itm_product_no; Type: COMMENT; Schema: caits_local; Owner: -
--

COMMENT ON COLUMN caits_local.inv_item_mst.itm_product_no IS 'Manufacturer product number, distinct from serial no';


--
-- Name: COLUMN inv_item_mst.itm_parent_item_id_itm; Type: COMMENT; Schema: caits_local; Owner: -
--

COMMENT ON COLUMN caits_local.inv_item_mst.itm_parent_item_id_itm IS 'Parent asset when this item is an attached peripheral or component';


--
-- Name: inv_item_mst_itm_item_id_seq; Type: SEQUENCE; Schema: caits_local; Owner: -
--

ALTER TABLE caits_local.inv_item_mst ALTER COLUMN itm_item_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits_local.inv_item_mst_itm_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: inv_stock_mst; Type: TABLE; Schema: caits_local; Owner: -
--

CREATE TABLE caits_local.inv_stock_mst (
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
    stk_modified_on timestamp without time zone
);


--
-- Name: inv_stock_mst_stk_stock_id_seq; Type: SEQUENCE; Schema: caits_local; Owner: -
--

ALTER TABLE caits_local.inv_stock_mst ALTER COLUMN stk_stock_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits_local.inv_stock_mst_stk_stock_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: inv_vendor_mst; Type: TABLE; Schema: caits_local; Owner: -
--

CREATE TABLE caits_local.inv_vendor_mst (
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
-- Name: inv_vendor_mst_vnd_vendor_id_seq; Type: SEQUENCE; Schema: caits_local; Owner: -
--

ALTER TABLE caits_local.inv_vendor_mst ALTER COLUMN vnd_vendor_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits_local.inv_vendor_mst_vnd_vendor_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: org_businessunit_mst; Type: TABLE; Schema: caits_local; Owner: -
--

CREATE TABLE caits_local.org_businessunit_mst (
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
-- Name: org_businessunit_mst_bu_bu_id_seq; Type: SEQUENCE; Schema: caits_local; Owner: -
--

ALTER TABLE caits_local.org_businessunit_mst ALTER COLUMN bu_bu_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits_local.org_businessunit_mst_bu_bu_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: org_entity_mst; Type: TABLE; Schema: caits_local; Owner: -
--

CREATE TABLE caits_local.org_entity_mst (
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
-- Name: org_entity_mst_ent_entity_id_seq; Type: SEQUENCE; Schema: caits_local; Owner: -
--

ALTER TABLE caits_local.org_entity_mst ALTER COLUMN ent_entity_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits_local.org_entity_mst_ent_entity_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: org_location_mst; Type: TABLE; Schema: caits_local; Owner: -
--

CREATE TABLE caits_local.org_location_mst (
    loc_location_id integer NOT NULL,
    loc_location_code character varying(20) NOT NULL,
    loc_location_name character varying(150) NOT NULL,
    loc_location_type character varying(30),
    loc_entity_id_ent integer NOT NULL,
    loc_bu_id_bu integer NOT NULL,
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
-- Name: org_location_mst_loc_location_id_seq; Type: SEQUENCE; Schema: caits_local; Owner: -
--

ALTER TABLE caits_local.org_location_mst ALTER COLUMN loc_location_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits_local.org_location_mst_loc_location_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: subcategory_mst; Type: TABLE; Schema: caits_local; Owner: -
--

CREATE TABLE caits_local.subcategory_mst (
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
-- Name: subcategory_mst_scat_subcategory_id_seq; Type: SEQUENCE; Schema: caits_local; Owner: -
--

ALTER TABLE caits_local.subcategory_mst ALTER COLUMN scat_subcategory_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits_local.subcategory_mst_scat_subcategory_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sysm_menutree_mst; Type: TABLE; Schema: caits_local; Owner: -
--

CREATE TABLE caits_local.sysm_menutree_mst (
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
-- Name: sysm_menutree_mst_mtree_menu_id_seq; Type: SEQUENCE; Schema: caits_local; Owner: -
--

ALTER TABLE caits_local.sysm_menutree_mst ALTER COLUMN mtree_menu_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits_local.sysm_menutree_mst_mtree_menu_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sysm_rolepermission_dtl; Type: TABLE; Schema: caits_local; Owner: -
--

CREATE TABLE caits_local.sysm_rolepermission_dtl (
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
-- Name: sysm_rolepermission_dtl_rlpm_role_permission_id_seq; Type: SEQUENCE; Schema: caits_local; Owner: -
--

ALTER TABLE caits_local.sysm_rolepermission_dtl ALTER COLUMN rlpm_role_permission_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits_local.sysm_rolepermission_dtl_rlpm_role_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sysm_roles_mst; Type: TABLE; Schema: caits_local; Owner: -
--

CREATE TABLE caits_local.sysm_roles_mst (
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
-- Name: sysm_roles_mst_rol_role_id_seq; Type: SEQUENCE; Schema: caits_local; Owner: -
--

ALTER TABLE caits_local.sysm_roles_mst ALTER COLUMN rol_role_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits_local.sysm_roles_mst_rol_role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sysm_user_bu_mapping_dtl; Type: TABLE; Schema: caits_local; Owner: -
--

CREATE TABLE caits_local.sysm_user_bu_mapping_dtl (
    uboa_user_bu_access_id integer NOT NULL,
    uboa_user_id_usr integer NOT NULL,
    uboa_bu_id_bu integer NOT NULL
);


--
-- Name: sysm_user_bu_mapping_dtl_uboa_user_bu_access_id_seq; Type: SEQUENCE; Schema: caits_local; Owner: -
--

ALTER TABLE caits_local.sysm_user_bu_mapping_dtl ALTER COLUMN uboa_user_bu_access_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits_local.sysm_user_bu_mapping_dtl_uboa_user_bu_access_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sysm_user_favourite_menu_dtl; Type: TABLE; Schema: caits_local; Owner: -
--

CREATE TABLE caits_local.sysm_user_favourite_menu_dtl (
    ufav_favourite_id integer NOT NULL,
    ufav_user_id_usr integer NOT NULL,
    ufav_menu_code_mtree character varying(20) NOT NULL,
    ufav_sort_order integer DEFAULT 0 NOT NULL,
    ufav_created_on timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE sysm_user_favourite_menu_dtl; Type: COMMENT; Schema: caits_local; Owner: -
--

COMMENT ON TABLE caits_local.sysm_user_favourite_menu_dtl IS 'Menus the user pinned to the top of their sidebar';


--
-- Name: COLUMN sysm_user_favourite_menu_dtl.ufav_menu_code_mtree; Type: COMMENT; Schema: caits_local; Owner: -
--

COMMENT ON COLUMN caits_local.sysm_user_favourite_menu_dtl.ufav_menu_code_mtree IS 'Matches sysm_menutree_mst.mtree_menu_code / navigation.ts menuCode';


--
-- Name: sysm_user_favourite_menu_dtl_ufav_favourite_id_seq; Type: SEQUENCE; Schema: caits_local; Owner: -
--

ALTER TABLE caits_local.sysm_user_favourite_menu_dtl ALTER COLUMN ufav_favourite_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits_local.sysm_user_favourite_menu_dtl_ufav_favourite_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sysm_user_location_mapping_dtl; Type: TABLE; Schema: caits_local; Owner: -
--

CREATE TABLE caits_local.sysm_user_location_mapping_dtl (
    uloc_user_loc_access_id integer NOT NULL,
    uloc_user_id_usr integer NOT NULL,
    uloc_location_id_loc integer NOT NULL
);


--
-- Name: sysm_user_location_mapping_dtl_uloc_user_loc_access_id_seq; Type: SEQUENCE; Schema: caits_local; Owner: -
--

CREATE SEQUENCE caits_local.sysm_user_location_mapping_dtl_uloc_user_loc_access_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sysm_user_location_mapping_dtl_uloc_user_loc_access_id_seq; Type: SEQUENCE OWNED BY; Schema: caits_local; Owner: -
--

ALTER SEQUENCE caits_local.sysm_user_location_mapping_dtl_uloc_user_loc_access_id_seq OWNED BY caits_local.sysm_user_location_mapping_dtl.uloc_user_loc_access_id;


--
-- Name: sysm_useraccess_exception_dtl; Type: TABLE; Schema: caits_local; Owner: -
--

CREATE TABLE caits_local.sysm_useraccess_exception_dtl (
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
-- Name: sysm_useraccess_exception_dtl_uexc_exception_id_seq; Type: SEQUENCE; Schema: caits_local; Owner: -
--

ALTER TABLE caits_local.sysm_useraccess_exception_dtl ALTER COLUMN uexc_exception_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits_local.sysm_useraccess_exception_dtl_uexc_exception_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sysm_userlogin_mst; Type: TABLE; Schema: caits_local; Owner: -
--

CREATE TABLE caits_local.sysm_userlogin_mst (
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
    usr_location_access_scope character varying(20) DEFAULT 'ALL'::character varying NOT NULL
);


--
-- Name: COLUMN sysm_userlogin_mst.usr_location_access_scope; Type: COMMENT; Schema: caits_local; Owner: -
--

COMMENT ON COLUMN caits_local.sysm_userlogin_mst.usr_location_access_scope IS 'ALL = every location in org (filtered by OU scope); SELECTED = rows in sysm_user_location_mapping_dtl';


--
-- Name: sysm_userlogin_mst_usr_user_id_seq; Type: SEQUENCE; Schema: caits_local; Owner: -
--

ALTER TABLE caits_local.sysm_userlogin_mst ALTER COLUMN usr_user_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits_local.sysm_userlogin_mst_usr_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: txn_detail_dtl; Type: TABLE; Schema: caits_local; Owner: -
--

CREATE TABLE caits_local.txn_detail_dtl (
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
-- Name: COLUMN txn_detail_dtl.txd_issued_to_emp_id_emp; Type: COMMENT; Schema: caits_local; Owner: -
--

COMMENT ON COLUMN caits_local.txn_detail_dtl.txd_issued_to_emp_id_emp IS 'Employee the asset unit is issued to when line condition is Issued';


--
-- Name: txn_detail_dtl_txd_txn_detail_id_seq; Type: SEQUENCE; Schema: caits_local; Owner: -
--

ALTER TABLE caits_local.txn_detail_dtl ALTER COLUMN txd_txn_detail_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits_local.txn_detail_dtl_txd_txn_detail_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: txn_header_mst; Type: TABLE; Schema: caits_local; Owner: -
--

CREATE TABLE caits_local.txn_header_mst (
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
-- Name: COLUMN txn_header_mst.txh_prepared_by_emp_id_emp; Type: COMMENT; Schema: caits_local; Owner: -
--

COMMENT ON COLUMN caits_local.txn_header_mst.txh_prepared_by_emp_id_emp IS 'Employee who prepared the document (GRN Other Details sign-off)';


--
-- Name: txn_header_mst_txh_txn_header_id_seq; Type: SEQUENCE; Schema: caits_local; Owner: -
--

ALTER TABLE caits_local.txn_header_mst ALTER COLUMN txh_txn_header_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits_local.txn_header_mst_txh_txn_header_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: unit_mst; Type: TABLE; Schema: caits_local; Owner: -
--

CREATE TABLE caits_local.unit_mst (
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
-- Name: unit_mst_unt_unit_id_seq; Type: SEQUENCE; Schema: caits_local; Owner: -
--

ALTER TABLE caits_local.unit_mst ALTER COLUMN unt_unit_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME caits_local.unit_mst_unt_unit_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: inv_bls_mst ibm_bls_id; Type: DEFAULT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.inv_bls_mst ALTER COLUMN ibm_bls_id SET DEFAULT nextval('caits_local.inv_bls_mst_ibm_bls_id_seq'::regclass);


--
-- Name: sysm_user_location_mapping_dtl uloc_user_loc_access_id; Type: DEFAULT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_user_location_mapping_dtl ALTER COLUMN uloc_user_loc_access_id SET DEFAULT nextval('caits_local.sysm_user_location_mapping_dtl_uloc_user_loc_access_id_seq'::regclass);


--
-- Data for Name: category_mst; Type: TABLE DATA; Schema: caits_local; Owner: -
--

COPY caits_local.category_mst (cat_category_id, cat_category_code, cat_category_name, cat_desc, cat_isactive, cat_created_by, cat_created_on, cat_modified_by, cat_modified_on) FROM stdin;
1	CAT-IT	IT Equipment	Computers, servers, network and peripherals	t	system	2026-07-30 17:35:21.45851	\N	\N
2	CAT-PHY	Physical Assets	Machinery, plant and equipment	t	system	2026-07-30 17:35:21.45851	\N	\N
3	CAT-DIG	Digital Assets	Licenses, subscriptions and digital files	t	system	2026-07-30 17:35:21.45851	\N	\N
4	CAT-CONS	Consumables	Stock consumables and materials	t	system	2026-07-30 17:35:21.45851	\N	\N
5	CAT-RAW	Raw Materials	Raw / input materials for production	t	system	2026-07-30 17:35:21.45851	\N	\N
6	CAT-FG	Finished Goods	Finished / saleable goods	t	system	2026-07-30 17:35:21.45851	\N	\N
7	CAT-SPARE	Spares & Parts	Spare parts and service components	t	system	2026-07-30 17:35:21.45851	\N	\N
8	CAT-PACK	Packaging	Packaging materials and supplies	t	system	2026-07-30 17:35:21.45851	\N	\N
9	CAT-OFFICE	Office Supplies	Stationery and general office consumables	t	system	2026-07-30 17:35:21.45851	\N	\N
10	CAT-OTHER	Other	Unclassified / miscellaneous items	t	system	2026-07-30 17:35:21.45851	\N	\N
\.


--
-- Data for Name: genmaster_mst; Type: TABLE DATA; Schema: caits_local; Owner: -
--

COPY caits_local.genmaster_mst (gmst_genmaster_id, gmst_value_code, gmst_value_name, gmst_gentype_id_gtyp, gmst_sort_order, gmst_desc, gmst_isactive, gmst_created_by, gmst_created_on, gmst_modified_by, gmst_modified_on) FROM stdin;
1	GNM-CONS	Consumable	1	2	Item parameter: Consumable / inventory	t	system	2026-07-30 14:25:02.540572	\N	\N
2	GNM-ASSET	Assets	1	1	Item parameter: Asset / fixed asset	t	system	2026-07-30 14:25:02.540572	\N	\N
3	GNM-STBY	Standby	2	5	RETURNABLE_OR_NON_RETURNABLE — Standby material	t	system	2026-07-30 14:25:02.540572	\N	\N
4	GNM-TRIAL	Trial	2	4	RETURNABLE — Trial material	t	system	2026-07-30 14:25:02.540572	\N	\N
5	GNM-SAMP	Sample	2	3	RETURNABLE_OR_NON_RETURNABLE — Sample receipt	t	system	2026-07-30 14:25:02.540572	\N	\N
6	GNM-LOAN	On loan	2	2	RETURNABLE — Material received on loan	t	system	2026-07-30 14:25:02.540572	\N	\N
7	GNM-OWN	Own material	2	1	NON_RETURNABLE — Own material receipt	t	system	2026-07-30 14:25:02.540572	\N	\N
8	GNM-SCRAP	For Scrap	3	7	N/A — Issue for scrap	t	system	2026-07-30 14:25:02.540572	\N	\N
9	GNM-SALE	For sale	3	6	N/A — Issue for sale	t	system	2026-07-30 14:25:02.540572	\N	\N
10	GNM-SAMPRET	Sample Return	3	5	RETURNABLE — Sample return	t	system	2026-07-30 14:25:02.540572	\N	\N
11	GNM-LOANRET	Loan Return	3	4	N/A — Loan return issue	t	system	2026-07-30 14:25:02.540572	\N	\N
12	GNM-REPAIR	For Repairs	3	3	RETURNABLE — Issue for repairs	t	system	2026-07-30 14:25:02.540572	\N	\N
13	GNM-USE	For Use	3	2	N/A — For Use (in case of Assets)	t	system	2026-07-30 14:25:02.540572	\N	\N
14	GNM-CONSMP	For consumption	3	1	NON_RETURNABLE — Issue for consumption	t	system	2026-07-30 14:25:02.540572	\N	\N
15	GNM-REJ	Rejected	4	3	Internal return reason: Rejected	t	system	2026-07-30 14:25:02.540572	\N	\N
16	GNM-REPL	Replacement	4	2	Internal return reason: Replacement	t	system	2026-07-30 14:25:02.540572	\N	\N
17	GNM-DMG	Damaged	4	1	Internal return reason: Damaged	t	system	2026-07-30 14:25:02.540572	\N	\N
18	GNM-REJST	Rejected Stores	5	3	Store location type: Rejected Stores	t	system	2026-07-30 14:25:02.540572	\N	\N
19	GNM-DMGST	Damaged Stores	5	2	Store location type: Damaged Stores	t	system	2026-07-30 14:25:02.540572	\N	\N
20	GNM-MAIN	Main Stores	5	1	Store location type: Main Stores	t	system	2026-07-30 14:25:02.540572	\N	\N
33	AT-OTHER	Other	6	11	Asset type	t	system	2026-07-30 17:13:30.663936	\N	\N
34	AT-SPARE	Spare Part	6	10	Asset type	t	system	2026-07-30 17:13:30.663936	\N	\N
35	AT-DIG_SUB	Digital – Subscription	6	9	Asset type	t	system	2026-07-30 17:13:30.663936	\N	\N
36	AT-DIG_FILE	Digital – File	6	8	Asset type	t	system	2026-07-30 17:13:30.663936	\N	\N
37	AT-DIG_LICENSE	Digital – License	6	7	Asset type	t	system	2026-07-30 17:13:30.663936	\N	\N
38	AT-PHY_EQUIP	Physical – Equipment	6	6	Asset type	t	system	2026-07-30 17:13:30.663936	\N	\N
39	AT-PHY_MACH	Physical – Machinery	6	5	Asset type	t	system	2026-07-30 17:13:30.663936	\N	\N
40	AT-IT_PERIPH	IT – Peripheral	6	4	Asset type	t	system	2026-07-30 17:13:30.663936	\N	\N
41	AT-IT_NETWORK	IT – Network	6	3	Asset type	t	system	2026-07-30 17:13:30.663936	\N	\N
42	AT-IT_SERVER	IT – Server	6	2	Asset type	t	system	2026-07-30 17:13:30.663936	\N	\N
43	AT-IT_LAPTOP	IT – Laptop	6	1	Asset type	t	system	2026-07-30 17:13:30.663936	\N	\N
44	CT-OTHER	Other	7	7	Consumable type	t	system	2026-07-30 17:13:30.663936	\N	\N
45	CT-PACK	Packaging	7	6	Consumable type	t	system	2026-07-30 17:13:30.663936	\N	\N
46	CT-SPARE	Spare Part	7	5	Consumable type	t	system	2026-07-30 17:13:30.663936	\N	\N
47	CT-CONS	Consumable	7	4	Consumable type	t	system	2026-07-30 17:13:30.663936	\N	\N
48	CT-SFG	Semi-Finished	7	3	Consumable type	t	system	2026-07-30 17:13:30.663936	\N	\N
49	CT-FG	Finished Goods	7	2	Consumable type	t	system	2026-07-30 17:13:30.663936	\N	\N
50	CT-RAW	Raw Material	7	1	Consumable type	t	system	2026-07-30 17:13:30.663936	\N	\N
51	DEPR-NONE	None	8	3	Depreciation method	t	system	2026-07-30 17:13:30.663936	\N	\N
52	DEPR-WDV	Written Down Value (WDV)	8	2	Depreciation method	t	system	2026-07-30 17:13:30.663936	\N	\N
53	DEPR-SLM	Straight Line (SLM)	8	1	Depreciation method	t	system	2026-07-30 17:13:30.663936	\N	\N
54	PT-OTHER	Other	9	6	Party type	t	system	2026-07-30 17:13:30.663936	\N	\N
55	PT-INTERNAL	Internal	9	5	Party type	t	system	2026-07-30 17:13:30.663936	\N	\N
56	PT-CONTRACTOR	Contractor	9	4	Party type	t	system	2026-07-30 17:13:30.663936	\N	\N
57	PT-CUSTOMER	Customer	9	3	Party type	t	system	2026-07-30 17:13:30.663936	\N	\N
58	PT-SUPPLIER	Supplier	9	2	Party type	t	system	2026-07-30 17:13:30.663936	\N	\N
59	PT-VENDOR	Vendor	9	1	Party type	t	system	2026-07-30 17:13:30.663936	\N	\N
60	5	★★★★★ 5 – Excellent	10	5	Vendor rating	t	system	2026-07-30 17:13:30.663936	\N	\N
61	4	★★★★ 4 – Good	10	4	Vendor rating	t	system	2026-07-30 17:13:30.663936	\N	\N
62	3	★★★ 3 – Avg	10	3	Vendor rating	t	system	2026-07-30 17:13:30.663936	\N	\N
63	2	★★ 2 – Fair	10	2	Vendor rating	t	system	2026-07-30 17:13:30.663936	\N	\N
64	1	★ 1 – Poor	10	1	Vendor rating	t	system	2026-07-30 17:13:30.663936	\N	\N
65	OU-OTHER	Other	11	6	OU type	t	system	2026-07-30 17:13:30.663936	\N	\N
66	OU-CORPORATE	Corporate	11	5	OU type	t	system	2026-07-30 17:13:30.663936	\N	\N
67	OU-ZONE	Zone	11	4	OU type	t	system	2026-07-30 17:13:30.663936	\N	\N
68	OU-PLANT	Plant	11	3	OU type	t	system	2026-07-30 17:13:30.663936	\N	\N
69	OU-REGION	Region	11	2	OU type	t	system	2026-07-30 17:13:30.663936	\N	\N
70	OU-BRANCH	Branch	11	1	OU type	t	system	2026-07-30 17:13:30.663936	\N	\N
71	ST-WAREHOUSE	Warehouse	12	6	Store type	t	system	2026-07-30 17:13:30.663936	\N	\N
72	ST-REJECTED	Rejected	12	5	Store type	t	system	2026-07-30 17:13:30.663936	\N	\N
73	ST-QUARANTINE	Quarantine	12	4	Store type	t	system	2026-07-30 17:13:30.663936	\N	\N
74	ST-IT	IT Store	12	3	Store type	t	system	2026-07-30 17:13:30.663936	\N	\N
75	ST-GENERAL	General Store	12	2	Store type	t	system	2026-07-30 17:13:30.663936	\N	\N
76	ST-FM	FM	12	1	Store type	t	system	2026-07-30 17:13:30.663936	\N	\N
77	O	Other	13	3	Gender	t	system	2026-07-30 17:13:30.663936	\N	\N
78	F	Female	13	2	Gender	t	system	2026-07-30 17:13:30.663936	\N	\N
79	M	Male	13	1	Gender	t	system	2026-07-30 17:13:30.663936	\N	\N
80	consultant	Consultant	14	4	Employment type	t	system	2026-07-30 17:13:30.663936	\N	\N
81	intern	Intern	14	3	Employment type	t	system	2026-07-30 17:13:30.663936	\N	\N
82	contract	Contract	14	2	Employment type	t	system	2026-07-30 17:13:30.663936	\N	\N
83	permanent	Permanent	14	1	Employment type	t	system	2026-07-30 17:13:30.663936	\N	\N
84	AS-DISABLED	Disabled	15	3	Account status	t	system	2026-07-30 17:13:30.663936	\N	\N
85	AS-LOCKED	Locked	15	2	Account status	t	system	2026-07-30 17:13:30.663936	\N	\N
86	AS-ACTIVE	Active	15	1	Account status	t	system	2026-07-30 17:13:30.663936	\N	\N
87	SELECTED	Selected Operating Units	16	2	OU access scope	t	system	2026-07-30 17:13:30.663936	\N	\N
88	ALL	All Operating Units	16	1	OU access scope	t	system	2026-07-30 17:13:30.663936	\N	\N
89	Revoke	Revoke Access	17	2	Exception type	t	system	2026-07-30 17:13:30.663936	\N	\N
90	Grant	Grant Access	17	1	Exception type	t	system	2026-07-30 17:13:30.663936	\N	\N
91	RL-10	10	18	10	Role level	t	system	2026-07-30 17:13:30.663936	\N	\N
92	RL-9	9	18	9	Role level	t	system	2026-07-30 17:13:30.663936	\N	\N
93	RL-8	8	18	8	Role level	t	system	2026-07-30 17:13:30.663936	\N	\N
94	RL-7	7	18	7	Role level	t	system	2026-07-30 17:13:30.663936	\N	\N
95	RL-6	6	18	6	Role level	t	system	2026-07-30 17:13:30.663936	\N	\N
96	RL-5	5	18	5	Role level	t	system	2026-07-30 17:13:30.663936	\N	\N
97	RL-4	4	18	4	Role level	t	system	2026-07-30 17:13:30.663936	\N	\N
98	RL-3	3	18	3	Role level	t	system	2026-07-30 17:13:30.663936	\N	\N
99	RL-2	2	18	2	Role level	t	system	2026-07-30 17:13:30.663936	\N	\N
100	RL-1	1	18	1	Role level	t	system	2026-07-30 17:13:30.663936	\N	\N
101	GATEPASS_OUTWARD	Gatepass Outward	19	8	Document type	t	system	2026-07-30 17:13:30.663936	\N	\N
102	GATEPASS_INWARD	Gatepass Inward	19	7	Document type	t	system	2026-07-30 17:13:30.663936	\N	\N
103	MATERIAL_RETURN	Material Return	19	6	Document type	t	system	2026-07-30 17:13:30.663936	\N	\N
104	MATERIAL_TRANSFER	Material Transfer	19	5	Document type	t	system	2026-07-30 17:13:30.663936	\N	\N
105	GRN	Goods Receipt Note (GRN)	19	4	Document type	t	system	2026-07-30 17:13:30.663936	\N	\N
106	MATERIAL_ISSUE	Store Issue	19	3	Document type	t	system	2026-07-30 17:13:30.663936	\N	\N
107	MATERIAL_REQUISITION	Store Requisition	19	2	Document type	t	system	2026-07-30 17:13:30.663936	\N	\N
108	OPENING_STOCK	Opening Stock	19	1	Document type	t	system	2026-07-30 17:13:30.663936	\N	\N
109	DS-REJECTED	Rejected	20	5	Document status	t	system	2026-07-30 17:13:30.663936	\N	\N
110	DS-COMPLETED	Completed	20	4	Document status	t	system	2026-07-30 17:13:30.663936	\N	\N
111	DS-PENDING	Pending Approval	20	3	Document status	t	system	2026-07-30 17:13:30.663936	\N	\N
112	DS-APPROVED	Approved	20	2	Document status	t	system	2026-07-30 17:13:30.663936	\N	\N
113	DS-DRAFT	Draft	20	1	Document status	t	system	2026-07-30 17:13:30.663936	\N	\N
114	SS-OUT	Out of Stock	21	3	Stock status	t	system	2026-07-30 17:13:30.663936	\N	\N
115	SS-LOW	Low Stock	21	2	Stock status	t	system	2026-07-30 17:13:30.663936	\N	\N
116	SS-IN_STOCK	In Stock	21	1	Stock status	t	system	2026-07-30 17:13:30.663936	\N	\N
117	new	New Inward Entry	22	2	Gatepass inward type	t	system	2026-07-30 17:13:30.663936	\N	\N
118	returnable	Against Returnable Outward	22	1	Gatepass inward type	t	system	2026-07-30 17:13:30.663936	\N	\N
119	Y	Returnable	23	2	Returnable flag	t	system	2026-07-30 17:13:30.663936	\N	\N
120	N	Non Returnable	23	1	Returnable flag	t	system	2026-07-30 17:13:30.663936	\N	\N
121	AC-DEAD	Dead	24	7	Asset condition	t	system	2026-07-31 12:09:51.74809	\N	\N
122	AC-SCRAP	Scrap	24	6	Asset condition	t	system	2026-07-31 12:09:51.74809	\N	\N
123	AC-REPAIR	Under Repair	24	5	Asset condition	t	system	2026-07-31 12:09:51.74809	\N	\N
124	AC-FAULTY	Faulty	24	4	Asset condition	t	system	2026-07-31 12:09:51.74809	\N	\N
125	AC-CUSTODY	In Custody	24	3	Asset condition	t	system	2026-07-31 12:09:51.74809	\N	\N
126	AC-ISSUED	Issued	24	2	Asset condition	t	system	2026-07-31 12:09:51.74809	\N	\N
127	AC-INSTOCK	In Stock	24	1	Asset condition	t	system	2026-07-31 12:09:51.74809	\N	\N
128	IPM-DHCP	DHCP	25	2	IP assignment mode	t	system	2026-07-31 12:09:51.74809	\N	\N
129	IPM-STATIC	Static	25	1	IP assignment mode	t	system	2026-07-31 12:09:51.74809	\N	\N
130	ST-DEVAREA	Developemnt Area	12	0		t	admin	2026-07-31 17:27:25.018474	\N	\N
131	DEPT-IT	IT	26	1	\N	t	system	2026-08-01 11:53:42.922477	\N	\N
132	DEPT-STORES	Stores	26	2	\N	t	system	2026-08-01 11:53:42.922477	\N	\N
133	DEPT-OPS	Operations	26	3	\N	t	system	2026-08-01 11:53:42.922477	\N	\N
134	DEPT-ADMIN	Admin	26	4	\N	t	system	2026-08-01 11:53:42.922477	\N	\N
135	DEPT-FIN	Finance	26	5	\N	t	system	2026-08-01 11:53:42.922477	\N	\N
136	DEPT-HR	HR	26	6	\N	t	system	2026-08-01 11:53:42.922477	\N	\N
137	DEPT-MAINT	Maintenance	26	7	\N	t	system	2026-08-01 11:53:42.922477	\N	\N
138	DEPT-PROD	Production	26	8	\N	t	system	2026-08-01 11:53:42.922477	\N	\N
139	DESIG-SYSADMIN	System Administrator	27	1	\N	t	system	2026-08-01 11:53:43.03763	\N	\N
140	DESIG-STRMGR	Store Manager	27	2	\N	t	system	2026-08-01 11:53:43.03763	\N	\N
141	DESIG-ASSETMGR	Asset Manager	27	3	\N	t	system	2026-08-01 11:53:43.03763	\N	\N
142	DESIG-SUPVR	Supervisor	27	4	\N	t	system	2026-08-01 11:53:43.03763	\N	\N
143	DESIG-STRKEEP	Store Keeper	27	5	\N	t	system	2026-08-01 11:53:43.03763	\N	\N
144	DESIG-MGR	Manager	27	6	\N	t	system	2026-08-01 11:53:43.03763	\N	\N
145	DESIG-EXEC	Executive	27	7	\N	t	system	2026-08-01 11:53:43.03763	\N	\N
146	DESIG-OFFICER	Officer	27	8	\N	t	system	2026-08-01 11:53:43.03763	\N	\N
\.


--
-- Data for Name: gentype_mst; Type: TABLE DATA; Schema: caits_local; Owner: -
--

COPY caits_local.gentype_mst (gtyp_gentype_id, gtyp_type_code, gtyp_type_name, gtyp_desc, gtyp_isactive, gtyp_created_by, gtyp_created_on, gtyp_modified_by, gtyp_modified_on) FROM stdin;
1	GTY-ITMPAR	Item Parameters	Item classification used across masters and transactions — Asset vs Consumable	t	system	2026-07-30 14:25:02.448936	\N	\N
2	GTY-RCPT	Receipt Purpose	Purpose of material receipt (GRN / inward). Description carries Returnable / Non-Returnable rule	t	system	2026-07-30 14:25:02.448936	\N	\N
3	GTY-ISSUE	Issue Purpose	Purpose of material issue / store issue. Description carries Returnable / Non-Returnable rule	t	system	2026-07-30 14:25:02.448936	\N	\N
4	GTY-IMR	Internal Material Return Reasons	Standard reasons for internal material return	t	system	2026-07-30 14:25:02.448936	\N	\N
5	GTY-STRLOC	Store Locations	Standard store location types (Main / Damaged / Rejected)	t	system	2026-07-30 14:25:02.448936	\N	\N
6	GTY-ASSETTYP	Asset Type	Asset classification used on Item Master (asset items)	t	system	2026-07-30 17:07:20.834639	\N	\N
7	GTY-CONSTYP	Consumable Type	Consumable / stock classification used on Item Master	t	system	2026-07-30 17:07:20.834639	\N	\N
8	GTY-DEPR	Depreciation Method	Depreciation methods for fixed assets	t	system	2026-07-30 17:07:20.834639	\N	\N
9	GTY-PARTY	Party Type	Vendor / party classification	t	system	2026-07-30 17:07:20.834639	\N	\N
10	GTY-RATING	Vendor Rating	1–5 vendor performance rating	t	system	2026-07-30 17:07:20.834639	\N	\N
11	GTY-OUTYPE	OU Type	Operating unit types	t	system	2026-07-30 17:07:20.834639	\N	\N
13	GTY-GENDER	Gender	Employee gender codes	t	system	2026-07-30 17:07:20.834639	\N	\N
14	GTY-EMPTYP	Employment Type	Employee employment / engagement type	t	system	2026-07-30 17:07:20.834639	\N	\N
15	GTY-ACCTSTAT	Account Status	User login account status	t	system	2026-07-30 17:07:20.834639	\N	\N
16	GTY-OUSCOPE	OU Access Scope	User access scope for operating units	t	system	2026-07-30 17:07:20.834639	\N	\N
17	GTY-EXCTYPE	Exception Type	User access exception grant / revoke	t	system	2026-07-30 17:07:20.834639	\N	\N
18	GTY-ROLELVL	Role Level	Access role hierarchy levels 1–10	t	system	2026-07-30 17:07:20.834639	\N	\N
19	GTY-DOCTYPE	Document Type	Transaction / document types for reports and filters	t	system	2026-07-30 17:07:20.834639	\N	\N
20	GTY-DOCSTAT	Document Status	Transaction / document status values	t	system	2026-07-30 17:07:20.834639	\N	\N
21	GTY-STKSTAT	Stock Status	Stock register status filters	t	system	2026-07-30 17:07:20.834639	\N	\N
22	GTY-GPIN	Gatepass Inward Type	Gatepass inward entry mode	t	system	2026-07-30 17:07:20.834639	\N	\N
23	GTY-RETFLAG	Returnable Flag	Returnable / Non-Returnable flag for outward / issue	t	system	2026-07-30 17:07:20.834639	\N	\N
12	GTY-STRTYPE	Location Type	Store / location types used on Store Master	t	system	2026-07-30 17:07:20.834639	admin	2026-07-30 18:19:15.676064
24	GTY-ASSETCOND	Asset Condition	Physical condition / disposition of an asset	t	system	2026-07-31 12:09:51.638621	\N	\N
25	GTY-IPMODE	IP Assignment Mode	Static or DHCP IP allocation	t	system	2026-07-31 12:09:51.638621	\N	\N
26	GTY-DEPT	Department	Departments raising requisitions	t	system	2026-08-01 11:53:42.922477	\N	\N
27	GTY-DESIG	Designation	Employee designations	t	system	2026-08-01 11:53:43.03763	\N	\N
\.


--
-- Data for Name: hrc_department_mst; Type: TABLE DATA; Schema: caits_local; Owner: -
--

COPY caits_local.hrc_department_mst (dept_department_id, dept_department_code, dept_department_name, dept_entity_id_ent, dept_head_emp_id_emp, dept_desc, dept_isactive, dept_created_by, dept_created_on, dept_modified_by, dept_modified_on) FROM stdin;
1	DEPT-IT	IT	2	\N	\N	t	system	2026-08-12 18:36:48.180663	\N	\N
2	DEPT-STORES	Stores	2	\N	\N	t	system	2026-08-12 18:36:48.180663	\N	\N
3	DEPT-OPS	Operations	2	\N	\N	t	system	2026-08-12 18:36:48.180663	\N	\N
4	DEPT-ADMIN	Admin	2	\N	\N	t	system	2026-08-12 18:36:48.180663	\N	\N
5	DEPT-FIN	Finance	2	\N	\N	t	system	2026-08-12 18:36:48.180663	\N	\N
6	DEPT-HR	HR	2	\N	\N	t	system	2026-08-12 18:36:48.180663	\N	\N
7	DEPT-MAINT	Maintenance	2	\N	\N	t	system	2026-08-12 18:36:48.180663	\N	\N
8	DEPT-PROD	Production	2	\N	\N	t	system	2026-08-12 18:36:48.180663	\N	\N
\.


--
-- Data for Name: hrc_employee_mst; Type: TABLE DATA; Schema: caits_local; Owner: -
--

COPY caits_local.hrc_employee_mst (emp_employee_id, emp_employee_code, emp_first_name, emp_last_name, emp_gender, emp_dob, emp_joining_date, emp_employment_type, emp_designation, emp_email, emp_phone, emp_alt_phone, emp_role_id_rol, emp_base_location_id_loc, emp_reporting_to_emp_id_emp, emp_isactive, emp_created_by, emp_created_on, emp_modified_by, emp_modified_on, emp_department_id_dept) FROM stdin;
2	EMP00	Sudhanshu	Nakhate	M	2000-05-12	\N	permanent	Store Manager	snakhate@microproindia.com	08739847848	\N	2	1	1	t	admin	2026-07-29 18:34:54.452281	admin	2026-08-03 18:18:51.09926	\N
1	ADMIN	System	Admin	\N	\N	\N	\N	Administrator	admin@caits.local	\N	\N	1	\N	\N	t	system	2026-07-29 15:50:34.424544	\N	\N	1
\.


--
-- Data for Name: inv_bls_mst; Type: TABLE DATA; Schema: caits_local; Owner: -
--

COPY caits_local.inv_bls_mst (ibm_bls_id, ibm_entity_id_ent, ibm_item_id_itm, ibm_batch_no, ibm_lot_no, ibm_serial_no, ibm_mfg_date, ibm_expiry_date, ibm_best_before_date, ibm_ip_address, ibm_mac_address, ibm_hostname, ibm_item_condition, ibm_current_location_id_loc, ibm_is_dummy, ibm_isactive, ibm_islocked, ibm_locked_reason, ibm_locked_on, ibm_created_by, ibm_created_on, ibm_modified_by, ibm_modified_on, ibm_issued_to_emp_id_emp) FROM stdin;
53	2	174	\N	\N	R9NXCV14F66638B	\N	\N	\N	\N	\N	\N	Dead	1	f	t	f	\N	\N	admin	2026-08-17 18:19:08.90907	\N	\N	\N
54	\N	174	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	t	t	f	\N	\N	admin	2026-08-17 18:20:22.024988	\N	\N	\N
49	2	174	\N	\N	R9NXCV14F72238B	\N	\N	\N	192.168.0.245	\N	\N	In Stock	1	f	t	f	\N	\N	admin	2026-08-17 18:19:08.209053	admin	2026-08-17 18:20:45.509118	\N
50	2	174	\N	\N	R9NXCV14F71838F	\N	\N	\N	192.168.0.247	\N	\N	In Stock	1	f	t	f	\N	\N	admin	2026-08-17 18:19:08.459332	admin	2026-08-17 18:20:45.821972	\N
51	2	174	\N	\N	R9NXCV14F67138E	\N	\N	\N	192.168.0.244	\N	\N	In Stock	1	f	t	f	\N	\N	admin	2026-08-17 18:19:08.611965	admin	2026-08-17 18:20:45.991221	\N
52	2	174	\N	\N	R9NXCV14F596388	\N	\N	\N	192.168.0.248	\N	\N	In Stock	1	f	t	f	\N	\N	admin	2026-08-17 18:19:08.792815	admin	2026-08-17 18:20:46.075176	\N
\.


--
-- Data for Name: inv_item_mst; Type: TABLE DATA; Schema: caits_local; Owner: -
--

COPY caits_local.inv_item_mst (itm_item_id, itm_item_code, itm_item_name, itm_item_type, itm_category_id_cat, itm_subcategory_id_scat, itm_uom_id_unt, itm_standard_cost, itm_image_url, itm_desc, itm_remarks, itm_asset_type, itm_make_brand, itm_model, itm_useful_life_years, itm_depreciation_method, itm_depreciation_rate, itm_current_location_id_loc, itm_is_serialized, itm_is_returnable, itm_is_under_amc, itm_is_insurance_required, itm_consumable_type, itm_track_batch_lot, itm_track_expiry, itm_is_consumable, itm_allow_negative_stock, itm_isactive, itm_created_by, itm_created_on, itm_modified_by, itm_modified_on, itm_inspection_needed, itm_ram, itm_storage, itm_processor, itm_product_no, itm_parent_item_id_itm) FROM stdin;
174	LAPTOP-001	ASUS ExpertBook	asset	3	\N	3	30000.00	\N	\N	\N	IT – Laptop	ASUS	B1930N -18.5Inch	0.00	None	\N	1	t	t	t	f	\N	f	f	f	f	t	admin	2026-08-17 16:01:41.516087	\N	\N	t	8GB	512GB	Intel Core i3	\N	\N
181	CON-002	Tissue Paper	consumable	4	16	8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	f	f	f	f	Consumable	f	f	t	f	t	admin	2026-08-17 17:55:48.2916	\N	\N	f	\N	\N	\N	\N	\N
175	LAPTOP-002	HP ProBook 440 G5	asset	1	6	3	32000.00	\N	\N	\N	IT – Laptop	HP	\N	\N	\N	\N	1	t	t	f	f	\N	f	f	f	f	t	admin	2026-08-17 17:39:25.349617	\N	\N	t	16	512GB	Intel Core i3	\N	\N
176	LAPTOP-003	HP EliteBook 840 G3	asset	1	6	3	\N	\N	\N	\N	IT – Laptop	HP	\N	\N	\N	\N	1	t	f	f	f	\N	f	f	f	f	t	admin	2026-08-17 17:41:34.7797	\N	\N	t	16 GB	\N	\N	\N	\N
179	SERVER-001	GPU	asset	1	4	3	400000.00	\N	\N	\N	IT – Server	\N	\N	\N	\N	\N	1	t	f	f	f	\N	f	f	f	f	t	admin	2026-08-17 17:53:19.605562	\N	\N	t	\N	\N	\N	\N	\N
177	DESKTOP-001	HP ProDesk 400 G4 SFF	asset	1	5	3	50000.00	\N	\N	\N	IT – Laptop	HP	S19A10N -18.5 Inch	\N	\N	\N	1	t	f	f	f	\N	f	f	f	f	t	admin	2026-08-17 17:44:41.96322	\N	\N	t	8GB	500GB HDD	\N	\N	\N
178	DESKTOP-002	Acer Monitor27 Inch KA270	asset	1	5	3	70000.00	\N	\N	\N	IT – Laptop	Acer	27 Inch KA270	\N	\N	\N	1	t	f	f	f	\N	f	f	f	f	t	admin	2026-08-17 17:50:36.787713	\N	\N	t	16	\N	\N	\N	\N
180	CON-001	Paper A4	consumable	4	16	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	f	f	f	f	Consumable	f	f	t	f	t	admin	2026-08-17 17:54:39.48706	\N	\N	f	\N	\N	\N	\N	\N
182	CON-003	Room Freshner	consumable	4	16	9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	f	f	f	f	Consumable	f	f	t	f	t	admin	2026-08-17 17:56:33.235091	\N	\N	f	\N	\N	\N	\N	\N
184	CON-005	Tea	consumable	5	17	13	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27	f	f	f	f	Raw Material	f	t	t	f	t	admin	2026-08-17 18:00:42.596724	admin	2026-08-17 18:10:06.275143	f	\N	\N	\N	\N	\N
183	CON-004	Paper Cups	consumable	4	16	9	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	27	f	f	f	f	Consumable	f	f	t	f	t	admin	2026-08-17 17:59:24.263352	admin	2026-08-17 18:10:19.807386	f	\N	\N	\N	\N	\N
\.


--
-- Data for Name: inv_stock_mst; Type: TABLE DATA; Schema: caits_local; Owner: -
--

COPY caits_local.inv_stock_mst (stk_stock_id, stk_item_id_itm, stk_location_id_loc, stk_location_bin, stk_batch_lot_no, stk_uom_id_unt, stk_opening_qty, stk_inward_qty, stk_issued_qty, stk_transferred_in_qty, stk_transferred_out_qty, stk_returned_qty, stk_adjusted_qty, stk_current_qty, stk_reserved_qty, stk_available_qty, stk_reorder_level, stk_min_stock_level, stk_max_stock_level, stk_avg_rate, stk_stock_value, stk_expiry_date, stk_last_txn_header_id_txh, stk_last_transaction_date, stk_isactive, stk_created_by, stk_created_on, stk_modified_by, stk_modified_on) FROM stdin;
59	174	1	\N	R9NXCV14F67138E	3	\N	1.000	\N	\N	\N	\N	\N	1.000	\N	1.000	\N	\N	\N	\N	\N	\N	69	2026-08-17	t	admin	2026-08-17 18:20:46.406031	\N	\N
60	174	1	\N	R9NXCV14F596388	3	\N	1.000	\N	\N	\N	\N	\N	1.000	\N	1.000	\N	\N	\N	\N	\N	\N	69	2026-08-17	t	admin	2026-08-17 18:20:46.487129	\N	\N
57	174	1	\N	R9NXCV14F72238B	3	\N	1.000	1.000	\N	\N	\N	\N	0.000	\N	0.000	\N	\N	\N	\N	\N	\N	71	2026-08-17	t	admin	2026-08-17 18:20:46.273381	admin	2026-08-17 18:21:17.103919
58	174	1	\N	R9NXCV14F71838F	3	\N	1.000	1.000	\N	\N	\N	\N	0.000	\N	0.000	\N	\N	\N	\N	\N	\N	73	2026-08-17	t	admin	2026-08-17 18:20:46.339441	admin	2026-08-17 18:46:29.496092
56	174	8	\N	R9NXCV14F66638B	3	\N	1.000	\N	\N	\N	\N	\N	1.000	\N	1.000	\N	\N	\N	\N	\N	\N	68	2026-08-17	t	admin	2026-08-17 18:19:09.560949	\N	\N
52	174	9	\N	R9NXCV14F72238B	3	\N	1.000	1.000	\N	\N	\N	\N	0.000	\N	0.000	\N	\N	\N	\N	\N	\N	69	2026-08-17	t	admin	2026-08-17 18:19:09.076521	admin	2026-08-17 18:20:46.187537
53	174	9	\N	R9NXCV14F71838F	3	\N	1.000	1.000	\N	\N	\N	\N	0.000	\N	0.000	\N	\N	\N	\N	\N	\N	69	2026-08-17	t	admin	2026-08-17 18:19:09.191031	admin	2026-08-17 18:20:46.304206
54	174	9	\N	R9NXCV14F67138E	3	\N	1.000	1.000	\N	\N	\N	\N	0.000	\N	0.000	\N	\N	\N	\N	\N	\N	69	2026-08-17	t	admin	2026-08-17 18:19:09.325889	admin	2026-08-17 18:20:46.390112
55	174	9	\N	R9NXCV14F596388	3	\N	1.000	1.000	\N	\N	\N	\N	0.000	\N	0.000	\N	\N	\N	\N	\N	\N	69	2026-08-17	t	admin	2026-08-17 18:19:09.497529	admin	2026-08-17 18:20:46.456779
\.


--
-- Data for Name: inv_vendor_mst; Type: TABLE DATA; Schema: caits_local; Owner: -
--

COPY caits_local.inv_vendor_mst (vnd_vendor_id, vnd_vendor_code, vnd_vendor_name, vnd_party_type, vnd_gstin, vnd_pan_no, vnd_rating, vnd_add1, vnd_add2, vnd_city, vnd_state, vnd_pin, vnd_country, vnd_contact_person, vnd_phone, vnd_alt_phone, vnd_email, vnd_website, vnd_notes, vnd_isactive, vnd_created_by, vnd_created_on, vnd_modified_by, vnd_modified_on) FROM stdin;
1	VND-001	Tech Source India PVT LTD	Vendor	73NDNEU83N38YNDYE733	AABCT9384H	4	No. 24	Green Plaza	Nagpur	Maharashtra	440010	India	Shreyash Kumar	9837362638	\N	sanika@microproindia.com	\N	\N	t	admin	2026-07-30 18:05:38.672715	\N	\N
\.


--
-- Data for Name: org_businessunit_mst; Type: TABLE DATA; Schema: caits_local; Owner: -
--

COPY caits_local.org_businessunit_mst (bu_bu_id, bu_bu_code, bu_bu_name, bu_entity_id_ent, bu_bu_type, bu_manager_emp_id_emp, bu_add1, bu_add2, bu_city, bu_state, bu_pin, bu_isactive, bu_created_by, bu_created_on, bu_modified_by, bu_modified_on) FROM stdin;
1	OU-001	Micropro Gayatri Nagar	2	Branch	\N	\N	\N	Nagpur	\N	\N	t	admin	2026-07-29 17:17:42.191256	\N	\N
2	OU-002	Micropro Mangalam Branch	2	Branch	\N	\N	\N	Nagpur	\N	\N	t	admin	2026-07-31 17:13:50.540607	\N	\N
\.


--
-- Data for Name: org_entity_mst; Type: TABLE DATA; Schema: caits_local; Owner: -
--

COPY caits_local.org_entity_mst (ent_entity_id, ent_entity_code, ent_entity_name, ent_short_name, ent_legal_name, ent_gstin, ent_pan_no, ent_cin, ent_add1, ent_add2, ent_city, ent_state, ent_pin, ent_country, ent_contact_person, ent_phone, ent_email, ent_isactive, ent_created_by, ent_created_on, ent_modified_by, ent_modified_on) FROM stdin;
2	ORG-001	Micropro Software Solutions	Micropro	\N		\N	\N	\N	\N	Nagpur	\N	\N	\N	\N	\N	\N	t	admin	2026-07-29 17:16:23.293892	\N	\N
\.


--
-- Data for Name: org_location_mst; Type: TABLE DATA; Schema: caits_local; Owner: -
--

COPY caits_local.org_location_mst (loc_location_id, loc_location_code, loc_location_name, loc_location_type, loc_entity_id_ent, loc_bu_id_bu, loc_manager_emp_id_emp, loc_add1, loc_add2, loc_city, loc_pin, loc_isactive, loc_created_by, loc_created_on, loc_modified_by, loc_modified_on, loc_is_system_location, loc_system_role, loc_print_location_name) FROM stdin;
1	LOC-001	FM Store	FM	2	1	\N	\N	\N	FM Section	\N	t	admin	2026-07-29 17:22:52.050822	\N	\N	f	\N	\N
2	LOC-002	Admin Store	General Store	2	1	\N	\N	\N	Nagpur	\N	t	admin	2026-07-31 17:15:41.137576	\N	\N	f	\N	\N
3	LOC-003	Development  Floor	Developemnt Area	2	1	\N	\N	\N	Nagpur	\N	t	admin	2026-07-31 17:28:08.641396	\N	\N	f	\N	\N
4	LOC-004	IT Store	IT Store	2	2	\N	\N	\N	Nagpur	\N	t	admin	2026-07-31 17:28:58.722474	\N	\N	f	\N	\N
7	SYS-2-MAIN	Main Store	System	2	1	\N	\N	\N	\N	\N	t	system	2026-08-11 19:06:45.950391	\N	\N	t	MAIN_STORE	Main Store
8	SYS-2-REJ	Rejected	System	2	1	\N	\N	\N	\N	\N	t	system	2026-08-11 19:06:45.950391	\N	\N	t	REJECTED	Rejected
9	SYS-2-QRT	Quarantine	System	2	1	\N	\N	\N	\N	\N	t	system	2026-08-11 19:06:45.950391	\N	\N	t	QUARANTINE	Quarantine
10	SYS-2-DMG	Damaged	System	2	1	\N	\N	\N	\N	\N	t	system	2026-08-11 19:06:45.950391	\N	\N	t	DAMAGED	Damaged
11	SYS-2-SCR	Scrap	System	2	1	\N	\N	\N	\N	\N	t	system	2026-08-11 19:06:45.950391	\N	\N	t	SCRAP	Scrap
22	SYS-2-MAIN-OU	Main Store	System	2	2	\N	\N	\N	\N	\N	t	system	2026-08-12 18:36:47.484426	\N	\N	t	MAIN_STORE	Main Store
23	SYS-2-REJ-OU	Rejected	System	2	2	\N	\N	\N	\N	\N	t	system	2026-08-12 18:36:47.484426	\N	\N	t	REJECTED	Rejected
24	SYS-2-QRT-OU	Quarantine	System	2	2	\N	\N	\N	\N	\N	t	system	2026-08-12 18:36:47.484426	\N	\N	t	QUARANTINE	Quarantine
25	SYS-2-DMG-OU	Damaged	System	2	2	\N	\N	\N	\N	\N	t	system	2026-08-12 18:36:47.484426	\N	\N	t	DAMAGED	Damaged
26	SYS-2-SCR-OU	Scrap	System	2	2	\N	\N	\N	\N	\N	t	system	2026-08-12 18:36:47.484426	\N	\N	t	SCRAP	Scrap
27	LOC-005	Pantry	Warehouse	2	1	\N	\N	\N	Nagpur	\N	t	admin	2026-08-17 18:08:56.17534	\N	\N	f	\N	\N
\.


--
-- Data for Name: subcategory_mst; Type: TABLE DATA; Schema: caits_local; Owner: -
--

COPY caits_local.subcategory_mst (scat_subcategory_id, scat_subcategory_code, scat_subcategory_name, scat_category_id_cat, scat_desc, scat_isactive, scat_created_by, scat_created_on, scat_modified_by, scat_modified_on) FROM stdin;
1	SC-MOBILE	Mobile Devices	1	Phones, tablets, handhelds	t	system	2026-07-30 17:35:21.475441	\N	\N
2	SC-PERIPH	Peripherals	1	Monitors, printers, scanners, keyboards	t	system	2026-07-30 17:35:21.475441	\N	\N
3	SC-NETWORK	Network Devices	1	Switches, routers, access points	t	system	2026-07-30 17:35:21.475441	\N	\N
4	SC-SERVER	Servers	1	Physical / virtual servers	t	system	2026-07-30 17:35:21.475441	\N	\N
5	SC-DESKTOP	Desktops	1	Desktop PCs and workstations	t	system	2026-07-30 17:35:21.475441	\N	\N
6	SC-LAPTOP	Laptops	1	Notebook / laptop computers	t	system	2026-07-30 17:35:21.475441	\N	\N
7	SC-VEH	Vehicles	2	Company vehicles / material handling	t	system	2026-07-30 17:35:21.475441	\N	\N
8	SC-FURN	Furniture	2	Office and warehouse furniture	t	system	2026-07-30 17:35:21.475441	\N	\N
9	SC-EQUIP	Equipment	2	Tools and general equipment	t	system	2026-07-30 17:35:21.475441	\N	\N
10	SC-MACH	Machinery	2	Production / plant machinery	t	system	2026-07-30 17:35:21.475441	\N	\N
11	SC-FILE	Digital File	3	Media, documents, digital content	t	system	2026-07-30 17:35:21.475441	\N	\N
12	SC-SUBSCR	Subscription	3	SaaS / recurring subscriptions	t	system	2026-07-30 17:35:21.475441	\N	\N
13	SC-LICENSE	Software License	3	Perpetual / named licenses	t	system	2026-07-30 17:35:21.475441	\N	\N
14	SC-CLEAN	Cleaning Supplies	4	Housekeeping / cleaning materials	t	system	2026-07-30 17:35:21.475441	\N	\N
15	SC-CHEM	Chemicals	4	Chemicals and reagents	t	system	2026-07-30 17:35:21.475441	\N	\N
16	SC-CONSGEN	General Consumable	4	Day-to-day consumable stock	t	system	2026-07-30 17:35:21.475441	\N	\N
17	SC-RAWOTH	Other Raw	5	Other raw inputs	t	system	2026-07-30 17:35:21.475441	\N	\N
18	SC-RAWPLAS	Plastics	5	Plastic raw materials	t	system	2026-07-30 17:35:21.475441	\N	\N
19	SC-RAWMET	Metals	5	Metal raw materials	t	system	2026-07-30 17:35:21.475441	\N	\N
20	SC-FGSEMI	Semi-Finished	6	Semi-finished / WIP goods	t	system	2026-07-30 17:35:21.475441	\N	\N
21	SC-FGSTD	Standard FG	6	Standard finished goods	t	system	2026-07-30 17:35:21.475441	\N	\N
22	SC-SPIT	IT Spares	7	IT spare parts and kits	t	system	2026-07-30 17:35:21.475441	\N	\N
23	SC-SPELEC	Electrical Spares	7	Electrical / electronic spares	t	system	2026-07-30 17:35:21.475441	\N	\N
24	SC-SPMECH	Mechanical Spares	7	Mechanical spare parts	t	system	2026-07-30 17:35:21.475441	\N	\N
25	SC-WRAP	Wrap & Film	8	Stretch wrap, film, tape	t	system	2026-07-30 17:35:21.475441	\N	\N
26	SC-BOX	Boxes & Cartons	8	Corrugated boxes and cartons	t	system	2026-07-30 17:35:21.475441	\N	\N
27	SC-PRINT	Print Supplies	9	Toner, ink, ribbons	t	system	2026-07-30 17:35:21.475441	\N	\N
28	SC-STAT	Stationery	9	Paper, pens, files	t	system	2026-07-30 17:35:21.475441	\N	\N
29	SC-MISC	Miscellaneous	10	Miscellaneous / uncategorized	t	system	2026-07-30 17:35:21.475441	\N	\N
\.


--
-- Data for Name: sysm_menutree_mst; Type: TABLE DATA; Schema: caits_local; Owner: -
--

COPY caits_local.sysm_menutree_mst (mtree_menu_id, mtree_menu_code, mtree_menu_label, mtree_menu_group, mtree_sort_order, mtree_icon, mtree_doc_type, mtree_supports_view, mtree_supports_create, mtree_supports_edit, mtree_supports_delete, mtree_supports_approve, mtree_supports_reject, mtree_supports_print, mtree_supports_export, mtree_is_system_menu, mtree_isactive, mtree_created_by, mtree_created_on, mtree_modified_by, mtree_modified_on, mtree_group_sort_order) FROM stdin;
22	RTN	Material Return	Transactions	47	RTN	MATERIAL_RETURN	t	t	t	t	f	f	t	t	t	t	system	2026-07-29 17:44:43.777631	\N	\N	4
23	DASH	Dashboard	Reports	51	\N	\N	t	f	f	f	f	f	f	t	t	t	system	2026-07-29 17:44:43.777631	\N	\N	5
24	STKREG	Stock Register	Reports	52	\N	\N	t	f	f	f	f	f	f	t	t	t	system	2026-07-29 17:44:43.777631	\N	\N	5
25	FULLRPT	Full Report	Reports	53	\N	\N	t	f	f	f	f	f	f	t	t	t	system	2026-07-29 17:44:43.777631	\N	\N	5
26	STKOWN	Stock Owner Report	Reports	54	STKOWN	\N	t	f	f	f	f	f	f	t	t	t	system	2026-08-04 11:15:53.152464	\N	\N	5
27	STKMOV	Stock Movement Report	Reports	55	STKMOV	\N	t	f	f	f	f	f	f	t	t	t	system	2026-08-04 11:15:53.152464	\N	\N	5
28	ITEMREG	Item Register	Reports	56	ITEMREG	\N	t	f	f	f	f	f	f	t	t	t	system	2026-08-04 11:15:53.152464	\N	\N	5
20	ISS	Store Issue	Transactions	44	ISS	MATERIAL_ISSUE	t	t	t	t	f	f	t	t	t	t	system	2026-07-29 17:44:43.777631	admin	2026-08-04 16:21:46.151007	4
21	TRF	Material Transfer	Transactions	45	TRF	MATERIAL_TRANSFER	t	t	t	t	f	f	t	t	t	t	system	2026-07-29 17:44:43.777631	admin	2026-08-04 16:21:46.151007	4
17	SR	Store Requisitions	Transactions	43	SR	MATERIAL_REQUISITION	t	t	t	t	t	t	t	t	t	t	system	2026-07-29 17:44:43.777631	admin	2026-08-04 16:21:46.151007	4
18	GRN	Goods Receipt Note	Transactions	42	GRN	GRN	t	t	t	t	t	t	t	t	t	t	system	2026-07-29 17:44:43.777631	admin	2026-08-04 16:21:46.151007	4
19	GP	Gatepass	Transactions	46	GP	\N	t	t	t	t	t	f	t	t	t	t	system	2026-07-29 17:44:43.777631	admin	2026-08-04 16:21:46.151007	4
11	ARM	Role & Menu Mapping	Access & People	32	ARM	\N	t	t	t	t	f	f	f	t	t	t	system	2026-07-29 17:44:43.777631	admin	2026-08-05 14:48:37.368633	3
12	EMP	Employee	Access & People	31	EMP	\N	t	t	t	t	f	f	f	t	t	t	system	2026-07-29 17:44:43.777631	admin	2026-08-05 14:48:37.368633	3
29	IAPR	Inspection Approval	Transactions	48	IAPR	INSPECTION_APPROVAL	t	t	t	f	t	f	t	t	t	t	system	2026-08-11 19:06:04.954191	system	2026-08-11 19:06:45.966252	4
31	DEPM	Department	Access & People	36	DEPM	\N	t	t	t	t	f	f	f	t	t	t	system	2026-08-12 18:36:48.498655	\N	\N	3
1	UOM	Unit Master	Master Setup	11	UOM	\N	t	t	t	t	f	f	f	t	t	t	system	2026-07-29 17:44:43.777631	\N	\N	1
2	AIM	Item Master	Master Setup	12	AIM	\N	t	t	t	t	f	f	f	t	t	t	system	2026-07-29 17:44:43.777631	\N	\N	1
3	ICM	Inventory Category	Master Setup	13	ICM	\N	t	t	t	t	f	f	f	t	t	t	system	2026-07-29 17:44:43.777631	\N	\N	1
4	ISC	Inventory Sub-Category	Master Setup	14	ISC	\N	t	t	t	t	f	f	f	t	t	t	system	2026-07-29 17:44:43.777631	\N	\N	1
5	GTY	General Type	Master Setup	15	GTY	\N	t	t	t	t	f	f	f	t	t	t	system	2026-07-29 17:44:43.777631	\N	\N	1
6	GNM	General Master	Master Setup	16	GNM	\N	t	t	t	t	f	f	f	t	t	t	system	2026-07-29 17:44:43.777631	\N	\N	1
7	VPM	Vendor / Party	Master Setup	17	VPM	\N	t	t	t	t	f	f	f	t	t	t	system	2026-07-29 17:44:43.777631	\N	\N	1
8	ORG	Organization (Entity)	Organization	21	ORG	\N	t	t	t	t	f	f	f	t	t	t	system	2026-07-29 17:44:43.777631	\N	\N	2
9	OU	Operating Unit	Organization	22	OU	\N	t	t	t	t	f	f	f	t	t	t	system	2026-07-29 17:44:43.777631	\N	\N	2
10	STR	Location	Organization	23	STR	\N	t	t	t	t	f	f	f	t	t	t	system	2026-07-29 17:44:43.777631	\N	\N	2
13	USR	User Access Mapping	Access & People	33	USR	\N	t	t	t	t	f	f	f	t	t	t	system	2026-07-29 17:44:43.777631	system	2026-07-30 18:47:20.99256	3
14	MNU	Menu Access	Access & People	34	MNU	\N	t	t	t	f	f	f	f	t	t	t	system	2026-07-29 17:44:43.777631	\N	\N	3
15	UAE	User Access Exception	Access & People	35	UAE	\N	t	t	t	t	f	f	f	t	t	t	system	2026-07-29 17:44:43.777631	system	2026-07-30 18:30:49.027189	3
16	OPN	Opening Stock	Transactions	41	OPN	OPENING_STOCK	t	t	t	t	f	f	t	t	t	t	system	2026-07-29 17:44:43.777631	\N	\N	4
\.


--
-- Data for Name: sysm_rolepermission_dtl; Type: TABLE DATA; Schema: caits_local; Owner: -
--

COPY caits_local.sysm_rolepermission_dtl (rlpm_role_permission_id, rlpm_role_id_rol, rlpm_can_view, rlpm_can_create, rlpm_can_edit, rlpm_can_delete, rlpm_can_approve, rlpm_can_reject, rlpm_can_print, rlpm_can_export, rlpm_menu_id_mtree) FROM stdin;
164	1	t	t	t	t	f	f	f	t	1
165	1	t	t	t	t	f	f	f	t	2
166	1	t	t	t	t	f	f	f	t	3
167	1	t	t	t	t	f	f	f	t	4
168	1	t	t	t	t	f	f	f	t	5
169	1	t	t	t	t	f	f	f	t	6
170	1	t	t	t	t	f	f	f	t	7
171	1	t	t	t	t	f	f	f	t	8
172	1	t	t	t	t	f	f	f	t	9
173	1	t	t	t	t	f	f	f	t	10
174	1	t	t	t	t	f	f	f	t	11
175	1	t	t	t	t	f	f	f	t	12
176	1	t	t	t	t	f	f	f	t	13
177	1	t	t	t	t	f	f	f	t	15
178	1	t	t	t	t	f	f	t	t	16
179	1	t	t	t	t	t	t	t	t	18
180	1	t	t	t	t	t	t	t	t	17
181	1	t	t	t	t	f	f	t	t	20
182	1	t	t	t	t	f	f	t	t	21
183	1	t	t	t	t	t	f	t	t	19
184	1	t	t	t	t	f	f	t	t	22
185	1	t	f	f	f	f	f	f	t	23
186	1	t	f	f	f	f	f	f	t	24
187	1	t	f	f	f	f	f	f	t	25
188	1	t	f	f	f	f	f	f	t	26
189	1	t	f	f	f	f	f	f	t	27
190	1	t	f	f	f	f	f	f	t	28
191	1	t	t	t	f	t	f	t	t	29
192	1	t	t	t	t	f	f	f	t	31
193	2	f	f	f	f	f	f	f	f	1
194	2	t	t	t	f	f	f	f	f	2
195	2	f	f	f	f	f	f	f	f	3
196	2	f	f	f	f	f	f	f	f	4
197	2	f	f	f	f	f	f	f	f	5
198	2	f	f	f	f	f	f	f	f	6
199	2	f	f	f	f	f	f	f	f	7
200	2	f	f	f	f	f	f	f	f	8
201	2	f	f	f	f	f	f	f	f	9
202	2	t	t	t	f	f	f	f	f	10
203	2	f	f	f	f	f	f	f	f	12
204	2	f	f	f	f	f	f	f	f	11
205	2	f	f	f	f	f	f	f	f	13
206	2	f	f	f	f	f	f	f	f	15
207	2	f	f	f	f	f	f	f	f	31
208	2	t	t	t	f	f	f	f	f	16
209	2	f	f	f	f	f	f	f	f	18
210	2	t	t	t	f	f	f	f	f	17
211	2	t	t	t	f	f	f	f	f	20
212	2	f	f	f	f	f	f	f	f	21
213	2	t	t	t	f	f	f	f	f	19
214	2	f	f	f	f	f	f	f	f	22
215	2	t	t	t	f	f	f	f	f	29
216	2	t	f	f	f	f	f	f	f	23
217	2	t	f	f	f	f	f	f	f	24
218	2	f	f	f	f	f	f	f	f	25
219	2	f	f	f	f	f	f	f	f	26
220	2	f	f	f	f	f	f	f	f	27
221	2	f	f	f	f	f	f	f	f	28
\.


--
-- Data for Name: sysm_roles_mst; Type: TABLE DATA; Schema: caits_local; Owner: -
--

COPY caits_local.sysm_roles_mst (rol_role_id, rol_role_code, rol_role_name, rol_desc, rol_is_system_role, rol_isactive, rol_created_by, rol_created_on, rol_modified_by, rol_modified_on) FROM stdin;
1	ADMIN	Administrator	System administrator	t	t	system	2026-07-29 15:50:34.424544	admin	2026-08-05 14:48:36.736879
2	STRMGR	Store Manager	Manages the Store	f	t	admin	2026-07-29 18:18:22.360905	admin	2026-08-17 11:38:10.361691
\.


--
-- Data for Name: sysm_user_bu_mapping_dtl; Type: TABLE DATA; Schema: caits_local; Owner: -
--

COPY caits_local.sysm_user_bu_mapping_dtl (uboa_user_bu_access_id, uboa_user_id_usr, uboa_bu_id_bu) FROM stdin;
3	2	1
\.


--
-- Data for Name: sysm_user_favourite_menu_dtl; Type: TABLE DATA; Schema: caits_local; Owner: -
--

COPY caits_local.sysm_user_favourite_menu_dtl (ufav_favourite_id, ufav_user_id_usr, ufav_menu_code_mtree, ufav_sort_order, ufav_created_on) FROM stdin;
\.


--
-- Data for Name: sysm_user_location_mapping_dtl; Type: TABLE DATA; Schema: caits_local; Owner: -
--

COPY caits_local.sysm_user_location_mapping_dtl (uloc_user_loc_access_id, uloc_user_id_usr, uloc_location_id_loc) FROM stdin;
3	2	1
4	2	2
\.


--
-- Data for Name: sysm_useraccess_exception_dtl; Type: TABLE DATA; Schema: caits_local; Owner: -
--

COPY caits_local.sysm_useraccess_exception_dtl (uexc_exception_id, uexc_employee_id_emp, uexc_exception_type, uexc_menu_code_mtree, uexc_reason, uexc_valid_from, uexc_valid_until, uexc_isactive, uexc_created_by, uexc_created_on, uexc_modified_by, uexc_modified_on) FROM stdin;
\.


--
-- Data for Name: sysm_userlogin_mst; Type: TABLE DATA; Schema: caits_local; Owner: -
--

COPY caits_local.sysm_userlogin_mst (usr_user_id, usr_employee_id_emp, usr_login_id, usr_password_hash, usr_role_id_rol, usr_account_status, usr_entity_id_ent, usr_bu_access_scope, usr_location_id_loc, usr_force_password_reset, usr_isactive, usr_last_login_on, usr_last_login_ip, usr_failed_attempts, usr_created_by, usr_created_on, usr_modified_by, usr_modified_on, usr_location_access_scope) FROM stdin;
2	2	sudha.n	$2a$10$Rzz5n3kYrBEAZT4sshxeK.pUcMsNBugXS6DW2dSRS1en7tcXwhWvy	2	Active	2	SELECTED	1	f	t	2026-08-17 14:36:07.576336	\N	0	admin	2026-07-29 18:37:47.483065	admin	2026-08-01 10:24:04.847316	SELECTED
1	1	admin	$2a$10$NHbrcccmhMSXkdAPLM/bsOlG6PuzZgnNEA918GihVtHqmEgiqRr12	1	Active	2	ALL	2	f	t	2026-08-17 15:50:54.839376	\N	0	system	2026-07-29 15:50:34.424544	admin	2026-08-07 11:13:07.811204	ALL
\.


--
-- Data for Name: txn_detail_dtl; Type: TABLE DATA; Schema: caits_local; Owner: -
--

COPY caits_local.txn_detail_dtl (txd_txn_detail_id, txd_txn_header_id_txh, txd_doc_type, txd_sr_no, txd_item_id_itm, txd_uom_id_unt, txd_unit, txd_ordered_qty, txd_received_qty, txd_accepted_qty, txd_rejected_qty, txd_requested_qty, txd_qty, txd_available_stock, txd_amount, txd_rate, txd_mrp, txd_batch_lot_no, txd_mfg_date, txd_expiry_date, txd_location_id_loc, txd_location_bin, txd_item_condition, txd_remark, txd_serial_no, txd_ip_address, txd_mac_address, txd_hostname, txd_bls_id_ibm, txd_issued_to_emp_id_emp) FROM stdin;
116	68	GRN	1	174	3	\N	\N	1.000	1.000	0.000	\N	1.000	0.000	30000.00	\N	\N	\N	\N	\N	1	\N	In Stock	\N	R9NXCV14F72238B	192.168.0.245	\N	\N	49	\N
117	68	GRN	2	174	3	\N	\N	1.000	1.000	0.000	\N	1.000	0.000	30000.00	\N	\N	\N	\N	\N	1	\N	In Stock	\N	R9NXCV14F71838F	192.168.0.247	\N	\N	50	\N
118	68	GRN	3	174	3	\N	\N	1.000	1.000	0.000	\N	1.000	0.000	30000.00	\N	\N	\N	\N	\N	1	\N	In Stock	\N	R9NXCV14F67138E	192.168.0.244	\N	\N	51	\N
119	68	GRN	4	174	3	\N	\N	1.000	1.000	0.000	\N	1.000	0.000	30000.00	\N	\N	\N	\N	\N	1	\N	In Stock	\N	R9NXCV14F596388	192.168.0.248	\N	\N	52	\N
120	68	GRN	5	174	3	\N	\N	1.000	0.000	1.000	\N	0.000	0.000	30000.00	\N	\N	\N	\N	\N	1	\N	Dead	\N	R9NXCV14F66638B	\N	\N	\N	53	\N
126	69	INSPECTION_APPROVAL	1	174	3	\N	\N	\N	\N	\N	\N	1.000	\N	\N	\N	\N	R9NXCV14F72238B	\N	\N	1	\N	\N	\N	R9NXCV14F72238B	\N	\N	\N	49	\N
127	69	INSPECTION_APPROVAL	2	174	3	\N	\N	\N	\N	\N	\N	1.000	\N	\N	\N	\N	R9NXCV14F71838F	\N	\N	1	\N	\N	\N	R9NXCV14F71838F	\N	\N	\N	50	\N
128	69	INSPECTION_APPROVAL	3	174	3	\N	\N	\N	\N	\N	\N	1.000	\N	\N	\N	\N	R9NXCV14F67138E	\N	\N	1	\N	\N	\N	R9NXCV14F67138E	\N	\N	\N	51	\N
129	69	INSPECTION_APPROVAL	4	174	3	\N	\N	\N	\N	\N	\N	1.000	\N	\N	\N	\N	R9NXCV14F596388	\N	\N	1	\N	\N	\N	R9NXCV14F596388	\N	\N	\N	52	\N
130	70	MATERIAL_REQUISITION	1	174	3	\N	\N	\N	\N	\N	1.000	1.000	0.000	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	54	\N
131	71	MATERIAL_ISSUE	1	174	3	\N	\N	\N	\N	\N	1.000	1.000	4.000	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	54	\N
132	72	MATERIAL_REQUISITION	1	174	3	\N	\N	\N	\N	\N	1.000	1.000	3.000	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	54	\N
133	73	MATERIAL_ISSUE	1	174	3	\N	\N	\N	\N	\N	1.000	1.000	3.000	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	54	\N
\.


--
-- Data for Name: txn_header_mst; Type: TABLE DATA; Schema: caits_local; Owner: -
--

COPY caits_local.txn_header_mst (txh_txn_header_id, txh_doc_type, txh_doc_no, txh_doc_date, txh_posting_date, txh_required_by_date, txh_entity_id_ent, txh_location_id_loc, txh_from_location_id_loc, txh_to_location_id_loc, txh_party_id_vnd, txh_party_add, txh_party_contact_person, txh_party_phone, txh_party_gstin, txh_ship_to, txh_initiated_by_emp_id_emp, txh_employee_ref_code, txh_designation, txh_doc_subtype, txh_return_flag, txh_ref_txn_header_id_txh, txh_reference_no, txh_invoice_no, txh_invoice_date, txh_po_no, txh_po_date, txh_purpose, txh_attachment_url, txh_inspected_by_emp_id_emp, txh_inspection_date, txh_handed_over_to_emp_id_emp, txh_handover_designation, txh_handover_date, txh_received_by_emp_id_emp, txh_received_by_name, txh_received_designation, txh_received_date, txh_condition_on_return, txh_total_ordered_qty, txh_total_received_qty, txh_total_accepted_qty, txh_total_rejected_qty, txh_total_pending_qty, txh_total_amount, txh_prepared_date, txh_approved_by_emp_id_emp, txh_approved_date, txh_footer_remark, txh_remarks, txh_status, txh_created_by, txh_created_on, txh_modified_by, txh_modified_on, txh_prepared_by_emp_id_emp, txh_department_id_dept) FROM stdin;
68	GRN	GRN-2026-0001	2026-08-17	2026-08-17	\N	2	1	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	INV-17-001	2026-08-17	\N	\N	\N	\N	2	2026-08-17	\N	\N	\N	\N	\N	\N	\N	\N	\N	5.000	4.000	1.000	\N	150000.00	2026-08-17	\N	\N	\N	Laptops for new joinny	Completed	admin	2026-08-17 18:19:08.133629	\N	\N	1	\N
69	INSPECTION_APPROVAL	INSP-2026-0001	2026-08-17	2026-08-17	\N	2	9	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	68	GRN-2026-0001	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	2026-08-17	\N	Pending inspection for GRN GRN-2026-0001	Approved	admin	2026-08-17 18:19:09.774545	admin	2026-08-17 18:20:45.410192	\N	\N
71	MATERIAL_ISSUE	STIS-2026-0001	2026-08-17	2026-08-17	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	70	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Issued	admin	2026-08-17 18:21:16.825323	\N	\N	\N	\N
70	MATERIAL_REQUISITION	STRQ-2026-0001	2026-08-17	\N	2026-08-17	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	2	EMP00	Store Manager	EMPLOYEE	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Issued	admin	2026-08-17 18:20:21.95662	admin	2026-08-17 18:21:17.453266	\N	\N
73	MATERIAL_ISSUE	STIS-2026-0002	2026-08-17	2026-08-17	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	72	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Issued	admin	2026-08-17 18:46:29.375843	\N	\N	\N	\N
72	MATERIAL_REQUISITION	STRQ-2026-0002	2026-08-17	\N	2026-08-18	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	1	ADMIN	System Administrator	EMPLOYEE	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Issued	admin	2026-08-17 18:45:55.81058	admin	2026-08-17 18:46:29.498046	\N	1
\.


--
-- Data for Name: unit_mst; Type: TABLE DATA; Schema: caits_local; Owner: -
--

COPY caits_local.unit_mst (unt_unit_id, unt_unit_code, unt_unit_name, unt_desc, unt_isactive, unt_created_by, unt_created_on, unt_modified_by, unt_modified_on) FROM stdin;
1	PCS	Pieces	An individual countable unit	t	admin	2026-07-29 16:56:32.601066	\N	\N
3	NOS	Numbers	Individual physical IT assets and fixed property (e.g. Laptops, Desktops, Monitors, Servers, Switches, Office Chairs). GST: NOS	t	system	2026-08-05 15:17:13.615403	\N	\N
4	RM	Reams	Office printing consumables (e.g. A4 Copier Paper, Legal Bond Paper, Presentation Sheets). GST: OTH	t	system	2026-08-05 15:17:13.615403	\N	\N
5	BOX	Boxes	Packaged administrative and technical consumables (e.g. Markers, Sticky Notes, RJ45 Connectors, Tissue Boxes). GST: BOX	t	system	2026-08-05 15:17:13.615403	\N	\N
6	SET	Sets	Combined multi-piece asset assemblies (e.g. Video Conferencing Systems, Desktop Combo Packs, Rack Mounting Kits). GST: SET	t	system	2026-08-05 15:17:13.615403	\N	\N
7	MTR	Meters	Network cabling and infrastructure materials (e.g. CAT6 Ethernet, Fiber patches, Power cables, Grounding wire). GST: MTR	t	system	2026-08-05 15:17:13.615403	\N	\N
8	ROL	Rolls	Continuous structural consumables (e.g. Velcro cable wraps, Duct tapes, Label printer rolls). GST: ROL	t	system	2026-08-05 15:17:13.615403	\N	\N
9	PAC	Packs	Pantry, housekeeping, and event consumables (e.g. Coffee beans, Tea bags, ID lanyards, Sanitizer packets). GST: PAC	t	system	2026-08-05 15:17:13.615403	\N	\N
10	BTL	Bottles	Liquid maintenance and pantry consumables (e.g. IPA spray, Screen cleaners, Hand sanitizers, Disinfectants). GST: BTL	t	system	2026-08-05 15:17:13.615403	\N	\N
11	LIC	Licenses	Intangible software assets and allocations (e.g. Microsoft 365 seats, Adobe CC, GitHub Enterprise). GST: OTH	t	system	2026-08-05 15:17:13.615403	\N	\N
12	CORE	Cores	Cloud computing virtual assets (e.g. AWS/Azure VMs, SQL Database core allocations). GST: OTH	t	system	2026-08-05 15:17:13.615403	\N	\N
13	KG	Kilograms	Heavy-duty cleaning powders, waste management disposal tracking, or landscaping raw items	t	system	2026-08-05 15:17:13.615403	\N	\N
14	LTR	Litres	Bulk cleaning chemicals, water dispenser bottles, liquid sanitizers, or generator diesel stock	t	system	2026-08-05 15:17:13.615403	\N	\N
15	PAIR	Pairs	Physical corporate health and safety gear (e.g. technician safety gloves, server room ESD anti-static shoes)	t	system	2026-08-05 15:17:13.615403	\N	\N
16	CAN	Cans	Compressed air dusters for server cabinets, insect sprays, or generic maintenance aerosols	t	system	2026-08-05 15:17:13.615403	\N	\N
\.


--
-- Name: category_mst_cat_category_id_seq; Type: SEQUENCE SET; Schema: caits_local; Owner: -
--

SELECT pg_catalog.setval('caits_local.category_mst_cat_category_id_seq', 11, true);


--
-- Name: genmaster_mst_gmst_genmaster_id_seq; Type: SEQUENCE SET; Schema: caits_local; Owner: -
--

SELECT pg_catalog.setval('caits_local.genmaster_mst_gmst_genmaster_id_seq', 149, true);


--
-- Name: gentype_mst_gtyp_gentype_id_seq; Type: SEQUENCE SET; Schema: caits_local; Owner: -
--

SELECT pg_catalog.setval('caits_local.gentype_mst_gtyp_gentype_id_seq', 27, true);


--
-- Name: hrc_department_mst_dept_department_id_seq; Type: SEQUENCE SET; Schema: caits_local; Owner: -
--

SELECT pg_catalog.setval('caits_local.hrc_department_mst_dept_department_id_seq', 8, true);


--
-- Name: hrc_employee_mst_emp_employee_id_seq; Type: SEQUENCE SET; Schema: caits_local; Owner: -
--

SELECT pg_catalog.setval('caits_local.hrc_employee_mst_emp_employee_id_seq', 2, true);


--
-- Name: inv_bls_mst_ibm_bls_id_seq; Type: SEQUENCE SET; Schema: caits_local; Owner: -
--

SELECT pg_catalog.setval('caits_local.inv_bls_mst_ibm_bls_id_seq', 54, true);


--
-- Name: inv_item_mst_itm_item_id_seq; Type: SEQUENCE SET; Schema: caits_local; Owner: -
--

SELECT pg_catalog.setval('caits_local.inv_item_mst_itm_item_id_seq', 184, true);


--
-- Name: inv_stock_mst_stk_stock_id_seq; Type: SEQUENCE SET; Schema: caits_local; Owner: -
--

SELECT pg_catalog.setval('caits_local.inv_stock_mst_stk_stock_id_seq', 60, true);


--
-- Name: inv_vendor_mst_vnd_vendor_id_seq; Type: SEQUENCE SET; Schema: caits_local; Owner: -
--

SELECT pg_catalog.setval('caits_local.inv_vendor_mst_vnd_vendor_id_seq', 2, true);


--
-- Name: org_businessunit_mst_bu_bu_id_seq; Type: SEQUENCE SET; Schema: caits_local; Owner: -
--

SELECT pg_catalog.setval('caits_local.org_businessunit_mst_bu_bu_id_seq', 4, true);


--
-- Name: org_entity_mst_ent_entity_id_seq; Type: SEQUENCE SET; Schema: caits_local; Owner: -
--

SELECT pg_catalog.setval('caits_local.org_entity_mst_ent_entity_id_seq', 4, true);


--
-- Name: org_location_mst_loc_location_id_seq; Type: SEQUENCE SET; Schema: caits_local; Owner: -
--

SELECT pg_catalog.setval('caits_local.org_location_mst_loc_location_id_seq', 27, true);


--
-- Name: subcategory_mst_scat_subcategory_id_seq; Type: SEQUENCE SET; Schema: caits_local; Owner: -
--

SELECT pg_catalog.setval('caits_local.subcategory_mst_scat_subcategory_id_seq', 30, true);


--
-- Name: sysm_menutree_mst_mtree_menu_id_seq; Type: SEQUENCE SET; Schema: caits_local; Owner: -
--

SELECT pg_catalog.setval('caits_local.sysm_menutree_mst_mtree_menu_id_seq', 31, true);


--
-- Name: sysm_rolepermission_dtl_rlpm_role_permission_id_seq; Type: SEQUENCE SET; Schema: caits_local; Owner: -
--

SELECT pg_catalog.setval('caits_local.sysm_rolepermission_dtl_rlpm_role_permission_id_seq', 221, true);


--
-- Name: sysm_roles_mst_rol_role_id_seq; Type: SEQUENCE SET; Schema: caits_local; Owner: -
--

SELECT pg_catalog.setval('caits_local.sysm_roles_mst_rol_role_id_seq', 2, true);


--
-- Name: sysm_user_bu_mapping_dtl_uboa_user_bu_access_id_seq; Type: SEQUENCE SET; Schema: caits_local; Owner: -
--

SELECT pg_catalog.setval('caits_local.sysm_user_bu_mapping_dtl_uboa_user_bu_access_id_seq', 3, true);


--
-- Name: sysm_user_favourite_menu_dtl_ufav_favourite_id_seq; Type: SEQUENCE SET; Schema: caits_local; Owner: -
--

SELECT pg_catalog.setval('caits_local.sysm_user_favourite_menu_dtl_ufav_favourite_id_seq', 10, true);


--
-- Name: sysm_user_location_mapping_dtl_uloc_user_loc_access_id_seq; Type: SEQUENCE SET; Schema: caits_local; Owner: -
--

SELECT pg_catalog.setval('caits_local.sysm_user_location_mapping_dtl_uloc_user_loc_access_id_seq', 4, true);


--
-- Name: sysm_useraccess_exception_dtl_uexc_exception_id_seq; Type: SEQUENCE SET; Schema: caits_local; Owner: -
--

SELECT pg_catalog.setval('caits_local.sysm_useraccess_exception_dtl_uexc_exception_id_seq', 1, false);


--
-- Name: sysm_userlogin_mst_usr_user_id_seq; Type: SEQUENCE SET; Schema: caits_local; Owner: -
--

SELECT pg_catalog.setval('caits_local.sysm_userlogin_mst_usr_user_id_seq', 2, true);


--
-- Name: txn_detail_dtl_txd_txn_detail_id_seq; Type: SEQUENCE SET; Schema: caits_local; Owner: -
--

SELECT pg_catalog.setval('caits_local.txn_detail_dtl_txd_txn_detail_id_seq', 133, true);


--
-- Name: txn_header_mst_txh_txn_header_id_seq; Type: SEQUENCE SET; Schema: caits_local; Owner: -
--

SELECT pg_catalog.setval('caits_local.txn_header_mst_txh_txn_header_id_seq', 73, true);


--
-- Name: unit_mst_unt_unit_id_seq; Type: SEQUENCE SET; Schema: caits_local; Owner: -
--

SELECT pg_catalog.setval('caits_local.unit_mst_unt_unit_id_seq', 16, true);


--
-- Name: category_mst category_mst_cat_category_code_key; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.category_mst
    ADD CONSTRAINT category_mst_cat_category_code_key UNIQUE (cat_category_code);


--
-- Name: category_mst category_mst_pkey; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.category_mst
    ADD CONSTRAINT category_mst_pkey PRIMARY KEY (cat_category_id);


--
-- Name: genmaster_mst genmaster_mst_gmst_value_code_key; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.genmaster_mst
    ADD CONSTRAINT genmaster_mst_gmst_value_code_key UNIQUE (gmst_value_code);


--
-- Name: genmaster_mst genmaster_mst_pkey; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.genmaster_mst
    ADD CONSTRAINT genmaster_mst_pkey PRIMARY KEY (gmst_genmaster_id);


--
-- Name: gentype_mst gentype_mst_gtyp_type_code_key; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.gentype_mst
    ADD CONSTRAINT gentype_mst_gtyp_type_code_key UNIQUE (gtyp_type_code);


--
-- Name: gentype_mst gentype_mst_pkey; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.gentype_mst
    ADD CONSTRAINT gentype_mst_pkey PRIMARY KEY (gtyp_gentype_id);


--
-- Name: hrc_department_mst hrc_department_mst_pkey; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.hrc_department_mst
    ADD CONSTRAINT hrc_department_mst_pkey PRIMARY KEY (dept_department_id);


--
-- Name: hrc_employee_mst hrc_employee_mst_emp_email_key; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.hrc_employee_mst
    ADD CONSTRAINT hrc_employee_mst_emp_email_key UNIQUE (emp_email);


--
-- Name: hrc_employee_mst hrc_employee_mst_emp_employee_code_key; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.hrc_employee_mst
    ADD CONSTRAINT hrc_employee_mst_emp_employee_code_key UNIQUE (emp_employee_code);


--
-- Name: hrc_employee_mst hrc_employee_mst_pkey; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.hrc_employee_mst
    ADD CONSTRAINT hrc_employee_mst_pkey PRIMARY KEY (emp_employee_id);


--
-- Name: inv_bls_mst inv_bls_mst_pkey; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.inv_bls_mst
    ADD CONSTRAINT inv_bls_mst_pkey PRIMARY KEY (ibm_bls_id);


--
-- Name: inv_item_mst inv_item_mst_itm_item_code_key; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.inv_item_mst
    ADD CONSTRAINT inv_item_mst_itm_item_code_key UNIQUE (itm_item_code);


--
-- Name: inv_item_mst inv_item_mst_pkey; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.inv_item_mst
    ADD CONSTRAINT inv_item_mst_pkey PRIMARY KEY (itm_item_id);


--
-- Name: inv_stock_mst inv_stock_mst_pkey; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.inv_stock_mst
    ADD CONSTRAINT inv_stock_mst_pkey PRIMARY KEY (stk_stock_id);


--
-- Name: inv_vendor_mst inv_vendor_mst_pkey; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.inv_vendor_mst
    ADD CONSTRAINT inv_vendor_mst_pkey PRIMARY KEY (vnd_vendor_id);


--
-- Name: inv_vendor_mst inv_vendor_mst_vnd_vendor_code_key; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.inv_vendor_mst
    ADD CONSTRAINT inv_vendor_mst_vnd_vendor_code_key UNIQUE (vnd_vendor_code);


--
-- Name: org_businessunit_mst org_businessunit_mst_bu_bu_code_key; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.org_businessunit_mst
    ADD CONSTRAINT org_businessunit_mst_bu_bu_code_key UNIQUE (bu_bu_code);


--
-- Name: org_businessunit_mst org_businessunit_mst_pkey; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.org_businessunit_mst
    ADD CONSTRAINT org_businessunit_mst_pkey PRIMARY KEY (bu_bu_id);


--
-- Name: org_entity_mst org_entity_mst_ent_entity_code_key; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.org_entity_mst
    ADD CONSTRAINT org_entity_mst_ent_entity_code_key UNIQUE (ent_entity_code);


--
-- Name: org_entity_mst org_entity_mst_pkey; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.org_entity_mst
    ADD CONSTRAINT org_entity_mst_pkey PRIMARY KEY (ent_entity_id);


--
-- Name: org_location_mst org_location_mst_loc_location_code_key; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.org_location_mst
    ADD CONSTRAINT org_location_mst_loc_location_code_key UNIQUE (loc_location_code);


--
-- Name: org_location_mst org_location_mst_pkey; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.org_location_mst
    ADD CONSTRAINT org_location_mst_pkey PRIMARY KEY (loc_location_id);


--
-- Name: subcategory_mst subcategory_mst_pkey; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.subcategory_mst
    ADD CONSTRAINT subcategory_mst_pkey PRIMARY KEY (scat_subcategory_id);


--
-- Name: subcategory_mst subcategory_mst_scat_subcategory_code_key; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.subcategory_mst
    ADD CONSTRAINT subcategory_mst_scat_subcategory_code_key UNIQUE (scat_subcategory_code);


--
-- Name: sysm_menutree_mst sysm_menutree_mst_mtree_menu_code_key; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_menutree_mst
    ADD CONSTRAINT sysm_menutree_mst_mtree_menu_code_key UNIQUE (mtree_menu_code);


--
-- Name: sysm_menutree_mst sysm_menutree_mst_pkey; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_menutree_mst
    ADD CONSTRAINT sysm_menutree_mst_pkey PRIMARY KEY (mtree_menu_id);


--
-- Name: sysm_rolepermission_dtl sysm_rolepermission_dtl_pkey; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_rolepermission_dtl
    ADD CONSTRAINT sysm_rolepermission_dtl_pkey PRIMARY KEY (rlpm_role_permission_id);


--
-- Name: sysm_roles_mst sysm_roles_mst_pkey; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_roles_mst
    ADD CONSTRAINT sysm_roles_mst_pkey PRIMARY KEY (rol_role_id);


--
-- Name: sysm_roles_mst sysm_roles_mst_rol_role_code_key; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_roles_mst
    ADD CONSTRAINT sysm_roles_mst_rol_role_code_key UNIQUE (rol_role_code);


--
-- Name: sysm_user_bu_mapping_dtl sysm_user_bu_mapping_dtl_pkey; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_user_bu_mapping_dtl
    ADD CONSTRAINT sysm_user_bu_mapping_dtl_pkey PRIMARY KEY (uboa_user_bu_access_id);


--
-- Name: sysm_user_favourite_menu_dtl sysm_user_favourite_menu_dtl_pkey; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_user_favourite_menu_dtl
    ADD CONSTRAINT sysm_user_favourite_menu_dtl_pkey PRIMARY KEY (ufav_favourite_id);


--
-- Name: sysm_user_location_mapping_dtl sysm_user_location_mapping_dtl_pkey; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_user_location_mapping_dtl
    ADD CONSTRAINT sysm_user_location_mapping_dtl_pkey PRIMARY KEY (uloc_user_loc_access_id);


--
-- Name: sysm_useraccess_exception_dtl sysm_useraccess_exception_dtl_pkey; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_useraccess_exception_dtl
    ADD CONSTRAINT sysm_useraccess_exception_dtl_pkey PRIMARY KEY (uexc_exception_id);


--
-- Name: sysm_userlogin_mst sysm_userlogin_mst_pkey; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_userlogin_mst
    ADD CONSTRAINT sysm_userlogin_mst_pkey PRIMARY KEY (usr_user_id);


--
-- Name: sysm_userlogin_mst sysm_userlogin_mst_usr_login_id_key; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_userlogin_mst
    ADD CONSTRAINT sysm_userlogin_mst_usr_login_id_key UNIQUE (usr_login_id);


--
-- Name: txn_detail_dtl txn_detail_dtl_pkey; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.txn_detail_dtl
    ADD CONSTRAINT txn_detail_dtl_pkey PRIMARY KEY (txd_txn_detail_id);


--
-- Name: txn_header_mst txn_header_mst_pkey; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.txn_header_mst
    ADD CONSTRAINT txn_header_mst_pkey PRIMARY KEY (txh_txn_header_id);


--
-- Name: unit_mst unit_mst_pkey; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.unit_mst
    ADD CONSTRAINT unit_mst_pkey PRIMARY KEY (unt_unit_id);


--
-- Name: unit_mst unit_mst_unt_unit_code_key; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.unit_mst
    ADD CONSTRAINT unit_mst_unt_unit_code_key UNIQUE (unt_unit_code);


--
-- Name: hrc_department_mst uq_dept_code; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.hrc_department_mst
    ADD CONSTRAINT uq_dept_code UNIQUE (dept_department_code);


--
-- Name: txn_header_mst uq_txn_header_mst_txh_doc_type_txh_doc_no; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.txn_header_mst
    ADD CONSTRAINT uq_txn_header_mst_txh_doc_type_txh_doc_no UNIQUE (txh_doc_type, txh_doc_no);


--
-- Name: sysm_user_favourite_menu_dtl uq_user_favourite_menu; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_user_favourite_menu_dtl
    ADD CONSTRAINT uq_user_favourite_menu UNIQUE (ufav_user_id_usr, ufav_menu_code_mtree);


--
-- Name: sysm_user_location_mapping_dtl uq_user_location; Type: CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_user_location_mapping_dtl
    ADD CONSTRAINT uq_user_location UNIQUE (uloc_user_id_usr, uloc_location_id_loc);


--
-- Name: ix_bls_item; Type: INDEX; Schema: caits_local; Owner: -
--

CREATE INDEX ix_bls_item ON caits_local.inv_bls_mst USING btree (ibm_item_id_itm);


--
-- Name: ix_bls_location; Type: INDEX; Schema: caits_local; Owner: -
--

CREATE INDEX ix_bls_location ON caits_local.inv_bls_mst USING btree (ibm_current_location_id_loc);


--
-- Name: ix_employee_email_lower; Type: INDEX; Schema: caits_local; Owner: -
--

CREATE INDEX ix_employee_email_lower ON caits_local.hrc_employee_mst USING btree (lower((emp_email)::text));


--
-- Name: ix_inv_bls_issued_to; Type: INDEX; Schema: caits_local; Owner: -
--

CREATE INDEX ix_inv_bls_issued_to ON caits_local.inv_bls_mst USING btree (ibm_issued_to_emp_id_emp) WHERE (ibm_issued_to_emp_id_emp IS NOT NULL);


--
-- Name: ix_item_code_lower; Type: INDEX; Schema: caits_local; Owner: -
--

CREATE INDEX ix_item_code_lower ON caits_local.inv_item_mst USING btree (lower((itm_item_code)::text));


--
-- Name: ix_item_parent; Type: INDEX; Schema: caits_local; Owner: -
--

CREATE INDEX ix_item_parent ON caits_local.inv_item_mst USING btree (itm_parent_item_id_itm);


--
-- Name: ix_txn_detail_bls; Type: INDEX; Schema: caits_local; Owner: -
--

CREATE INDEX ix_txn_detail_bls ON caits_local.txn_detail_dtl USING btree (txd_bls_id_ibm);


--
-- Name: ix_txn_detail_issued_to; Type: INDEX; Schema: caits_local; Owner: -
--

CREATE INDEX ix_txn_detail_issued_to ON caits_local.txn_detail_dtl USING btree (txd_issued_to_emp_id_emp) WHERE (txd_issued_to_emp_id_emp IS NOT NULL);


--
-- Name: ix_txn_detail_serial_lower; Type: INDEX; Schema: caits_local; Owner: -
--

CREATE INDEX ix_txn_detail_serial_lower ON caits_local.txn_detail_dtl USING btree (lower(btrim((txd_serial_no)::text))) WHERE ((txd_serial_no IS NOT NULL) AND (btrim((txd_serial_no)::text) <> ''::text));


--
-- Name: ix_uloc_user; Type: INDEX; Schema: caits_local; Owner: -
--

CREATE INDEX ix_uloc_user ON caits_local.sysm_user_location_mapping_dtl USING btree (uloc_user_id_usr);


--
-- Name: ix_user_favourite_user; Type: INDEX; Schema: caits_local; Owner: -
--

CREATE INDEX ix_user_favourite_user ON caits_local.sysm_user_favourite_menu_dtl USING btree (ufav_user_id_usr, ufav_sort_order);


--
-- Name: uq_access_exception; Type: INDEX; Schema: caits_local; Owner: -
--

CREATE UNIQUE INDEX uq_access_exception ON caits_local.sysm_useraccess_exception_dtl USING btree (uexc_employee_id_emp, lower((uexc_menu_code_mtree)::text), lower((uexc_exception_type)::text));


--
-- Name: uq_bls_dummy_per_item; Type: INDEX; Schema: caits_local; Owner: -
--

CREATE UNIQUE INDEX uq_bls_dummy_per_item ON caits_local.inv_bls_mst USING btree (ibm_item_id_itm) WHERE ((ibm_is_dummy = true) AND (ibm_isactive = true));


--
-- Name: uq_bls_item_batch; Type: INDEX; Schema: caits_local; Owner: -
--

CREATE UNIQUE INDEX uq_bls_item_batch ON caits_local.inv_bls_mst USING btree (ibm_item_id_itm, lower(btrim((ibm_batch_no)::text))) WHERE ((ibm_batch_no IS NOT NULL) AND (btrim((ibm_batch_no)::text) <> ''::text) AND ((ibm_serial_no IS NULL) OR (btrim((ibm_serial_no)::text) = ''::text)) AND (ibm_is_dummy = false) AND (ibm_isactive = true));


--
-- Name: uq_bls_serial_no; Type: INDEX; Schema: caits_local; Owner: -
--

CREATE UNIQUE INDEX uq_bls_serial_no ON caits_local.inv_bls_mst USING btree (lower(btrim((ibm_serial_no)::text))) WHERE ((ibm_serial_no IS NOT NULL) AND (btrim((ibm_serial_no)::text) <> ''::text) AND (ibm_isactive = true));


--
-- Name: uq_rlpm_role_menu; Type: INDEX; Schema: caits_local; Owner: -
--

CREATE UNIQUE INDEX uq_rlpm_role_menu ON caits_local.sysm_rolepermission_dtl USING btree (rlpm_role_id_rol, rlpm_menu_id_mtree);


--
-- Name: hrc_department_mst fk_dept_entity; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.hrc_department_mst
    ADD CONSTRAINT fk_dept_entity FOREIGN KEY (dept_entity_id_ent) REFERENCES caits_local.org_entity_mst(ent_entity_id);


--
-- Name: hrc_department_mst fk_dept_head_emp; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.hrc_department_mst
    ADD CONSTRAINT fk_dept_head_emp FOREIGN KEY (dept_head_emp_id_emp) REFERENCES caits_local.hrc_employee_mst(emp_employee_id);


--
-- Name: hrc_employee_mst fk_emp_department_dept; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.hrc_employee_mst
    ADD CONSTRAINT fk_emp_department_dept FOREIGN KEY (emp_department_id_dept) REFERENCES caits_local.hrc_department_mst(dept_department_id);


--
-- Name: genmaster_mst fk_genmaster_mst_gmst_gentype_id_gtyp_gentype_mst_g_aef4b84f; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.genmaster_mst
    ADD CONSTRAINT fk_genmaster_mst_gmst_gentype_id_gtyp_gentype_mst_g_aef4b84f FOREIGN KEY (gmst_gentype_id_gtyp) REFERENCES caits_local.gentype_mst(gtyp_gentype_id);


--
-- Name: hrc_employee_mst fk_hrc_employee_mst_emp_base_location_id_loc_org_lo_bc850ca1; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.hrc_employee_mst
    ADD CONSTRAINT fk_hrc_employee_mst_emp_base_location_id_loc_org_lo_bc850ca1 FOREIGN KEY (emp_base_location_id_loc) REFERENCES caits_local.org_location_mst(loc_location_id);


--
-- Name: hrc_employee_mst fk_hrc_employee_mst_emp_reporting_to_emp_id_emp_hrc_97372481; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.hrc_employee_mst
    ADD CONSTRAINT fk_hrc_employee_mst_emp_reporting_to_emp_id_emp_hrc_97372481 FOREIGN KEY (emp_reporting_to_emp_id_emp) REFERENCES caits_local.hrc_employee_mst(emp_employee_id);


--
-- Name: hrc_employee_mst fk_hrc_employee_mst_emp_role_id_rol_sysm_roles_mst__6430f9b7; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.hrc_employee_mst
    ADD CONSTRAINT fk_hrc_employee_mst_emp_role_id_rol_sysm_roles_mst__6430f9b7 FOREIGN KEY (emp_role_id_rol) REFERENCES caits_local.sysm_roles_mst(rol_role_id);


--
-- Name: inv_bls_mst fk_inv_bls_mst_ibm_issued_to_emp_id_emp; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.inv_bls_mst
    ADD CONSTRAINT fk_inv_bls_mst_ibm_issued_to_emp_id_emp FOREIGN KEY (ibm_issued_to_emp_id_emp) REFERENCES caits_local.hrc_employee_mst(emp_employee_id);


--
-- Name: inv_item_mst fk_inv_item_mst_itm_category_id_cat_category_mst_ca_2fa999ed; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.inv_item_mst
    ADD CONSTRAINT fk_inv_item_mst_itm_category_id_cat_category_mst_ca_2fa999ed FOREIGN KEY (itm_category_id_cat) REFERENCES caits_local.category_mst(cat_category_id);


--
-- Name: inv_item_mst fk_inv_item_mst_itm_current_location_id_loc_org_loc_cf8e0bec; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.inv_item_mst
    ADD CONSTRAINT fk_inv_item_mst_itm_current_location_id_loc_org_loc_cf8e0bec FOREIGN KEY (itm_current_location_id_loc) REFERENCES caits_local.org_location_mst(loc_location_id);


--
-- Name: inv_item_mst fk_inv_item_mst_itm_subcategory_id_scat_subcategory_99d309d6; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.inv_item_mst
    ADD CONSTRAINT fk_inv_item_mst_itm_subcategory_id_scat_subcategory_99d309d6 FOREIGN KEY (itm_subcategory_id_scat) REFERENCES caits_local.subcategory_mst(scat_subcategory_id);


--
-- Name: inv_item_mst fk_inv_item_mst_itm_uom_id_unt_unit_mst_unt_unit_id; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.inv_item_mst
    ADD CONSTRAINT fk_inv_item_mst_itm_uom_id_unt_unit_mst_unt_unit_id FOREIGN KEY (itm_uom_id_unt) REFERENCES caits_local.unit_mst(unt_unit_id);


--
-- Name: inv_stock_mst fk_inv_stock_mst_stk_item_id_itm_inv_item_mst_itm_item_id; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.inv_stock_mst
    ADD CONSTRAINT fk_inv_stock_mst_stk_item_id_itm_inv_item_mst_itm_item_id FOREIGN KEY (stk_item_id_itm) REFERENCES caits_local.inv_item_mst(itm_item_id);


--
-- Name: inv_stock_mst fk_inv_stock_mst_stk_last_txn_header_id_txh_txn_hea_256f23e9; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.inv_stock_mst
    ADD CONSTRAINT fk_inv_stock_mst_stk_last_txn_header_id_txh_txn_hea_256f23e9 FOREIGN KEY (stk_last_txn_header_id_txh) REFERENCES caits_local.txn_header_mst(txh_txn_header_id);


--
-- Name: inv_stock_mst fk_inv_stock_mst_stk_location_id_loc_org_location_m_81f5aaa8; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.inv_stock_mst
    ADD CONSTRAINT fk_inv_stock_mst_stk_location_id_loc_org_location_m_81f5aaa8 FOREIGN KEY (stk_location_id_loc) REFERENCES caits_local.org_location_mst(loc_location_id);


--
-- Name: inv_stock_mst fk_inv_stock_mst_stk_uom_id_unt_unit_mst_unt_unit_id; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.inv_stock_mst
    ADD CONSTRAINT fk_inv_stock_mst_stk_uom_id_unt_unit_mst_unt_unit_id FOREIGN KEY (stk_uom_id_unt) REFERENCES caits_local.unit_mst(unt_unit_id);


--
-- Name: inv_item_mst fk_item_parent_item; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.inv_item_mst
    ADD CONSTRAINT fk_item_parent_item FOREIGN KEY (itm_parent_item_id_itm) REFERENCES caits_local.inv_item_mst(itm_item_id);


--
-- Name: org_businessunit_mst fk_org_businessunit_mst_bu_entity_id_ent_org_entity_0069ae61; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.org_businessunit_mst
    ADD CONSTRAINT fk_org_businessunit_mst_bu_entity_id_ent_org_entity_0069ae61 FOREIGN KEY (bu_entity_id_ent) REFERENCES caits_local.org_entity_mst(ent_entity_id);


--
-- Name: org_businessunit_mst fk_org_businessunit_mst_bu_manager_emp_id_emp_hrc_e_2cc1db0b; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.org_businessunit_mst
    ADD CONSTRAINT fk_org_businessunit_mst_bu_manager_emp_id_emp_hrc_e_2cc1db0b FOREIGN KEY (bu_manager_emp_id_emp) REFERENCES caits_local.hrc_employee_mst(emp_employee_id);


--
-- Name: org_location_mst fk_org_location_mst_loc_bu_id_bu_org_businessunit_m_c2b70f71; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.org_location_mst
    ADD CONSTRAINT fk_org_location_mst_loc_bu_id_bu_org_businessunit_m_c2b70f71 FOREIGN KEY (loc_bu_id_bu) REFERENCES caits_local.org_businessunit_mst(bu_bu_id);


--
-- Name: org_location_mst fk_org_location_mst_loc_entity_id_ent_org_entity_ms_040dd84e; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.org_location_mst
    ADD CONSTRAINT fk_org_location_mst_loc_entity_id_ent_org_entity_ms_040dd84e FOREIGN KEY (loc_entity_id_ent) REFERENCES caits_local.org_entity_mst(ent_entity_id);


--
-- Name: org_location_mst fk_org_location_mst_loc_manager_emp_id_emp_hrc_empl_c5a492bf; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.org_location_mst
    ADD CONSTRAINT fk_org_location_mst_loc_manager_emp_id_emp_hrc_empl_c5a492bf FOREIGN KEY (loc_manager_emp_id_emp) REFERENCES caits_local.hrc_employee_mst(emp_employee_id);


--
-- Name: sysm_rolepermission_dtl fk_rlpm_menu_id_mtree; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_rolepermission_dtl
    ADD CONSTRAINT fk_rlpm_menu_id_mtree FOREIGN KEY (rlpm_menu_id_mtree) REFERENCES caits_local.sysm_menutree_mst(mtree_menu_id);


--
-- Name: subcategory_mst fk_subcategory_mst_scat_category_id_cat_category_ms_6c1f14e1; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.subcategory_mst
    ADD CONSTRAINT fk_subcategory_mst_scat_category_id_cat_category_ms_6c1f14e1 FOREIGN KEY (scat_category_id_cat) REFERENCES caits_local.category_mst(cat_category_id);


--
-- Name: sysm_rolepermission_dtl fk_sysm_rolepermission_dtl_rlpm_role_id_rol_sysm_ro_5b4edd0a; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_rolepermission_dtl
    ADD CONSTRAINT fk_sysm_rolepermission_dtl_rlpm_role_id_rol_sysm_ro_5b4edd0a FOREIGN KEY (rlpm_role_id_rol) REFERENCES caits_local.sysm_roles_mst(rol_role_id);


--
-- Name: sysm_user_bu_mapping_dtl fk_sysm_user_bu_mapping_dtl_uboa_bu_id_bu_org_busin_fe7d7110; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_user_bu_mapping_dtl
    ADD CONSTRAINT fk_sysm_user_bu_mapping_dtl_uboa_bu_id_bu_org_busin_fe7d7110 FOREIGN KEY (uboa_bu_id_bu) REFERENCES caits_local.org_businessunit_mst(bu_bu_id);


--
-- Name: sysm_user_bu_mapping_dtl fk_sysm_user_bu_mapping_dtl_uboa_user_id_usr_sysm_u_ef6ac91b; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_user_bu_mapping_dtl
    ADD CONSTRAINT fk_sysm_user_bu_mapping_dtl_uboa_user_id_usr_sysm_u_ef6ac91b FOREIGN KEY (uboa_user_id_usr) REFERENCES caits_local.sysm_userlogin_mst(usr_user_id);


--
-- Name: sysm_useraccess_exception_dtl fk_sysm_useraccess_exception_dtl_uexc_employee_id_e_407f5c0d; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_useraccess_exception_dtl
    ADD CONSTRAINT fk_sysm_useraccess_exception_dtl_uexc_employee_id_e_407f5c0d FOREIGN KEY (uexc_employee_id_emp) REFERENCES caits_local.hrc_employee_mst(emp_employee_id);


--
-- Name: sysm_useraccess_exception_dtl fk_sysm_useraccess_exception_dtl_uexc_menu_code_mtr_5759a49f; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_useraccess_exception_dtl
    ADD CONSTRAINT fk_sysm_useraccess_exception_dtl_uexc_menu_code_mtr_5759a49f FOREIGN KEY (uexc_menu_code_mtree) REFERENCES caits_local.sysm_menutree_mst(mtree_menu_code);


--
-- Name: sysm_userlogin_mst fk_sysm_userlogin_mst_usr_employee_id_emp_hrc_emplo_3322c8a3; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_userlogin_mst
    ADD CONSTRAINT fk_sysm_userlogin_mst_usr_employee_id_emp_hrc_emplo_3322c8a3 FOREIGN KEY (usr_employee_id_emp) REFERENCES caits_local.hrc_employee_mst(emp_employee_id);


--
-- Name: sysm_userlogin_mst fk_sysm_userlogin_mst_usr_entity_id_ent_org_entity__e5983a22; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_userlogin_mst
    ADD CONSTRAINT fk_sysm_userlogin_mst_usr_entity_id_ent_org_entity__e5983a22 FOREIGN KEY (usr_entity_id_ent) REFERENCES caits_local.org_entity_mst(ent_entity_id);


--
-- Name: sysm_userlogin_mst fk_sysm_userlogin_mst_usr_location_id_loc_org_locat_538eaae6; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_userlogin_mst
    ADD CONSTRAINT fk_sysm_userlogin_mst_usr_location_id_loc_org_locat_538eaae6 FOREIGN KEY (usr_location_id_loc) REFERENCES caits_local.org_location_mst(loc_location_id);


--
-- Name: sysm_userlogin_mst fk_sysm_userlogin_mst_usr_role_id_rol_sysm_roles_ms_842e11fa; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_userlogin_mst
    ADD CONSTRAINT fk_sysm_userlogin_mst_usr_role_id_rol_sysm_roles_ms_842e11fa FOREIGN KEY (usr_role_id_rol) REFERENCES caits_local.sysm_roles_mst(rol_role_id);


--
-- Name: txn_header_mst fk_txh_department_dept; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.txn_header_mst
    ADD CONSTRAINT fk_txh_department_dept FOREIGN KEY (txh_department_id_dept) REFERENCES caits_local.hrc_department_mst(dept_department_id);


--
-- Name: txn_detail_dtl fk_txn_detail_bls; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.txn_detail_dtl
    ADD CONSTRAINT fk_txn_detail_bls FOREIGN KEY (txd_bls_id_ibm) REFERENCES caits_local.inv_bls_mst(ibm_bls_id);


--
-- Name: txn_detail_dtl fk_txn_detail_dtl_txd_issued_to_emp_id_emp; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.txn_detail_dtl
    ADD CONSTRAINT fk_txn_detail_dtl_txd_issued_to_emp_id_emp FOREIGN KEY (txd_issued_to_emp_id_emp) REFERENCES caits_local.hrc_employee_mst(emp_employee_id);


--
-- Name: txn_detail_dtl fk_txn_detail_dtl_txd_item_id_itm_inv_item_mst_itm_item_id; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.txn_detail_dtl
    ADD CONSTRAINT fk_txn_detail_dtl_txd_item_id_itm_inv_item_mst_itm_item_id FOREIGN KEY (txd_item_id_itm) REFERENCES caits_local.inv_item_mst(itm_item_id);


--
-- Name: txn_detail_dtl fk_txn_detail_dtl_txd_location_id_loc_org_location__12589534; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.txn_detail_dtl
    ADD CONSTRAINT fk_txn_detail_dtl_txd_location_id_loc_org_location__12589534 FOREIGN KEY (txd_location_id_loc) REFERENCES caits_local.org_location_mst(loc_location_id);


--
-- Name: txn_detail_dtl fk_txn_detail_dtl_txd_txn_header_id_txh_txn_header__94298fce; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.txn_detail_dtl
    ADD CONSTRAINT fk_txn_detail_dtl_txd_txn_header_id_txh_txn_header__94298fce FOREIGN KEY (txd_txn_header_id_txh) REFERENCES caits_local.txn_header_mst(txh_txn_header_id);


--
-- Name: txn_detail_dtl fk_txn_detail_dtl_txd_uom_id_unt_unit_mst_unt_unit_id; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.txn_detail_dtl
    ADD CONSTRAINT fk_txn_detail_dtl_txd_uom_id_unt_unit_mst_unt_unit_id FOREIGN KEY (txd_uom_id_unt) REFERENCES caits_local.unit_mst(unt_unit_id);


--
-- Name: txn_header_mst fk_txn_header_mst_txh_approved_by_emp_id_emp_hrc_em_92f64cdb; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.txn_header_mst
    ADD CONSTRAINT fk_txn_header_mst_txh_approved_by_emp_id_emp_hrc_em_92f64cdb FOREIGN KEY (txh_approved_by_emp_id_emp) REFERENCES caits_local.hrc_employee_mst(emp_employee_id);


--
-- Name: txn_header_mst fk_txn_header_mst_txh_entity_id_ent_org_entity_mst__6cbc7a95; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.txn_header_mst
    ADD CONSTRAINT fk_txn_header_mst_txh_entity_id_ent_org_entity_mst__6cbc7a95 FOREIGN KEY (txh_entity_id_ent) REFERENCES caits_local.org_entity_mst(ent_entity_id);


--
-- Name: txn_header_mst fk_txn_header_mst_txh_from_location_id_loc_org_loca_5fa8788a; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.txn_header_mst
    ADD CONSTRAINT fk_txn_header_mst_txh_from_location_id_loc_org_loca_5fa8788a FOREIGN KEY (txh_from_location_id_loc) REFERENCES caits_local.org_location_mst(loc_location_id);


--
-- Name: txn_header_mst fk_txn_header_mst_txh_handed_over_to_emp_id_emp_hrc_62532ba4; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.txn_header_mst
    ADD CONSTRAINT fk_txn_header_mst_txh_handed_over_to_emp_id_emp_hrc_62532ba4 FOREIGN KEY (txh_handed_over_to_emp_id_emp) REFERENCES caits_local.hrc_employee_mst(emp_employee_id);


--
-- Name: txn_header_mst fk_txn_header_mst_txh_initiated_by_emp_id_emp_hrc_e_c00d567b; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.txn_header_mst
    ADD CONSTRAINT fk_txn_header_mst_txh_initiated_by_emp_id_emp_hrc_e_c00d567b FOREIGN KEY (txh_initiated_by_emp_id_emp) REFERENCES caits_local.hrc_employee_mst(emp_employee_id);


--
-- Name: txn_header_mst fk_txn_header_mst_txh_inspected_by_emp_id_emp_hrc_e_d65e0abb; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.txn_header_mst
    ADD CONSTRAINT fk_txn_header_mst_txh_inspected_by_emp_id_emp_hrc_e_d65e0abb FOREIGN KEY (txh_inspected_by_emp_id_emp) REFERENCES caits_local.hrc_employee_mst(emp_employee_id);


--
-- Name: txn_header_mst fk_txn_header_mst_txh_location_id_loc_org_location__2914cd60; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.txn_header_mst
    ADD CONSTRAINT fk_txn_header_mst_txh_location_id_loc_org_location__2914cd60 FOREIGN KEY (txh_location_id_loc) REFERENCES caits_local.org_location_mst(loc_location_id);


--
-- Name: txn_header_mst fk_txn_header_mst_txh_party_id_vnd_inv_vendor_mst_v_dfb69feb; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.txn_header_mst
    ADD CONSTRAINT fk_txn_header_mst_txh_party_id_vnd_inv_vendor_mst_v_dfb69feb FOREIGN KEY (txh_party_id_vnd) REFERENCES caits_local.inv_vendor_mst(vnd_vendor_id);


--
-- Name: txn_header_mst fk_txn_header_mst_txh_prepared_by_emp_id_emp; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.txn_header_mst
    ADD CONSTRAINT fk_txn_header_mst_txh_prepared_by_emp_id_emp FOREIGN KEY (txh_prepared_by_emp_id_emp) REFERENCES caits_local.hrc_employee_mst(emp_employee_id);


--
-- Name: txn_header_mst fk_txn_header_mst_txh_received_by_emp_id_emp_hrc_em_f505f8fc; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.txn_header_mst
    ADD CONSTRAINT fk_txn_header_mst_txh_received_by_emp_id_emp_hrc_em_f505f8fc FOREIGN KEY (txh_received_by_emp_id_emp) REFERENCES caits_local.hrc_employee_mst(emp_employee_id);


--
-- Name: txn_header_mst fk_txn_header_mst_txh_ref_txn_header_id_txh_txn_hea_6522e207; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.txn_header_mst
    ADD CONSTRAINT fk_txn_header_mst_txh_ref_txn_header_id_txh_txn_hea_6522e207 FOREIGN KEY (txh_ref_txn_header_id_txh) REFERENCES caits_local.txn_header_mst(txh_txn_header_id);


--
-- Name: txn_header_mst fk_txn_header_mst_txh_to_location_id_loc_org_locati_a60cc529; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.txn_header_mst
    ADD CONSTRAINT fk_txn_header_mst_txh_to_location_id_loc_org_locati_a60cc529 FOREIGN KEY (txh_to_location_id_loc) REFERENCES caits_local.org_location_mst(loc_location_id);


--
-- Name: sysm_user_favourite_menu_dtl fk_user_favourite_user; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_user_favourite_menu_dtl
    ADD CONSTRAINT fk_user_favourite_user FOREIGN KEY (ufav_user_id_usr) REFERENCES caits_local.sysm_userlogin_mst(usr_user_id) ON DELETE CASCADE;


--
-- Name: inv_bls_mst inv_bls_mst_ibm_current_location_id_loc_fkey; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.inv_bls_mst
    ADD CONSTRAINT inv_bls_mst_ibm_current_location_id_loc_fkey FOREIGN KEY (ibm_current_location_id_loc) REFERENCES caits_local.org_location_mst(loc_location_id);


--
-- Name: inv_bls_mst inv_bls_mst_ibm_entity_id_ent_fkey; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.inv_bls_mst
    ADD CONSTRAINT inv_bls_mst_ibm_entity_id_ent_fkey FOREIGN KEY (ibm_entity_id_ent) REFERENCES caits_local.org_entity_mst(ent_entity_id);


--
-- Name: inv_bls_mst inv_bls_mst_ibm_item_id_itm_fkey; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.inv_bls_mst
    ADD CONSTRAINT inv_bls_mst_ibm_item_id_itm_fkey FOREIGN KEY (ibm_item_id_itm) REFERENCES caits_local.inv_item_mst(itm_item_id);


--
-- Name: sysm_user_location_mapping_dtl sysm_user_location_mapping_dtl_uloc_location_id_loc_fkey; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_user_location_mapping_dtl
    ADD CONSTRAINT sysm_user_location_mapping_dtl_uloc_location_id_loc_fkey FOREIGN KEY (uloc_location_id_loc) REFERENCES caits_local.org_location_mst(loc_location_id);


--
-- Name: sysm_user_location_mapping_dtl sysm_user_location_mapping_dtl_uloc_user_id_usr_fkey; Type: FK CONSTRAINT; Schema: caits_local; Owner: -
--

ALTER TABLE ONLY caits_local.sysm_user_location_mapping_dtl
    ADD CONSTRAINT sysm_user_location_mapping_dtl_uloc_user_id_usr_fkey FOREIGN KEY (uloc_user_id_usr) REFERENCES caits_local.sysm_userlogin_mst(usr_user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict sz8qAbuFYfbUmwf6eMQaNvT3VR5EMzC2MTGVDoQz9ocZawnPChU40YDoCJPYm8C

