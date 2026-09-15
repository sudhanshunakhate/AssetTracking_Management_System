import re
import sys
from typing import Any

import pandas as pd


XLSX_PATH = r"d:\AssetTracking_Management_System\db_approach\CAIMS_Database_Table_Structure_renamed.xlsx"

SCHEMA_NAME = "CAITS_local"


TABLE_NAME_RE = re.compile(r"^([A-Za-z0-9_]+_(?:mst|dtl))$")
TABLE_LABEL_RE = re.compile(r"([A-Za-z0-9_]+_(?:mst|dtl))")


def map_postgres_type(dt: str) -> str:
    dt = str(dt).strip().upper()
    if not dt or dt == "NAN":
        return "TEXT"
    if dt == "INT":
        return "INTEGER"
    if dt == "TINYINT" or dt.startswith("TINYINT"):
        # Postgres doesn't have TINYINT; map to SMALLINT.
        return "SMALLINT"
    if dt == "INTEGER":
        return "INTEGER"
    if dt == "BIGINT":
        return "BIGINT"
    if dt == "SMALLINT":
        return "SMALLINT"
    if dt.startswith("VARCHAR"):
        return dt  # e.g. VARCHAR(20)
    if dt.startswith("DECIMAL"):
        # DECIMAL(18,2) -> NUMERIC(18,2)
        inner = dt[dt.find("(") + 1 : dt.rfind(")")]
        if inner:
            return f"NUMERIC({inner})"
        return "NUMERIC"
    if dt == "DATETIME":
        return "TIMESTAMP"
    if dt == "DATE":
        return "DATE"
    if dt == "BOOLEAN":
        return "BOOLEAN"
    return dt


def normalize_key(key_text: Any) -> str:
    if key_text is None or (isinstance(key_text, float) and pd.isna(key_text)):
        return ""
    s = str(key_text).strip()
    # Some cells may contain things like "UQ (a + b)" or "FK -> other_table (self)"
    return s


def extract_fk_ref_table(key_text: str) -> str | None:
    m = re.search(r"FK\s*->\s*([A-Za-z0-9_]+)", key_text, flags=re.IGNORECASE)
    return m.group(1) if m else None


def extract_uq_columns_from_parentheses(key_text: str) -> list[str] | None:
    # Example: "UQ (txh_doc_type + txh_doc_no)"
    m = re.search(r"UQ\s*\(([^)]+)\)", key_text, flags=re.IGNORECASE)
    if not m:
        return None
    inner = m.group(1)
    cols = [c.strip() for c in inner.split("+")]
    cols = [c for c in cols if c]
    return cols or None


def safe_ident(name: str) -> str:
    # PostgreSQL identifiers allow underscores; we keep it simple.
    return re.sub(r"[^A-Za-z0-9_]+", "_", name)


def constraint_name(prefix: str, *parts: str) -> str:
    base = safe_ident(prefix + "_" + "_".join(parts))
    if len(base) <= 60:
        return base
    # Keep deterministic-ish name under the 63-char limit.
    import hashlib

    h = hashlib.sha1(base.encode("utf-8")).hexdigest()[:8]
    return base[: (60 - 9)] + "_" + h


def choose_code_reference_col(fk_field: str, ref_table: str, code_cols: list[str]) -> str | None:
    fk_l = fk_field.lower()
    # Prefer the code column that "matches" the fk field name.
    candidates = [c for c in code_cols if c.lower() in fk_l or fk_l in c.lower()]
    if candidates:
        # If multiple, pick the longest matching string (most specific).
        return sorted(candidates, key=len, reverse=True)[0]
    # If fk field contains a token (e.g. menu_code), try to match by token overlap.
    if "code" in fk_l:
        token = None
        if "menu_code" in fk_l:
            token = "menu_code"
        elif "code" in fk_l:
            # take substring before "_code"
            token = fk_l.split("_code")[0] + "_code"
        if token:
            for c in code_cols:
                if token in c.lower():
                    return c
    return code_cols[0] if code_cols else None


