"""Generate master CRUD modules from a resource registry aligned to API docs + DB entities."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "backend/src/main/java/com/caits/modules/masters"
ROOT.mkdir(parents=True, exist_ok=True)

# Each master resource:
# path, classPrefix, entity, repo, idField (entity), codeField (entity),
# searchFields (entity), dtoId, dtoCode, dtoName, nameField (entity),
# descField optional, extra list filters, softActiveField
MASTERS = [
    {
        "path": "units",
        "name": "Unit",
        "entity": "UnitMst",
        "id": "untUnitId",
        "code": "untUnitCode",
        "label": "untUnitName",
        "desc": "untDesc",
        "active": "untIsactive",
        "createdBy": "untCreatedBy",
        "createdOn": "untCreatedOn",
        "modifiedBy": "untModifiedBy",
        "modifiedOn": "untModifiedOn",
        "dtoId": "unitId",
        "dtoCode": "unitCode",
        "dtoName": "unitName",
        "search": ["untUnitCode", "untUnitName"],
        "extraReq": [],
        "extraRes": [],
    },
    {
        "path": "categories",
        "name": "Category",
        "entity": "CategoryMst",
        "id": "catCategoryId",
        "code": "catCategoryCode",
        "label": "catCategoryName",
        "desc": "catDesc",
        "active": "catIsactive",
        "createdBy": "catCreatedBy",
        "createdOn": "catCreatedOn",
        "modifiedBy": "catModifiedBy",
        "modifiedOn": "catModifiedOn",
        "dtoId": "categoryId",
        "dtoCode": "categoryCode",
        "dtoName": "categoryName",
        "search": ["catCategoryCode", "catCategoryName"],
        "extraReq": [],
        "extraRes": [],
    },
    {
        "path": "subcategories",
        "name": "SubCategory",
        "entity": "SubcategoryMst",
        "id": "scatSubcategoryId",
        "code": "scatSubcategoryCode",
        "label": "scatSubcategoryName",
        "desc": "scatDesc",
        "active": "scatIsactive",
        "createdBy": "scatCreatedBy",
        "createdOn": "scatCreatedOn",
        "modifiedBy": "scatModifiedBy",
        "modifiedOn": "scatModifiedOn",
        "dtoId": "subcategoryId",
        "dtoCode": "subcategoryCode",
        "dtoName": "subcategoryName",
        "search": ["scatSubcategoryCode", "scatSubcategoryName"],
        "extraReq": [("categoryId", "Integer", "scatCategoryIdCat")],
        "extraRes": [("categoryId", "Integer", "scatCategoryIdCat")],
        "filterExtras": [("categoryId", "scatCategoryIdCat")],
    },
    {
        "path": "general-types",
        "name": "GeneralType",
        "entity": "GentypeMst",
        "id": "gtypGentypeId",
        "code": "gtypTypeCode",
        "label": "gtypTypeName",
        "desc": "gtypDesc",
        "active": "gtypIsactive",
        "createdBy": "gtypCreatedBy",
        "createdOn": "gtypCreatedOn",
        "modifiedBy": "gtypModifiedBy",
        "modifiedOn": "gtypModifiedOn",
        "dtoId": "gentypeId",
        "dtoCode": "typeCode",
        "dtoName": "typeName",
        "search": ["gtypTypeCode", "gtypTypeName"],
        "extraReq": [],
        "extraRes": [],
    },
    {
        "path": "general-masters",
        "name": "GeneralMaster",
        "entity": "GenmasterMst",
        "id": "gmstGenmasterId",
        "code": "gmstValueCode",
        "label": "gmstValueName",
        "desc": "gmstDesc",
        "active": "gmstIsactive",
        "createdBy": "gmstCreatedBy",
        "createdOn": "gmstCreatedOn",
        "modifiedBy": "gmstModifiedBy",
        "modifiedOn": "gmstModifiedOn",
        "dtoId": "genmasterId",
        "dtoCode": "valueCode",
        "dtoName": "valueName",
        "search": ["gmstValueCode", "gmstValueName"],
        "extraReq": [("gentypeId", "Integer", "gmstGentypeIdGtyp"), ("sortOrder", "Integer", "gmstSortOrder")],
        "extraRes": [("gentypeId", "Integer", "gmstGentypeIdGtyp"), ("sortOrder", "Integer", "gmstSortOrder")],
        "filterExtras": [("gentypeId", "gmstGentypeIdGtyp")],
    },
]


def cap(s: str) -> str:
    return s[0].upper() + s[1:]


def gen_simple(m: dict) -> str:
    name = m["name"]
    entity = m["entity"]
    path = m["path"]
    extras_req = m.get("extraReq", [])
    extras_res = m.get("extraRes", [])
    filters = m.get("filterExtras", [])

    req_fields = [
        f"String {m['dtoCode']}",
        f"String {m['dtoName']}",
        "String desc",
        "Boolean isActive",
    ] + [f"{t} {n}" for n, t, _ in extras_req]

    res_fields = [
        f"Integer {m['dtoId']}",
        f"String {m['dtoCode']}",
        f"String {m['dtoName']}",
        "String desc",
        "Boolean isActive",
    ] + [f"{t} {n}" for n, t, _ in extras_res] + [
        "String createdBy",
        "java.time.LocalDateTime createdOn",
        "String modifiedBy",
        "java.time.LocalDateTime modifiedOn",
        "String message",
    ]

    filter_params = "".join(
        f', @RequestParam(required = false) Integer {n}' for n, _ in filters
    )
    filter_pass = "".join(f", {n}" for n, _ in filters)

    # toDto setters for extras
    extra_get = "".join(f", e.get{cap(ef)}()" for _, _, ef in extras_res)
    extra_set = ""
    for n, _, ef in extras_req:
        extra_set += f"        if (req.{n}() != null) e.set{cap(ef)}(req.{n}());\n"

    search_preds = " || ".join(
        f'cb.like(cb.lower(root.get("{f}")), like)' for f in m["search"]
    )

    filter_preds = ""
    for n, ef in filters:
        filter_preds += f"""
            if ({n} != null) {{
                preds.add(cb.equal(root.get("{ef}"), {n}));
            }}
