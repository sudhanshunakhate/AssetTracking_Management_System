# Parse CAIMS API docs JSON examples into a field registry for generators.
# Also emits a summary used while scaffolding controllers.
from __future__ import annotations

import json
import re
from pathlib import Path

import pandas as pd

XLSX = Path(__file__).with_name("CAIMS_API_Documentation.xlsx")
OUT = Path(__file__).with_name("api_payload_fields.json")


def extract_json_objects(text: str) -> list[dict]:
    if not text or text.strip().lower().startswith("none"):
        return []
    objs = []
    # Find JSON object blobs
    for m in re.finditer(r"\{[\s\S]*?\}", text):
        blob = m.group(0)
        try:
            objs.append(json.loads(blob))
        except json.JSONDecodeError:
            # try fixing trailing commas / single quotes lightly
            continue
    return objs


def flatten_keys(obj, prefix="") -> dict:
    out = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            key = f"{prefix}.{k}" if prefix else k
            if isinstance(v, dict):
                out.update(flatten_keys(v, key))
            elif isinstance(v, list):
                out[key] = "array"
                if v and isinstance(v[0], dict):
                    out.update(flatten_keys(v[0], key + "[]"))
            else:
                out[key] = type(v).__name__
    return out


def main():
    xl = pd.ExcelFile(XLSX)
    registry = {}
    for sheet in xl.sheet_names:
        if sheet == "Index":
            continue
        df = pd.read_excel(XLSX, sheet_name=sheet)
        # Expected columns from dump
        cols = list(df.columns)
        # normalize
        for _, row in df.iterrows():
            name = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ""
            method = str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else ""
            url = str(row.iloc[2]).strip() if pd.notna(row.iloc[2]) else ""
            req = str(row.iloc[4]) if pd.notna(row.iloc[4]) else ""
            res = str(row.iloc[5]) if pd.notna(row.iloc[5]) else ""
            if not url.startswith("/"):
                continue
            path = url.split("?")[0]
            req_objs = extract_json_objects(req)
            res_objs = extract_json_objects(res)
            req_fields = flatten_keys(req_objs[0]) if req_objs else {}
            # Prefer list item shape if present
            res_fields = {}
            for o in res_objs:
                if isinstance(o, dict) and "data" in o and isinstance(o["data"], list) and o["data"]:
                    res_fields = flatten_keys(o["data"][0])
                    break
                if isinstance(o, dict) and "data" not in o:
                    res_fields = flatten_keys(o)
                    break
            registry[f"{method} {path}"] = {
                "sheet": sheet,
                "apiName": name,
                "method": method,
                "path": path,
                "requestFields": req_fields,
                "responseFields": res_fields,
            }

    OUT.write_text(json.dumps(registry, indent=2), encoding="utf-8")
    print(f"Wrote {OUT} with {len(registry)} endpoints")


if __name__ == "__main__":
    main()