def load_tables_from_xlsx() -> dict[str, dict[str, Any]]:
    # Structure:
    # tables[table_name] = {
    #   "columns": [{field, dtype, key, mandatory}],
    #   "pk_cols": [...],
    #   "uq_constraints": [{cols:[...]}], includes single-col and multi-col
    #   "fks": [{field, ref_table}]
    # }
    xl = pd.ExcelFile(XLSX_PATH)
    tables: dict[str, dict[str, Any]] = {}

    for sheet_name in xl.sheet_names:
        df = pd.read_excel(XLSX_PATH, sheet_name=sheet_name, header=None)
        col0 = df.iloc[:, 0]

        # Find table start rows.
        starts: list[tuple[int, str]] = []
        for i in range(len(df)):
            v = col0.iloc[i]
            if not isinstance(v, str):
                continue
            v_str = v.strip()
            if not v_str:
                continue

            # Case 1: direct row like: unit_mst (other columns NaN)
            m = TABLE_NAME_RE.match(v_str)
            if m and df.iloc[i, 1:].isna().all():
                starts.append((i, m.group(1)))
                continue

            # Case 2: label row like "HEADER TABLE — txn_header_mst"
            if ("HEADER TABLE" in v_str) or ("DETAIL TABLE" in v_str):
                m2 = TABLE_LABEL_RE.search(v_str)
                if m2 and df.iloc[i, 1:].isna().all():
                    starts.append((i, m2.group(1)))

        starts = sorted(starts, key=lambda x: x[0])
        if not starts:
            continue

        for start_idx, table_name in starts:
            if table_name in tables:
                # If the workbook repeats labels in unexpected places, prefer the first parsed block.
                continue

            end_idx = next((s for s, _ in starts if s > start_idx), len(df))
            block = df.iloc[start_idx:end_idx]

            # Find the header row for field definitions inside the block.
            header_row = None
            for k in range(block.shape[0]):
                if block.iloc[k, 0] == "Field Name" and block.iloc[k, 1] == "Data Type":
                    header_row = k
                    break
            if header_row is None:
                # Fallback: look for a row with Field Name only.
                for k in range(block.shape[0]):
                    if block.iloc[k, 0] == "Field Name":
                        header_row = k
                        break
            if header_row is None:
                continue

            fields_df = block.iloc[header_row + 1 :].copy()
            # Expected column positions:
            # 0 Field Name, 1 Data Type, 2 Key, 3 Mandatory, 4 Description
            fields_df = fields_df.iloc[:, 0:5]
            fields_df.columns = ["field_name", "data_type", "key", "mandatory", "description"]

            # Keep only real field rows.
            fields_df = fields_df[fields_df["field_name"].notna()]
            fields_df = fields_df[fields_df["data_type"].notna()]

            columns: list[dict[str, Any]] = []
            pk_cols: list[str] = []
            code_uq_cols: list[str] = []
            uq_constraints: list[dict[str, Any]] = []
            fks: list[dict[str, Any]] = []

            for _, r in fields_df.iterrows():
                field = str(r["field_name"]).strip()
                dtype = str(r["data_type"]).strip()
                key_text = normalize_key(r["key"])
                mandatory = normalize_key(r["mandatory"])
                # Some workbooks encode mandatory as "Yes"/"No" but we keep it string-y.
                mandatory_val = "Yes" if str(mandatory).strip().lower() == "yes" else "No"

                columns.append(
                    {
                        "field": field,
                        "dtype": dtype,
                        "key": key_text,
                        "mandatory": mandatory_val,
                    }
                )

                if key_text == "PK" or key_text.upper().startswith("PK "):
                    pk_cols.append(field)

                if key_text.upper().startswith("UQ"):
                    uq_cols = extract_uq_columns_from_parentheses(key_text)
                    if uq_cols:
                        uq_constraints.append({"cols": uq_cols, "source_field": field})
                    else:
                        uq_constraints.append({"cols": [field], "source_field": field})

                    if "code" in field.lower():
                        code_uq_cols.append(field)

                if key_text.upper().startswith("FK ->") or "FK ->" in key_text:
                    ref_table = extract_fk_ref_table(key_text)
                    if ref_table:
                        fks.append({"field": field, "ref_table": ref_table, "key": key_text})

            tables[table_name] = {
                "columns": columns,
                "pk_cols": pk_cols,
                "uq_constraints": uq_constraints,
                "fks": fks,
                "code_uq_cols": code_uq_cols,
            }

    return tables


