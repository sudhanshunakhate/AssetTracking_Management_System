"""Generate JPA entity classes from caits_local column metadata."""
from __future__ import annotations

from collections import defaultdict
from pathlib import Path

TSV = Path(__file__).with_name("db_columns.tsv")
OUT_DIR = Path(__file__).resolve().parents[1] / "backend/src/main/java/com/caits/domain/entity"

TYPE_MAP = {
    "integer": "Integer",
    "bigint": "Long",
    "smallint": "Integer",
    "boolean": "Boolean",
    "character varying": "String",
    "character": "String",
    "text": "String",
    "date": "LocalDate",
    "timestamp without time zone": "LocalDateTime",
    "timestamp with time zone": "LocalDateTime",
    "numeric": "BigDecimal",
    "double precision": "Double",
    "real": "Float",
}


def snake_to_camel(name: str, cap: bool = False) -> str:
    parts = name.split("_")
    # strip table prefix like unt_, cat_ for nicer Java names? Keep full DB names mapped via @Column
    # Convert column snake to camel entirely
    camel = parts[0] + "".join(p.title() for p in parts[1:])
    if cap:
        return camel[0].upper() + camel[1:]
    return camel


def table_to_class(table: str) -> str:
    # unit_mst -> UnitMst
    return "".join(p.title() for p in table.split("_"))


def java_type(data_type: str, maxlen: str) -> str:
    base = TYPE_MAP.get(data_type, "String")
    return base


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    tables: dict[str, list[dict]] = defaultdict(list)
    lines = TSV.read_text(encoding="utf-8").splitlines()
    for line in lines[1:]:
        if not line.strip() or line.startswith("("):
            continue
        parts = line.split("\t")
        if len(parts) < 5:
            continue
        table, col, dtype, maxlen, nullable = parts[:5]
        if table == "table_name":
            continue
        tables[table].append(
            {
                "column": col,
                "dtype": dtype,
                "maxlen": maxlen,
                "nullable": nullable == "YES",
            }
        )

    for table, cols in sorted(tables.items()):
        class_name = table_to_class(table)
        imports = {
            "jakarta.persistence.*",
            "java.time.LocalDateTime",
        }
        needs_date = any(c["dtype"] == "date" for c in cols)
        needs_bd = any(c["dtype"] == "numeric" for c in cols)
        if needs_date:
            imports.add("java.time.LocalDate")
        if needs_bd:
            imports.add("java.math.BigDecimal")

        # Find PK: first column ending with _id that is NOT nullable typically identity
        pk = cols[0]["column"]

        body = []
        body.append(f"@Entity")
        body.append(f'@Table(name = "{table}", schema = "caits_local")')
        body.append(f"public class {class_name} {{")
        body.append("")

        for c in cols:
            jt = java_type(c["dtype"], c["maxlen"])
            field = snake_to_camel(c["column"])
            if c["column"] == pk:
                body.append("    @Id")
                body.append("    @GeneratedValue(strategy = GenerationType.IDENTITY)")
            body.append(f'    @Column(name = "{c["column"]}"' + (", nullable = false" if not c["nullable"] else "") + ")")
            body.append(f"    private {jt} {field};")
            body.append("")

        # getters/setters
        for c in cols:
            jt = java_type(c["dtype"], c["maxlen"])
            field = snake_to_camel(c["column"])
            prop = field[0].upper() + field[1:]
            body.append(f"    public {jt} get{prop}() {{ return {field}; }}")
            body.append(f"    public void set{prop}({jt} {field}) {{ this.{field} = {field}; }}")
            body.append("")

        body.append("}")

        content = "package com.caits.domain.entity;\n\n"
        for imp in sorted(imports):
            if imp.startswith("java") or imp.startswith("jakarta"):
                content += f"import {imp};\n"
        content += "\n" + "\n".join(body) + "\n"

        out = OUT_DIR / f"{class_name}.java"
        out.write_text(content, encoding="utf-8")
        print(f"Wrote {out.name} ({len(cols)} cols)")

    print(f"Generated {len(tables)} entities into {OUT_DIR}")


if __name__ == "__main__":
    main()
