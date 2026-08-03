package com.caits.common;

import java.util.Locale;
import java.util.Map;

/**
 * Turns a database constraint violation into wording a user can act on.
 * The service layer catches these cases first; this is the safety net for
 * anything that reaches the database anyway (races, direct API calls, imports).
 */
public final class ConstraintMessages {

    private static final Map<String, String> BY_CONSTRAINT = Map.ofEntries(
            Map.entry("unit_mst_unt_unit_code_key", "Unit code already exists"),
            Map.entry("category_mst_cat_category_code_key", "Category code already exists"),
            Map.entry("subcategory_mst_scat_subcategory_code_key", "Sub-category code already exists"),
            Map.entry("gentype_mst_gtyp_type_code_key", "Type code already exists"),
            Map.entry("genmaster_mst_gmst_value_code_key", "Value code already exists — value codes must be unique across all types"),
            Map.entry("inv_item_mst_itm_item_code_key", "Item code already exists"),
            Map.entry("uq_item_serial_no", "This serial number is already recorded against another item"),
            Map.entry("inv_vendor_mst_vnd_vendor_code_key", "Vendor code already exists"),
            Map.entry("org_entity_mst_ent_entity_code_key", "Organization code already exists"),
            Map.entry("org_businessunit_mst_bu_bu_code_key", "Operating Unit code already exists"),
            Map.entry("org_location_mst_loc_location_code_key", "Location code already exists"),
            Map.entry("sysm_roles_mst_rol_role_code_key", "Role code already exists"),
            Map.entry("hrc_employee_mst_emp_employee_code_key", "Employee code already exists"),
            Map.entry("hrc_employee_mst_emp_email_key", "This email is already used by another employee"),
            Map.entry("sysm_userlogin_mst_usr_login_id_key", "Login ID already exists"),
                    Map.entry("uq_user_location", "That location is already mapped to this user"),
                    Map.entry("uq_bls_serial_no", "This serial number is already registered"),
                    Map.entry("uq_bls_dummy_per_item", "A dummy BLS already exists for this item"),
                    Map.entry("uq_bls_item_batch", "This batch is already registered for the item")
            );

    private ConstraintMessages() {
    }

    public static String describe(String rootMessage) {
        String text = rootMessage == null ? "" : rootMessage.toLowerCase(Locale.ROOT);
        for (Map.Entry<String, String> e : BY_CONSTRAINT.entrySet()) {
            if (text.contains(e.getKey())) return e.getValue();
        }
        if (text.contains("foreign key") || text.contains("violates foreign key constraint")) {
            return "This record is linked to other data and cannot be saved or removed as requested";
        }
        if (text.contains("not-null") || text.contains("null value in column")) {
            return "A required field was left empty";
        }
        if (text.contains("duplicate key")) {
            return "A record with these details already exists";
        }
        return "The change conflicts with existing data";
    }
}
