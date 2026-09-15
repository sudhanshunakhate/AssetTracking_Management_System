"""Dump detailed Auth + Units + GRN sections from API workbook for payload design."""
from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd

PATH = Path(__file__).with_name("CAIMS_API_Documentation.xlsx")
OUT = Path(__file__).with_name("api_detail_dump.txt")


def dump_sheet(name: str, max_rows: int = 200) -> str:
    df = pd.read_excel(PATH, sheet_name=name, header=None)
    lines = [f"\n{'='*80}\nSHEET: {name} shape={df.shape}\n{'='*80}"]
    for i in range(min(max_rows, len(df))):
        vals = []
        for c in range(df.shape[1]):
            v = df.iloc[i, c]
            if pd.notna(v):
                vals.append(f"[{c}]{str(v).strip()}")
        if vals:
            lines.append(f"{i:03d}| " + " | ".join(vals))
    return "\n".join(lines)


def main() -> int:
    sheets = [
        "Auth",
        "Masters - Setup",
        "Masters - Organization",
        "Masters - Item & Vendor",
        "Masters - Security",
        "Transactions - GRN",
        "Transactions - Opening Stock",
        "Transactions - Material Issue",
    ]
    parts = []
    for sh in sheets:
        parts.append(dump_sheet(sh, 250))
    text = "\n".join(parts)
    OUT.write_text(text, encoding="utf-8")
    print(f"Wrote {OUT} ({len(text)} chars)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