def generate_ddl(tables: dict[str, dict[str, Any]]) -> str:
    # Precompute pk per table.
    pk_by_table: dict[str, str] = {}
    code_uq_by_table: dict[str, list[str]] = {}
    uq_multi_by_table: dict[str, list[dict[str, Any]]] = {}

    for tname, t in tables.items():
        if not t["pk_cols"]:
            raise RuntimeError(f"Missing PK column in table {tname}")
        # This design doc uses a single PK per table.
        pk_by_table[tname] = t["pk_cols"][0]
        code_uq_by_table[tname] = t.get("code_uq_cols", [])

        multi_uq = [u for u in t["uq_constraints"] if len(u["cols"]) > 1]
        uq_multi_by_table[tname] = multi_uq

    ddls: list[str] = []
    ddls.append("BEGIN;")
    ddls.append(f"CREATE SCHEMA IF NOT EXISTS {SCHEMA_NAME};")
    ddls.append(f"SET search_path = {SCHEMA_NAME}, public;")

    # 1) Create tables without FK constraints (to avoid ordering issues).
    for table_name in sorted(tables.keys()):
        t = tables[table_name]
        pk_col = pk_by_table[table_name]

        col_lines: list[str] = []
        table_level_uq_multi: list[str] = []

        # Build UQ constraints sets for single columns
        single_uq_fields: set[str] = set()
        multi_uq = uq_multi_by_table.get(table_name, [])
        for uq in t["uq_constraints"]:
            cols = uq["cols"]
            if len(cols) == 1:
                single_uq_fields.add(cols[0])

        for col in t["columns"]:
            field = col["field"]
            dtype_pg = map_postgres_type(col["dtype"])
            mandatory = col["mandatory"] == "Yes"
            key_text = col["key"]

            # PK as identity + primary key
            if field == pk_col and (dtype_pg in ("INTEGER", "BIGINT", "SMALLINT")):
                identity = (
                    "GENERATED ALWAYS AS IDENTITY"
                    if dtype_pg in ("INTEGER", "BIGINT", "SMALLINT")
                    else ""
                )
                not_null = "NOT NULL"
                col_lines.append(
                    f"{field} {dtype_pg} {identity} PRIMARY KEY"
                    + (f" {not_null}" if not_null else "")
                )
                continue
            if field == pk_col:
                # Fallback for non-integer PKs.
                not_null = "NOT NULL" if mandatory else ""
                col_lines.append(f"{field} {dtype_pg} {not_null} PRIMARY KEY".rstrip())
                continue

            not_null = "NOT NULL" if mandatory else ""
            uq_inline = "UNIQUE" if field in single_uq_fields else ""
            col_lines.append(f"{field} {dtype_pg} {not_null} {uq_inline}".rstrip())

        # Composite unique constraints from key_text (e.g. txh_doc_no unique with txh_doc_type)
        for uq in multi_uq:
            cols = uq["cols"]
            cname = constraint_name("uq", table_name, *cols)
            table_level_uq_multi.append(f"CONSTRAINT {cname} UNIQUE ({', '.join(cols)})")

        all_lines = col_lines + table_level_uq_multi
        ddls.append(f"\nCREATE TABLE {SCHEMA_NAME}.{table_name} (\n  " + ",\n  ".join(all_lines) + "\n);")

    # 2) Add FK constraints with ALTER TABLE.
    for table_name in sorted(tables.keys()):
        t = tables[table_name]
        if not t["fks"]:
            continue

        for fk in t["fks"]:
            field = fk["field"]
            ref_table = fk["ref_table"]
            if ref_table not in tables:
                # If the ref table exists but the workbook didn't parse it (unexpected),
                # allow DB to error rather than guessing.
                raise RuntimeError(f"FK reference table {ref_table} not found for {table_name}.{field}")

            # Determine referenced column.
            pk_col = pk_by_table[ref_table]
            ref_cols = [pk_col]

            code_candidates = code_uq_by_table.get(ref_table, [])
            if "code" in field.lower() and code_candidates:
                code_col = choose_code_reference_col(field, ref_table, code_candidates)
                if code_col:
                    ref_cols = [code_col]

            ref_col = ref_cols[0]
            cname = constraint_name("fk", table_name, field, ref_table, ref_col)
            ddls.append(
                f"ALTER TABLE {SCHEMA_NAME}.{table_name} "
                f"ADD CONSTRAINT {cname} FOREIGN KEY ({field}) "
                f"REFERENCES {SCHEMA_NAME}.{ref_table}({ref_col});"
            )

    ddls.append("COMMIT;")
    return "\n".join(ddls) + "\n"


def main() -> int:
    tables = load_tables_from_xlsx()
    if not tables:
        print("No tables found in XLSX. Check sheet names/format.", file=sys.stderr)
        return 2
    ddl = generate_ddl(tables)
    # Optional preview: --preview-lines 50
    if "--preview-lines" in sys.argv:
        i = sys.argv.index("--preview-lines")
        n = int(sys.argv[i + 1]) if i + 1 < len(sys.argv) else 80
        lines = ddl.splitlines()
        sys.stdout.write("\n".join(lines[:n]) + "\n")
        sys.stdout.write(f"-- PREVIEW TRUNCATED (showing first {n} lines of {len(lines)}) --\n")
        return 0

    sys.stdout.write(ddl)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

