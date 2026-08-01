# CAIMS — Relational Schema Document

*Corporate Asset & Inventory Management System · derived from `CAIMS_Database_Table_Structure_renamed.xlsx`*

This document describes the relational structure (tables, primary keys, foreign keys and cardinality) behind the CAIMS data dictionary. Pair it with **`caims_erd.svg` / `.png` / `.pdf`** for the visual diagram — table names below match the boxes there.

Every table also carries standard audit columns (`*_created_by`, `*_created_on`, `*_modified_by`, `*_modified_on`) — omitted below for brevity.

---

## 1. Schema at a glance

| Module | Tables | Row count style |
|---|---|---|
| Masters — Setup | `unit_mst`, `category_mst`, `subcategory_mst`, `gentype_mst`, `genmaster_mst` | Lookup / reference data |
| Masters — Organization | `org_entity_mst`, `org_businessunit_mst`, `org_location_mst` | Company structure |
| Masters — Item & Vendor | `inv_item_mst`, `inv_stock_mst`, `inv_vendor_mst` | Catalogue + live balances |
| Masters — Security | `sysm_menutree_mst`, `sysm_roles_mst`, `sysm_rolepermission_dtl`, `hrc_employee_mst`, `sysm_userlogin_mst`, `sysm_user_bu_mapping_dtl`, `sysm_useraccess_exception_dtl` | RBAC + people |
| Transactions | `txn_header_mst`, `txn_detail_dtl` | Single shared header/detail pair for all 8 document types |

**18 tables total.** Transactions use a **generalized (single-table) inheritance** pattern: one `txn_header_mst` / `txn_detail_dtl` pair serves all 8 document types (`GRN`, `GATEPASS_INWARD`, `GATEPASS_OUTWARD`, `MATERIAL_REQUISITION`, `MATERIAL_ISSUE`, `OPENING_STOCK`, `MATERIAL_TRANSFER`, `MATERIAL_RETURN`), discriminated by `txh_doc_type` — rather than 8 separate header tables.

---

## 2. Table-by-table: keys and relationships

### Masters — Setup

**`unit_mst`** — Measurement units (PCS, KG, GB…). PK `unt_unit_id`. No outgoing FKs. *Referenced by:* `inv_item_mst`, `inv_stock_mst`, `txn_detail_dtl`.

**`category_mst`** — Top-level item classification. PK `cat_category_id`. No outgoing FKs. *Referenced by:* `subcategory_mst`, `inv_item_mst`.

**`subcategory_mst`** — Second-level classification. PK `scat_subcategory_id`.
- `scat_category_id_cat` → `category_mst` (N:1 — many sub-categories per category)

**`gentype_mst`** — Generic lookup *groups* (Payment Terms, Department, Priority…). PK `gtyp_gentype_id`. No outgoing FKs. *Referenced by:* `genmaster_mst`.

**`genmaster_mst`** — Generic lookup *values*, mapped to a type. PK `gmst_genmaster_id`.
- `gmst_gentype_id_gtyp` → `gentype_mst` (N:1)
- *Referenced by:* `txn_header_mst.txh_department_id_gmst`

### Masters — Organization

**`org_entity_mst`** — Top legal entity. PK `ent_entity_id`. No outgoing FKs. *Referenced by:* `org_businessunit_mst`, `org_location_mst`, `sysm_userlogin_mst`, `txn_header_mst`.

**`org_businessunit_mst`** — Operating Unit under an Entity. PK `bu_bu_id`.
- `bu_entity_id_ent` → `org_entity_mst` (N:1)
- `bu_manager_emp_id_emp` → `hrc_employee_mst` (N:1, nullable)
- *Referenced by:* `org_location_mst`, `sysm_user_bu_mapping_dtl`

**`org_location_mst`** — Store / physical location. PK `loc_location_id`.
- `loc_entity_id_ent` → `org_entity_mst` (N:1)
- `loc_bu_id_bu` → `org_businessunit_mst` (N:1)
- `loc_manager_emp_id_emp` → `hrc_employee_mst` (N:1, nullable)
- *Referenced by:* `inv_item_mst`, `inv_stock_mst`, `hrc_employee_mst`, `sysm_userlogin_mst`, `txn_header_mst` (3 role-specific FKs), `txn_detail_dtl`

### Masters — Item & Vendor

**`inv_item_mst`** — Single table for both Asset and Consumable items (`itm_item_type` discriminator). PK `itm_item_id`.
- `itm_category_id_cat` → `category_mst` (N:1, nullable)
- `itm_subcategory_id_scat` → `subcategory_mst` (N:1, nullable)
- `itm_uom_id_unt` → `unit_mst` (N:1)
- `itm_assigned_to_emp_id_emp` → `hrc_employee_mst` (N:1, nullable — asset custody)
- `itm_current_location_id_loc` → `org_location_mst` (N:1, nullable)
- *Referenced by:* `inv_stock_mst`, `txn_detail_dtl`

