"""Generate db_approach/seed_office_item_master.sql from ITEM_MASTER.csv."""

from __future__ import annotations

import csv
from pathlib import Path

CSV_PATH = Path(__file__).resolve().parent.parent / "imports" / "office_assets" / "ITEM_MASTER.csv"
OUT_PATH = Path(__file__).resolve().parent / "seed_office_item_master.sql"


def esc(s: str) -> str:
    return (s or "").replace("'", "''")


def asset_type_for(sub: str) -> str:
    return {
        "SC-LAPTOP": "IT – Laptop",
        "SC-DESKTOP": "IT – Peripheral",
        "SC-PERIPH": "IT – Peripheral",
    }.get(sub, "Other")


def main() -> None:
    rows = list(csv.DictReader(CSV_PATH.open(encoding="utf-8")))
    parts: list[str] = [
        "-- CAITS — Seed Item Master from office assets import pack",
        "-- Schema: caits_local",
        "-- Safe to re-run: inserts only when item code is missing",
        "-- Default location: IT Store (LOC-004) when present, else first active location",
        "",
        "SET search_path TO caits_local;",
        "",
        """DO $$
DECLARE
  v_loc INTEGER;
BEGIN
  SELECT loc_location_id INTO v_loc
  FROM org_location_mst
  WHERE UPPER(loc_location_code) = 'LOC-004' AND loc_isactive
  LIMIT 1;
  IF v_loc IS NULL THEN
    SELECT loc_location_id INTO v_loc
    FROM org_location_mst
    WHERE loc_isactive
    ORDER BY loc_location_id
    LIMIT 1;
  END IF;
  IF v_loc IS NULL THEN
    RAISE EXCEPTION 'No active location found — create a store before seeding items';
  END IF;
  PERFORM set_config('caits.seed_item_loc', v_loc::text, false);
END $$;""",
        "",
        "CREATE TEMP TABLE tmp_office_items (",
        "  item_code varchar(50),",
        "  item_name varchar(200),",
        "  item_type varchar(20),",
        "  category_code varchar(30),",
        "  subcategory_code varchar(30),",
        "  uom_code varchar(20),",
        "  make_brand varchar(100),",
        "  model varchar(100),",
        "  ram varchar(50),",
        "  storage varchar(100),",
        "  asset_type varchar(100),",
        "  consumable_type varchar(100),",
        "  is_serialized boolean,",
        "  is_consumable boolean,",
        "  descr varchar(255)",
        ");",
        "",
        "INSERT INTO tmp_office_items VALUES",
    ]

    value_rows: list[str] = []
    for r in rows:
        it = r["itemType"].strip().lower()
        sub = r["subcategoryCode"]
        if it == "asset":
            at = asset_type_for(sub)
            ct_sql = "NULL"
            is_ser = "TRUE"
            is_cons = "FALSE"
            at_sql = f"'{esc(at)}'"
        else:
            at_sql = "NULL"
            ct_sql = "'Consumable'"
            is_ser = "FALSE"
            is_cons = "TRUE"
        value_rows.append(
            "(\n"
            f"    '{esc(r['itemCode'][:50])}', '{esc(r['itemName'][:150])}', '{esc(it)}', "
            f"'{esc(r['categoryCode'])}', '{esc(sub)}', '{esc(r['uomCode'])}',\n"
            f"    '{esc(r['makeBrand'][:100])}', '{esc(r['model'][:100])}', "
            f"'{esc(r['ram'][:50])}', '{esc(r['storage'][:100])}',\n"
            f"    {at_sql}, {ct_sql}, {is_ser}, {is_cons}, "
            f"'{esc((r.get('description') or '')[:255])}'\n"
            "  )"
        )

    parts.append(",\n".join(value_rows) + ";")
    parts.append("")
    parts.append(
        """INSERT INTO inv_item_mst (
    itm_item_code, itm_item_name, itm_item_type,
    itm_category_id_cat, itm_subcategory_id_scat, itm_uom_id_unt,
    itm_desc, itm_asset_type, itm_make_brand, itm_model,
    itm_current_location_id_loc,
    itm_is_serialized, itm_is_returnable, itm_is_under_amc, itm_is_insurance_required,
    itm_inspection_needed, itm_consumable_type,
    itm_track_batch_lot, itm_track_expiry, itm_is_consumable, itm_allow_negative_stock,
    itm_ram, itm_storage,
    itm_isactive, itm_created_by, itm_created_on
)
SELECT
    t.item_code,
    t.item_name,
    t.item_type,
    c.cat_category_id,
    s.scat_subcategory_id,
    u.unt_unit_id,
    t.descr,
    t.asset_type,
    NULLIF(t.make_brand, ''),
    NULLIF(t.model, ''),
    current_setting('caits.seed_item_loc')::integer,
    t.is_serialized,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    t.consumable_type,
    FALSE,
    FALSE,
    t.is_consumable,
    FALSE,
    NULLIF(t.ram, ''),
    NULLIF(t.storage, ''),
    TRUE,
    'system',
    NOW()
FROM tmp_office_items t
JOIN category_mst c ON UPPER(c.cat_category_code) = UPPER(t.category_code)
JOIN subcategory_mst s ON UPPER(s.scat_subcategory_code) = UPPER(t.subcategory_code)
JOIN unit_mst u ON UPPER(u.unt_unit_code) = UPPER(t.uom_code)
WHERE NOT EXISTS (
    SELECT 1 FROM inv_item_mst i WHERE UPPER(i.itm_item_code) = UPPER(t.item_code)
);"""
    )

    OUT_PATH.write_text("\n".join(parts) + "\n", encoding="utf-8")
    print(f"wrote {OUT_PATH} ({len(rows)} rows, {OUT_PATH.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