"""

    method_filter_args = "".join(f", Integer {n}" for n, _ in filters)

    return f'''package com.caits.modules.masters;

import com.caits.common.ApiException;
import com.caits.common.MessageResponse;
import com.caits.common.PageResponse;
import com.caits.domain.entity.{entity};
import com.caits.domain.repository.{entity}Repository;
import com.caits.security.SecurityUtils;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/{path}")
public class {name}Controller {{

    private final {entity}Repository repo;

    public {name}Controller({entity}Repository repo) {{
        this.repo = repo;
    }}

    public record {name}Request({", ".join(req_fields)}) {{}}

    public record {name}Response({", ".join(res_fields)}) {{}}

    @GetMapping
    public PageResponse<{name}Response> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive{filter_params}
    ) {{
        return searchPage(page, pageSize, search, isActive{filter_pass});
    }}

    @GetMapping("/{{id}}")
    public {name}Response get(@PathVariable Integer id) {{
        return toDto(require(id), null);
    }}

    @PostMapping
    public ResponseEntity<{name}Response> create(@RequestBody {name}Request req) {{
        validate(req);
        String code = req.{m['dtoCode']}().trim().toUpperCase();
        if (repo.findAll((root, q, cb) -> cb.equal(cb.upper(root.get("{m['code']}")), code)).stream().findAny().isPresent()) {{
            throw ApiException.conflict("Duplicate code: " + code);
        }}
        {entity} e = new {entity}();
        apply(e, req, code);
        e.set{cap(m['createdBy'])}(SecurityUtils.loginIdOrSystem());
        e.set{cap(m['createdOn'])}(LocalDateTime.now());
        e = repo.save(e);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(e, "{name} created successfully"));
    }}

    @PutMapping("/{{id}}")
    public {name}Response update(@PathVariable Integer id, @RequestBody {name}Request req) {{
        validate(req);
        {entity} e = require(id);
        String code = req.{m['dtoCode']}().trim().toUpperCase();
        boolean dup = repo.findAll((root, q, cb) -> cb.equal(cb.upper(root.get("{m['code']}")), code)).stream()
                .anyMatch(x -> !x.get{cap(m['id'])}().equals(id));
        if (dup) throw ApiException.conflict("Duplicate code: " + code);
        apply(e, req, code);
        e.set{cap(m['modifiedBy'])}(SecurityUtils.loginIdOrSystem());
        e.set{cap(m['modifiedOn'])}(LocalDateTime.now());
        return toDto(repo.save(e), "{name} updated successfully");
    }}

    @DeleteMapping("/{{id}}")
    public MessageResponse delete(@PathVariable Integer id) {{
        {entity} e = require(id);
        e.set{cap(m['active'])}(false);
        e.set{cap(m['modifiedBy'])}(SecurityUtils.loginIdOrSystem());
        e.set{cap(m['modifiedOn'])}(LocalDateTime.now());
        repo.save(e);
        return MessageResponse.of("{name} deactivated successfully");
    }}

    private PageResponse<{name}Response> searchPage(int page, int pageSize, String search, Boolean isActive{method_filter_args}) {{
        int p = Math.max(page, 1);
        int size = Math.min(Math.max(pageSize, 1), 200);
        Specification<{entity}> spec = (root, query, cb) -> {{
            List<Predicate> preds = new ArrayList<>();
            if (isActive != null) preds.add(cb.equal(root.get("{m['active']}"), isActive));
            if (search != null && !search.isBlank()) {{
                String like = "%" + search.trim().toLowerCase() + "%";
                preds.add(cb.or({search_preds}));
            }}
{filter_preds}
            return preds.isEmpty() ? cb.conjunction() : cb.and(preds.toArray(Predicate[]::new));
        }};
        Page<{entity}> result = repo.findAll(spec, PageRequest.of(p - 1, size));
        return PageResponse.of(p, size, result.getTotalElements(), result.getContent().stream().map(e -> toDto(e, null)).toList());
    }}

    private {entity} require(Integer id) {{
        return repo.findById(id).orElseThrow(() -> ApiException.notFound("{name} not found"));
    }}

    private void validate({name}Request req) {{
        if (req.{m['dtoCode']}() == null || req.{m['dtoCode']}().isBlank()) throw ApiException.badRequest("code is required");
        if (req.{m['dtoName']}() == null || req.{m['dtoName']}().isBlank()) throw ApiException.badRequest("name is required");
    }}

    private void apply({entity} e, {name}Request req, String code) {{
        e.set{cap(m['code'])}(code);
        e.set{cap(m['label'])}(req.{m['dtoName']}().trim());
        e.set{cap(m['desc'])}(req.desc());
        e.set{cap(m['active'])}(req.isActive() == null || req.isActive());
{extra_set}    }}

    private {name}Response toDto({entity} e, String message) {{
        return new {name}Response(
                e.get{cap(m['id'])}(),
                e.get{cap(m['code'])}(),
                e.get{cap(m['label'])}(),
                e.get{cap(m['desc'])}(),
                e.get{cap(m['active'])}(){extra_get},
                e.get{cap(m['createdBy'])}(),
                e.get{cap(m['createdOn'])}(),
                e.get{cap(m['modifiedBy'])}(),
                e.get{cap(m['modifiedOn'])}(),
                message
        );
    }}
}}
'''


def main():
    for m in MASTERS:
        content = gen_simple(m)
        out = ROOT / f"{m['name']}Controller.java"
        out.write_text(content, encoding="utf-8")
        print("wrote", out.name)


if __name__ == "__main__":
    main()