**`inv_stock_mst`** — Current on-hand balance per item/location/batch. System-maintained, not directly editable. PK `stk_stock_id`.
- `stk_item_id_itm` → `inv_item_mst` (N:1)
- `stk_location_id_loc` → `org_location_mst` (N:1)
- `stk_uom_id_unt` → `unit_mst` (N:1)
- `stk_last_txn_header_id_txh` → `txn_header_mst` (N:1, nullable — last posting)

**`inv_vendor_mst`** — Vendors / suppliers / contractors / internal parties. PK `vnd_vendor_id`. No outgoing FKs. *Referenced by:* `txn_header_mst.txh_party_id_vnd`.

### Masters — Security

**`sysm_menutree_mst`** — Every screen/menu item; drives sidebar + permission tree. Not user-editable. PK `mtree_menu_id` (business key `mtree_menu_code`). No outgoing FKs. *Referenced by:* `sysm_useraccess_exception_dtl` (via code).

**`sysm_roles_mst`** — Access roles. PK `rol_role_id`. No outgoing FKs. *Referenced by:* `sysm_rolepermission_dtl`, `hrc_employee_mst`, `sysm_userlogin_mst`.

**`sysm_rolepermission_dtl`** — One row per module per role (view/create/edit/delete/approve/reject/print/export). PK `rlpm_role_permission_id`.
- `rlpm_role_id_rol` → `sysm_roles_mst` (N:1 — many permission rows per role)

**`hrc_employee_mst`** — People / system users' HR record. PK `emp_employee_id`.
- `emp_role_id_rol` → `sysm_roles_mst` (N:1)
- `emp_base_location_id_loc` → `org_location_mst` (N:1, nullable)
- `emp_reporting_to_emp_id_emp` → `hrc_employee_mst` (N:1, nullable, **self-referencing** — manager hierarchy)
- *Referenced by:* `org_businessunit_mst`, `org_location_mst` (as manager), `inv_item_mst` (as custodian), `sysm_userlogin_mst`, `sysm_useraccess_exception_dtl`, `txn_header_mst` (6 role-specific FKs — initiated by, inspected by, handed over to, received by, approved by)

**`sysm_userlogin_mst`** — Login credentials, 1:1 with an employee. PK `usr_user_id`.
- `usr_employee_id_emp` → `hrc_employee_mst` (**1:1**)
- `usr_role_id_rol` → `sysm_roles_mst` (N:1)
- `usr_entity_id_ent` → `org_entity_mst` (N:1 — home entity)
- `usr_location_id_loc` → `org_location_mst` (N:1, nullable — default/home location)
- `usr_bu_access_scope` / `usr_location_access_scope` — `ALL` or `SELECTED`
- *Referenced by:* `sysm_user_bu_mapping_dtl`, `sysm_user_location_mapping_dtl`

**`sysm_user_bu_mapping_dtl`** — Which Operating Units a `SELECTED`-scope login can see. PK `uboa_user_bu_access_id`.

**`sysm_user_location_mapping_dtl`** — Which Locations a `SELECTED`-scope login can see. PK `uloc_user_loc_access_id`.
- `uboa_user_id_usr` → `sysm_userlogin_mst` (N:1)
- `uboa_bu_id_bu` → `org_businessunit_mst` (N:1)
- Together these form the **M:N** bridge between logins and Operating Units.

**`sysm_useraccess_exception_dtl`** — Per-employee Grant/Revoke override of a role's default menu permission. PK `uexc_exception_id`.
- `uexc_employee_id_emp` → `hrc_employee_mst` (N:1)
- `uexc_menu_code_mtree` → `sysm_menutree_mst` (N:1, via `mtree_menu_code`)

### Transactions (Common)

