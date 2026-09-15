"""Parse CAIMS_API_Documentation.xlsx into structured JSON for backend scaffolding."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import pandas as pd

PATH = Path(__file__).with_name("CAIMS_API_Documentation.xlsx")
OUT = Path(__file__).with_name("api_docs_parsed.json")


def cell(df: pd.DataFrame, r: int, c: int) -> str:
    if r < 0 or r >= len(df) or c < 0 or c >= df.shape[1]:
        return ""
    v = df.iloc[r, c]
    if pd.isna(v):
        return ""
    return str(v).strip()


def extract_sheet(sheet: str) -> dict:
    df = pd.read_excel(PATH, sheet_name=sheet, header=None)
    endpoints: list[dict] = []
    sections: list[str] = []

    # Capture section titles (rows where col0 looks like a heading and rest mostly empty)
    for i in range(len(df)):
        a = cell(df, i, 0)
        if not a:
            continue
        if a.upper() in {"GET", "POST", "PUT", "PATCH", "DELETE", "METHOD", "FIELD", "FIELD NAME"}:
            continue
        # section-like titles
        if len(a) < 120 and not a.startswith("/") and "http" not in a.lower():
            b = cell(df, i, 1)
            if not b or b.upper() in {"METHOD", "ENDPOINT", "DESCRIPTION"}:
                sections.append(a)

        for c in range(min(6, df.shape[1])):
            s = cell(df, i, c)
            method = None
            path_val = None
            m = re.match(r"^(GET|POST|PUT|PATCH|DELETE)\s+(/\S+)", s, re.I)
            if m:
                method, path_val = m.group(1).upper(), m.group(2)
            elif re.match(r"^(GET|POST|PUT|PATCH|DELETE)$", s, re.I):
                method = s.upper()
                for c2 in range(c + 1, min(c + 4, df.shape[1])):
                    v2 = cell(df, i, c2)
                    if v2.startswith("/"):
                        path_val = v2
                        break
                    # sometimes path is in same row description-ish
                    m2 = re.search(r"(/\S+)", v2)
                    if m2 and "/api" in v2:
                        path_val = m2.group(1)
                        break
            if method and path_val:
                # Gather nearby description / request / response rows
                desc = ""
                for j in range(i, min(i + 8, len(df))):
                    for cc in range(df.shape[1]):
                        vv = cell(df, j, cc)
                        if vv.lower().startswith("description") or "desc" == vv.lower():
                            desc = cell(df, j, cc + 1) or cell(df, j + 1, cc)
                # Collect field table if present below
                fields: list[dict] = []
                for j in range(i + 1, min(i + 80, len(df))):
                    row0 = cell(df, j, 0)
                    row1 = cell(df, j, 1)
                    if re.match(r"^(GET|POST|PUT|PATCH|DELETE)$", row0, re.I) or (
                        row0.upper() in {"GET", "POST"} and cell(df, j, 1).startswith("/")
                    ):
                        break
                    if row0.lower() in {"field", "field name", "parameter", "param"} and row1:
                        # header row
                        continue
                    # Heuristic: field-like rows have name in col0 and type in col1
                    if (
                        row0
                        and re.match(r"^[a-zA-Z_][a-zA-Z0-9_.*\[\]]*$", row0)
                        and row1
                        and any(
                            t in row1.upper()
                            for t in (
                                "STRING",
                                "INT",
                                "INTEGER",
                                "LONG",
                                "BOOLEAN",
                                "NUMBER",
                                "DECIMAL",
                                "DATE",
                                "OBJECT",
                                "ARRAY",
                                "VARCHAR",
                                "UUID",
                                "ENUM",
                                "DATETIME",
                                "DOUBLE",
                                "FLOAT",
                                "BIGDECIMAL",
                                "LIST",
                            )
                        )
                    ):
                        fields.append(
                            {
                                "name": row0,
                                "type": row1,
                                "required": cell(df, j, 2),
                                "notes": cell(df, j, 3) or cell(df, j, 4),
                            }
                        )
                endpoints.append(
                    {
                        "row": i,
                        "method": method,
                        "path": path_val,
                        "description": desc,
                        "fields": fields[:60],
                    }
                )

    # Deduplicate by method+path keeping first
    seen = set()
    uniq = []
    for e in endpoints:
        key = (e["method"], e["path"])
        if key in seen:
            continue
        seen.add(key)
        uniq.append(e)

    return {
        "sheet": sheet,
        "shape": [int(df.shape[0]), int(df.shape[1])],
        "sections": sections[:40],
        "endpoints": uniq,
        # raw sample for debugging
        "raw_preview": [
            [cell(df, r, c) for c in range(min(6, df.shape[1]))] for r in range(min(25, len(df)))
        ],
    }


def main() -> int:
    xl = pd.ExcelFile(PATH)
    result = {"sheets": xl.sheet_names, "modules": []}
    for sh in xl.sheet_names:
        mod = extract_sheet(sh)
        result["modules"].append(mod)
        print(f"=== {sh}: {len(mod['endpoints'])} endpoints ===", file=sys.stderr)
        for e in mod["endpoints"]:
            print(f"  {e['method']:6} {e['path']}  fields={len(e['fields'])}", file=sys.stderr)

    OUT.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {OUT}", file=sys.stderr)
    print(f"TOTAL endpoints: {sum(len(m['endpoints']) for m in result['modules'])}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