**`txn_header_mst`** — Single shared header for all 8 document types. PK `txh_txn_header_id`. Unique on (`txh_doc_type`, `txh_doc_no`).
- `txh_entity_id_ent` → `org_entity_mst` (N:1, nullable — OST)
- `txh_location_id_loc` → `org_location_mst` (N:1, nullable — primary store)
- `txh_from_location_id_loc` → `org_location_mst` (N:1, nullable — MTRF)
- `txh_to_location_id_loc` → `org_location_mst` (N:1, nullable — MTRF/MREQ/MISS/MRET)
- `txh_party_id_vnd` → `inv_vendor_mst` (N:1, nullable — supplier/party)
- `txh_department_id_gmst` → `genmaster_mst` (N:1, nullable)
- `txh_initiated_by_emp_id_emp` → `hrc_employee_mst` (N:1 — prepared/requested by)
- `txh_inspected_by_emp_id_emp` → `hrc_employee_mst` (N:1, nullable — GRN)
- `txh_handed_over_to_emp_id_emp` → `hrc_employee_mst` (N:1, nullable — GO)
- `txh_received_by_emp_id_emp` → `hrc_employee_mst` (N:1, nullable — GI/MISS)
- `txh_approved_by_emp_id_emp` → `hrc_employee_mst` (N:1, nullable — GRN/MREQ)
- `txh_ref_txn_header_id_txh` → `txn_header_mst` (N:1, nullable, **self-referencing** — links GI→GO for returnables, MISS→MREQ, MRET→MREQ/MISS)
- *Referenced by:* `txn_detail_dtl`, `inv_stock_mst.stk_last_txn_header_id_txh`

**`txn_detail_dtl`** — Single shared line-item table for all 8 document types, one-to-many with the header. PK `txd_txn_detail_id`.
- `txd_txn_header_id_txh` → `txn_header_mst` (**N:1**, mandatory — many lines per header)
- `txd_item_id_itm` → `inv_item_mst` (N:1)
- `txd_uom_id_unt` → `unit_mst` (N:1, nullable)
- `txd_location_id_loc` → `org_location_mst` (N:1, nullable)

---

## 3. Cardinality summary

| Relationship | Type |
|---|---|
| `category_mst` → `subcategory_mst` | 1 : N |
| `gentype_mst` → `genmaster_mst` | 1 : N |
| `org_entity_mst` → `org_businessunit_mst` | 1 : N |
| `org_entity_mst` → `org_location_mst` | 1 : N |
| `org_businessunit_mst` → `org_location_mst` | 1 : N |
| `org_location_mst` → `hrc_employee_mst` (base location) | 1 : N |
| `hrc_employee_mst` → `hrc_employee_mst` (reporting manager) | 1 : N, self-referencing |
| `sysm_roles_mst` → `hrc_employee_mst` | 1 : N |
| `sysm_roles_mst` → `sysm_rolepermission_dtl` | 1 : N |
| `hrc_employee_mst` → `sysm_userlogin_mst` | **1 : 1** |
| `sysm_userlogin_mst` ↔ `org_businessunit_mst` (via `sysm_user_bu_mapping_dtl`) | **M : N** |
| `category_mst` / `subcategory_mst` / `unit_mst` → `inv_item_mst` | 1 : N |
| `inv_item_mst` → `inv_stock_mst` | 1 : N (per location/batch) |
| `org_location_mst` → `inv_stock_mst` | 1 : N |
| `txn_header_mst` → `txn_detail_dtl` | **1 : N** (core transaction pattern) |
| `txn_header_mst` → `txn_header_mst` (reference doc) | 1 : N, self-referencing |
| `inv_vendor_mst` → `txn_header_mst` | 1 : N |
| `hrc_employee_mst` → `txn_header_mst` | 1 : N (6 separate role FKs) |

---

## 4. Design notes

- **Polymorphic transactions:** `txn_header_mst`/`txn_detail_dtl` intentionally hold columns for *all* 8 document types; a given row only populates the columns relevant to its `doc_type` (see the Doc Type reference table in the source workbook), the rest stay `NULL`. This keeps reporting and stock-posting logic in one place at the cost of many nullable columns.
- **Self-referencing FKs** appear twice: `hrc_employee_mst.emp_reporting_to_emp_id_emp` (org hierarchy) and `txn_header_mst.txh_ref_txn_header_id_txh` (document-to-document linkage, e.g. Material Issue → its Requisition, or Gatepass Inward → the Outward it's returning against).
- **`inv_stock_mst` is derived, not authoritative-input:** every quantity column is populated by posting from GRN / Gatepass / Requisition / Issue / Transfer / Return / Opening Stock transactions — there is no direct create/update UI for it (see the API doc's read-only `/stock` endpoints).
- **Two access-control layers:** default permissions come from `sysm_roles_mst` → `sysm_rolepermission_dtl` (per-role, per-module); `sysm_useraccess_exception_dtl` allows a Grant/Revoke override for one employee on one menu item, time-bounded by `uexc_valid_from` / `uexc_valid_until`.
- **OU visibility scope:** `sysm_userlogin_mst.usr_bu_access_scope` = `ALL` needs no bridge rows; `= SPECIFIC` is resolved via the `sysm_user_bu_mapping_dtl` M:N bridge table.
