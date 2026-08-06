package com.caits.modules.reports;

import com.caits.common.PageResponse;
import com.caits.domain.entity.HrcEmployeeMst;
import com.caits.domain.entity.InvItemMst;
import com.caits.domain.entity.InvStockMst;
import com.caits.domain.entity.OrgLocationMst;
import com.caits.domain.entity.TxnDetailDtl;
import com.caits.domain.entity.TxnHeaderMst;
import com.caits.domain.repository.HrcEmployeeMstRepository;
import com.caits.domain.repository.InvItemMstRepository;
import com.caits.domain.repository.InvStockMstRepository;
import com.caits.domain.repository.OrgLocationMstRepository;
import com.caits.domain.repository.TxnDetailDtlRepository;
import com.caits.domain.repository.TxnHeaderMstRepository;
import com.caits.security.AccessScopeService;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportsController {

    private static final Set<String> MOVEMENT_DOC_TYPES = Set.of(
            "OPENING_STOCK",
            "GRN",
            "GATEPASS_INWARD",
            "GATEPASS_OUTWARD",
            "MATERIAL_ISSUE",
            "MATERIAL_TRANSFER",
            "MATERIAL_RETURN"
    );

    private final InvStockMstRepository stockRepo;
    private final InvItemMstRepository itemRepo;
    private final TxnHeaderMstRepository headerRepo;
    private final TxnDetailDtlRepository detailRepo;
    private final AccessScopeService accessScope;
    private final OrgLocationMstRepository locationRepo;
    private final HrcEmployeeMstRepository employeeRepo;

    public ReportsController(
            InvStockMstRepository stockRepo,
            InvItemMstRepository itemRepo,
            TxnHeaderMstRepository headerRepo,
            TxnDetailDtlRepository detailRepo,
            AccessScopeService accessScope,
            OrgLocationMstRepository locationRepo,
            HrcEmployeeMstRepository employeeRepo
    ) {
        this.stockRepo = stockRepo;
        this.itemRepo = itemRepo;
        this.headerRepo = headerRepo;
        this.detailRepo = detailRepo;
        this.accessScope = accessScope;
        this.locationRepo = locationRepo;
        this.employeeRepo = employeeRepo;
    }

    @GetMapping("/stock-register")
    public PageResponse<Map<String, Object>> stockRegister(
            @RequestParam(required = false) Integer locationId,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize
    ) {
        List<Integer> locFilter = accessScope.resolveLocationFilter(locationId);
        List<InvStockMst> stocks = stockRepo.findAll((root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            preds.add(cb.isTrue(root.get("stkIsactive")));
            if (locFilter != null) {
                preds.add(locFilter.isEmpty() ? cb.disjunction() : root.get("stkLocationIdLoc").in(locFilter));
            }
            return cb.and(preds.toArray(Predicate[]::new));
        });

        Map<Integer, InvItemMst> items = itemMap();
        List<Map<String, Object>> rows = new ArrayList<>();
        for (InvStockMst s : stocks) {
            InvItemMst item = items.get(s.getStkItemIdItm());
            if (item == null) continue;
            if (categoryId != null && !categoryId.equals(item.getItmCategoryIdCat())) continue;
            if (!matchesItemSearch(item, search)) continue;

            BigDecimal current = nz(s.getStkCurrentQty());
            BigDecimal reorder = nz(s.getStkReorderLevel());
            String status = stockStatus(current, reorder);

            Map<String, Object> row = new HashMap<>();
            row.put("id", s.getStkStockId());
            row.put("itemId", item.getItmItemId());
            row.put("itemCode", item.getItmItemCode());
            row.put("itemName", item.getItmItemName());
            row.put("categoryId", item.getItmCategoryIdCat());
            row.put("uomId", s.getStkUomIdUnt());
            row.put("locationId", s.getStkLocationIdLoc());
            row.put("opening", s.getStkOpeningQty());
            row.put("inward", s.getStkInwardQty());
            row.put("outward", s.getStkIssuedQty());
            row.put("closing", current);
            row.put("reorderLevel", reorder);
            row.put("value", s.getStkStockValue());
            row.put("status", status);
            rows.add(row);
        }
        return pageOf(rows, page, pageSize);
    }

    /**
     * Store-centric ownership of current stock, with employee custody detail.
     * Primary owner = store holding the qty; employee = assigned asset holder
     * and/or last issue handover recipient.
     */
    @GetMapping("/stock-owner")
    public PageResponse<Map<String, Object>> stockOwner(
            @RequestParam(required = false) Integer locationId,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Integer employeeId,
            @RequestParam(required = false) String custody,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize
    ) {
        List<Integer> locFilter = accessScope.resolveLocationFilter(locationId);
        List<InvStockMst> stocks = stockRepo.findAll((root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            preds.add(cb.isTrue(root.get("stkIsactive")));
            if (locFilter != null) {
                preds.add(locFilter.isEmpty() ? cb.disjunction() : root.get("stkLocationIdLoc").in(locFilter));
            }
            return cb.and(preds.toArray(Predicate[]::new));
        });

        Map<Integer, InvItemMst> items = itemMap();
        Map<Integer, OrgLocationMst> locations = locationMap();
        Map<Integer, HrcEmployeeMst> employees = employeeMap();
        Map<String, IssueCustody> lastIssue = latestIssueCustody();

        List<Map<String, Object>> rows = new ArrayList<>();
        for (InvStockMst s : stocks) {
            InvItemMst item = items.get(s.getStkItemIdItm());
            if (item == null) continue;
            if (categoryId != null && !categoryId.equals(item.getItmCategoryIdCat())) continue;
            if (!matchesItemSearch(item, search)) continue;

            OrgLocationMst store = locations.get(s.getStkLocationIdLoc());
            IssueCustody issued = lastIssue.get(custodyKey(s.getStkItemIdItm(), s.getStkLocationIdLoc()));

            Integer custodianEmpId = issued != null ? issued.empId : null;
            String custodyMode = issued != null && issued.empId != null ? "ISSUED_TO" : "IN_STORE";

            if (employeeId != null && !employeeId.equals(custodianEmpId)
                    && !employeeId.equals(store == null ? null : store.getLocManagerEmpIdEmp())) {
                continue;
            }
            if (custody != null && !custody.isBlank() && !custody.equalsIgnoreCase(custodyMode)) {
                continue;
            }

            BigDecimal current = nz(s.getStkCurrentQty());
            BigDecimal available = s.getStkAvailableQty() != null ? s.getStkAvailableQty() : current;
            BigDecimal reserved = nz(s.getStkReservedQty());
            HrcEmployeeMst custodian = custodianEmpId == null ? null : employees.get(custodianEmpId);
            HrcEmployeeMst manager = store == null || store.getLocManagerEmpIdEmp() == null
                    ? null : employees.get(store.getLocManagerEmpIdEmp());

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", s.getStkStockId());
            row.put("locationId", s.getStkLocationIdLoc());
            row.put("storeCode", store == null ? null : store.getLocLocationCode());
            row.put("storeName", store == null ? null : store.getLocLocationName());
            row.put("storeType", store == null ? null : store.getLocLocationType());
            row.put("storeManagerId", store == null ? null : store.getLocManagerEmpIdEmp());
            row.put("storeManager", empLabel(manager));
            row.put("itemId", item.getItmItemId());
            row.put("itemCode", item.getItmItemCode());
            row.put("itemName", item.getItmItemName());
            row.put("itemType", item.getItmItemType());
            row.put("categoryId", item.getItmCategoryIdCat());
            row.put("uomId", s.getStkUomIdUnt());
            row.put("batchLotNo", s.getStkBatchLotNo());
            row.put("bin", s.getStkLocationBin());
            row.put("currentQty", current);
            row.put("availableQty", available);
            row.put("reservedQty", reserved);
            row.put("issuedQty", s.getStkIssuedQty());
            row.put("value", s.getStkStockValue());
            row.put("custodyMode", custodyMode);
            row.put("custodianEmpId", custodianEmpId);
            row.put("custodian", empLabel(custodian));
            row.put("custodianDept", custodian == null ? null : custodian.getEmpDepartment());
            row.put("custodianDesignation", custodian == null ? null : custodian.getEmpDesignation());
            row.put("lastIssueDocNo", issued == null ? null : issued.docNo);
            row.put("lastIssueDate", issued == null ? null : issued.docDate);
            row.put("lastTxnDate", s.getStkLastTransactionDate());
            row.put("status", stockStatus(current, nz(s.getStkReorderLevel())));
            rows.add(row);
        }

        rows.sort(Comparator
                .comparing((Map<String, Object> r) -> String.valueOf(r.getOrDefault("storeCode", "")))
                .thenComparing(r -> String.valueOf(r.getOrDefault("itemCode", ""))));
        return pageOf(rows, page, pageSize);
    }

    /**
     * Stock-affecting document movements (in / out / transfer) over a period.
     */
    @GetMapping("/stock-movement")
    public PageResponse<Map<String, Object>> stockMovement(
            @RequestParam(required = false) String docType,
            @RequestParam(required = false) String direction,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false) Integer locationId,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize
    ) {
        List<Integer> locFilter = accessScope.resolveLocationFilter(locationId);
        var headers = headerRepo.findAll((root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            preds.add(root.get("txhDocType").in(MOVEMENT_DOC_TYPES));
            if (docType != null && !docType.isBlank()) {
                preds.add(cb.equal(root.get("txhDocType"), docType));
            }
            if (fromDate != null) preds.add(cb.greaterThanOrEqualTo(root.get("txhDocDate"), fromDate));
            if (toDate != null) preds.add(cb.lessThanOrEqualTo(root.get("txhDocDate"), toDate));
            if (locFilter != null) {
                if (locFilter.isEmpty()) {
                    preds.add(cb.disjunction());
                } else {
                    preds.add(cb.or(
                            root.get("txhLocationIdLoc").in(locFilter),
                            root.get("txhFromLocationIdLoc").in(locFilter),
                            root.get("txhToLocationIdLoc").in(locFilter)
                    ));
                }
            }
            return cb.and(preds.toArray(Predicate[]::new));
        }, PageRequest.of(0, 800, Sort.by(Sort.Direction.DESC, "txhDocDate", "txhTxnHeaderId"))).getContent();

        Map<Integer, InvItemMst> items = itemMap();
        Map<Integer, OrgLocationMst> locations = locationMap();
        Map<Integer, HrcEmployeeMst> employees = employeeMap();

        List<Map<String, Object>> rows = new ArrayList<>();
        for (TxnHeaderMst h : headers) {
            if (!isMovementEligibleStatus(h.getTxhStatus())) continue;
            String dir = movementDirection(h.getTxhDocType());
            if (direction != null && !direction.isBlank() && !direction.equalsIgnoreCase(dir)) continue;

            Integer fromLoc = h.getTxhFromLocationIdLoc() != null
                    ? h.getTxhFromLocationIdLoc()
                    : ("OUT".equals(dir) || "TRANSFER".equals(dir) ? h.getTxhLocationIdLoc() : null);
            Integer toLoc = h.getTxhToLocationIdLoc() != null
                    ? h.getTxhToLocationIdLoc()
                    : ("IN".equals(dir) ? h.getTxhLocationIdLoc() : null);

            List<TxnDetailDtl> lines = detailRepo.findByTxdTxnHeaderIdTxhOrderByTxdSrNoAsc(h.getTxhTxnHeaderId());
            for (TxnDetailDtl d : lines) {
                InvItemMst item = items.get(d.getTxdItemIdItm());
                if (categoryId != null && (item == null || !categoryId.equals(item.getItmCategoryIdCat()))) continue;
                if (item != null && !matchesItemSearch(item, search)) continue;
                if (search != null && !search.isBlank() && item == null) {
                    if (!String.valueOf(h.getTxhDocNo()).toLowerCase().contains(search.toLowerCase())) continue;
                }

                BigDecimal qty = d.getTxdQty() != null ? d.getTxdQty() : d.getTxdAcceptedQty();
                Integer empId = h.getTxhHandedOverToEmpIdEmp() != null
                        ? h.getTxhHandedOverToEmpIdEmp()
                        : h.getTxhInitiatedByEmpIdEmp();
                HrcEmployeeMst emp = empId == null ? null : employees.get(empId);
                OrgLocationMst from = fromLoc == null ? null : locations.get(fromLoc);
                OrgLocationMst to = toLoc == null ? null : locations.get(toLoc);

                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", d.getTxdTxnDetailId());
                row.put("date", h.getTxhDocDate());
                row.put("docType", h.getTxhDocType());
                row.put("docNo", h.getTxhDocNo());
                row.put("direction", dir);
                row.put("status", h.getTxhStatus());
                row.put("itemId", d.getTxdItemIdItm());
                row.put("itemCode", item == null ? null : item.getItmItemCode());
                row.put("itemName", item == null ? null : item.getItmItemName());
                row.put("categoryId", item == null ? null : item.getItmCategoryIdCat());
                row.put("qty", qty);
                row.put("uomId", d.getTxdUomIdUnt());
                row.put("fromLocationId", fromLoc);
                row.put("fromStore", from == null ? null : from.getLocLocationCode());
                row.put("toLocationId", toLoc);
                row.put("toStore", to == null ? null : to.getLocLocationCode());
                row.put("departmentId", h.getTxhDepartmentIdGmst());
                row.put("employeeId", empId);
                row.put("employee", empLabel(emp));
                row.put("partyId", h.getTxhPartyIdVnd());
                row.put("value", d.getTxdAmount());
                row.put("serialNo", d.getTxdSerialNo());
                row.put("batchLotNo", d.getTxdBatchLotNo());
                rows.add(row);
            }
        }
        return pageOf(rows, page, pageSize);
    }

    /**
     * Item master catalog register with optional across-store stock totals.
     */
    @GetMapping("/item-register")
    public PageResponse<Map<String, Object>> itemRegister(
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Integer subcategoryId,
            @RequestParam(required = false) String itemType,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize
    ) {
        List<InvItemMst> allItems = itemRepo.findAll((root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            if (Boolean.TRUE.equals(active)) preds.add(cb.isTrue(root.get("itmIsactive")));
            if (Boolean.FALSE.equals(active)) preds.add(cb.isFalse(root.get("itmIsactive")));
            if (categoryId != null) preds.add(cb.equal(root.get("itmCategoryIdCat"), categoryId));
            if (subcategoryId != null) preds.add(cb.equal(root.get("itmSubcategoryIdScat"), subcategoryId));
            if (itemType != null && !itemType.isBlank()) preds.add(cb.equal(root.get("itmItemType"), itemType));
            return preds.isEmpty() ? cb.conjunction() : cb.and(preds.toArray(Predicate[]::new));
        });

        Map<Integer, OrgLocationMst> locations = locationMap();

        // Aggregate stock across stores (access-scoped).
        List<Integer> locFilter = accessScope.resolveLocationFilter(null);
        Map<Integer, StockAgg> stockByItem = new HashMap<>();
        List<InvStockMst> stocks = stockRepo.findAll((root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            preds.add(cb.isTrue(root.get("stkIsactive")));
            if (locFilter != null) {
                preds.add(locFilter.isEmpty() ? cb.disjunction() : root.get("stkLocationIdLoc").in(locFilter));
            }
            return cb.and(preds.toArray(Predicate[]::new));
        });
        for (InvStockMst s : stocks) {
            StockAgg agg = stockByItem.computeIfAbsent(s.getStkItemIdItm(), id -> new StockAgg());
            agg.qty = agg.qty.add(nz(s.getStkCurrentQty()));
            agg.value = agg.value.add(nz(s.getStkStockValue()));
            agg.storeCount++;
        }

        List<Map<String, Object>> rows = new ArrayList<>();
        for (InvItemMst item : allItems) {
            if (!matchesItemSearch(item, search)) continue;
            StockAgg agg = stockByItem.getOrDefault(item.getItmItemId(), StockAgg.ZERO);
            OrgLocationMst curLoc = item.getItmCurrentLocationIdLoc() == null
                    ? null : locations.get(item.getItmCurrentLocationIdLoc());

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", item.getItmItemId());
            row.put("itemCode", item.getItmItemCode());
            row.put("itemName", item.getItmItemName());
            row.put("itemType", item.getItmItemType());
            row.put("categoryId", item.getItmCategoryIdCat());
            row.put("subcategoryId", item.getItmSubcategoryIdScat());
            row.put("uomId", item.getItmUomIdUnt());
            row.put("makeBrand", item.getItmMakeBrand());
            row.put("model", item.getItmModel());
            row.put("isSerialized", Boolean.TRUE.equals(item.getItmIsSerialized()));
            row.put("trackBatchLot", Boolean.TRUE.equals(item.getItmTrackBatchLot()));
            row.put("trackExpiry", Boolean.TRUE.equals(item.getItmTrackExpiry()));
            row.put("isConsumable", Boolean.TRUE.equals(item.getItmIsConsumable()));
            row.put("standardCost", item.getItmStandardCost());
            row.put("currentLocationId", item.getItmCurrentLocationIdLoc());
            row.put("currentStore", curLoc == null ? null : curLoc.getLocLocationCode());
            row.put("totalStockQty", agg.qty);
            row.put("totalStockValue", agg.value);
            row.put("storeCount", agg.storeCount);
            row.put("active", Boolean.TRUE.equals(item.getItmIsactive()));
            rows.add(row);
        }

        rows.sort(Comparator.comparing(r -> String.valueOf(r.getOrDefault("itemCode", ""))));
        return pageOf(rows, page, pageSize);
    }

    @GetMapping("/full-report")
    public PageResponse<Map<String, Object>> fullReport(
            @RequestParam(required = false) String docType,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false) Integer locationId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize
    ) {
        List<Integer> locFilter = accessScope.resolveLocationFilter(locationId);
        var headers = headerRepo.findAll((root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            if (docType != null && !docType.isBlank()) {
                preds.add(cb.equal(root.get("txhDocType"), docType));
            }
            if (fromDate != null) preds.add(cb.greaterThanOrEqualTo(root.get("txhDocDate"), fromDate));
            if (toDate != null) preds.add(cb.lessThanOrEqualTo(root.get("txhDocDate"), toDate));
            if (locFilter != null) {
                if (locFilter.isEmpty()) {
                    preds.add(cb.disjunction());
                } else {
                    preds.add(cb.or(
                            root.get("txhLocationIdLoc").in(locFilter),
                            root.get("txhFromLocationIdLoc").in(locFilter),
                            root.get("txhToLocationIdLoc").in(locFilter)
                    ));
                }
            }
            return preds.isEmpty() ? cb.conjunction() : cb.and(preds.toArray(Predicate[]::new));
        }, PageRequest.of(0, 500)).getContent();

        Map<Integer, InvItemMst> items = itemMap();
        List<Map<String, Object>> rows = new ArrayList<>();
        for (TxnHeaderMst h : headers) {
            List<TxnDetailDtl> lines = detailRepo.findByTxdTxnHeaderIdTxhOrderByTxdSrNoAsc(h.getTxhTxnHeaderId());
            for (TxnDetailDtl d : lines) {
                InvItemMst item = items.get(d.getTxdItemIdItm());
                Map<String, Object> row = new HashMap<>();
                row.put("id", d.getTxdTxnDetailId());
                row.put("date", h.getTxhDocDate());
                row.put("txnType", h.getTxhDocType());
                row.put("txnNo", h.getTxhDocNo());
                row.put("itemId", d.getTxdItemIdItm());
                row.put("item", item == null ? null : item.getItmItemName());
                row.put("categoryId", item == null ? null : item.getItmCategoryIdCat());
                row.put("qty", d.getTxdQty() != null ? d.getTxdQty() : d.getTxdAcceptedQty());
                row.put("uomId", d.getTxdUomIdUnt());
                row.put("fromLocationId", h.getTxhFromLocationIdLoc());
                row.put("toLocationId", h.getTxhToLocationIdLoc() != null ? h.getTxhToLocationIdLoc() : h.getTxhLocationIdLoc());
                row.put("entityId", h.getTxhEntityIdEnt());
                row.put("employeeId", h.getTxhInitiatedByEmpIdEmp());
                row.put("status", h.getTxhStatus());
                row.put("value", d.getTxdAmount());
                rows.add(row);
            }
        }
        return pageOf(rows, page, pageSize);
    }

    // --- helpers ---

    private Map<Integer, InvItemMst> itemMap() {
        Map<Integer, InvItemMst> items = new HashMap<>();
        itemRepo.findAll().forEach(i -> items.put(i.getItmItemId(), i));
        return items;
    }

    private Map<Integer, OrgLocationMst> locationMap() {
        Map<Integer, OrgLocationMst> map = new HashMap<>();
        locationRepo.findAll().forEach(l -> map.put(l.getLocLocationId(), l));
        return map;
    }

    private Map<Integer, HrcEmployeeMst> employeeMap() {
        Map<Integer, HrcEmployeeMst> map = new HashMap<>();
        employeeRepo.findAll().forEach(e -> map.put(e.getEmpEmployeeId(), e));
        return map;
    }

    private Map<String, IssueCustody> latestIssueCustody() {
        var headers = headerRepo.findAll((root, query, cb) -> cb.and(
                cb.equal(root.get("txhDocType"), "MATERIAL_ISSUE"),
                cb.notLike(cb.lower(root.get("txhStatus")), "%draft%"),
                cb.notLike(cb.lower(root.get("txhStatus")), "%reject%"),
                cb.notLike(cb.lower(root.get("txhStatus")), "%cancel%")
        ), PageRequest.of(0, 1000, Sort.by(Sort.Direction.DESC, "txhDocDate", "txhTxnHeaderId"))).getContent();

        Map<String, IssueCustody> latest = new HashMap<>();
        for (TxnHeaderMst h : headers) {
            Integer empId = h.getTxhHandedOverToEmpIdEmp() != null
                    ? h.getTxhHandedOverToEmpIdEmp()
                    : h.getTxhInitiatedByEmpIdEmp();
            Integer locId = h.getTxhFromLocationIdLoc() != null
                    ? h.getTxhFromLocationIdLoc()
                    : h.getTxhLocationIdLoc();
            if (locId == null) continue;
            List<TxnDetailDtl> lines = detailRepo.findByTxdTxnHeaderIdTxhOrderByTxdSrNoAsc(h.getTxhTxnHeaderId());
            for (TxnDetailDtl d : lines) {
                if (d.getTxdItemIdItm() == null) continue;
                String key = custodyKey(d.getTxdItemIdItm(), locId);
                latest.putIfAbsent(key, new IssueCustody(empId, h.getTxhDocNo(), h.getTxhDocDate()));
            }
        }
        return latest;
    }

    private static String custodyKey(Integer itemId, Integer locationId) {
        return itemId + "|" + locationId;
    }

    private static String movementDirection(String docType) {
        if (docType == null) return "IN";
        return switch (docType) {
            case "MATERIAL_ISSUE", "GATEPASS_OUTWARD" -> "OUT";
            case "MATERIAL_TRANSFER" -> "TRANSFER";
            default -> "IN";
        };
    }

    private static boolean isMovementEligibleStatus(String status) {
        if (status == null || status.isBlank()) return true;
        String s = status.toLowerCase();
        return !s.contains("draft") && !s.contains("reject") && !s.contains("cancel");
    }

    private static boolean matchesItemSearch(InvItemMst item, String search) {
        if (search == null || search.isBlank()) return true;
        String q = search.toLowerCase();
        String code = item.getItmItemCode() == null ? "" : item.getItmItemCode().toLowerCase();
        String name = item.getItmItemName() == null ? "" : item.getItmItemName().toLowerCase();
        return code.contains(q) || name.contains(q);
    }

    private static String stockStatus(BigDecimal current, BigDecimal reorder) {
        if (current.compareTo(BigDecimal.ZERO) <= 0) return "Out of Stock";
        if (reorder.compareTo(BigDecimal.ZERO) > 0 && current.compareTo(reorder) <= 0) return "Low Stock";
        return "In Stock";
    }

    private static String empLabel(HrcEmployeeMst e) {
        if (e == null) return null;
        String last = e.getEmpLastName() == null ? "" : e.getEmpLastName().trim();
        String name = (e.getEmpFirstName() + (last.isEmpty() ? "" : " " + last)).trim();
        if (e.getEmpEmployeeCode() != null && !e.getEmpEmployeeCode().isBlank()) {
            return name + " (" + e.getEmpEmployeeCode() + ")";
        }
        return name;
    }

    private static BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    private static PageResponse<Map<String, Object>> pageOf(List<Map<String, Object>> rows, int page, int pageSize) {
        int p = Math.max(page, 1);
        int size = Math.min(Math.max(pageSize, 1), 200);
        int from = Math.min((p - 1) * size, rows.size());
        int to = Math.min(from + size, rows.size());
        return PageResponse.of(p, size, rows.size(), rows.subList(from, to));
    }

    private record IssueCustody(Integer empId, String docNo, LocalDate docDate) {}

    private static final class StockAgg {
        static final StockAgg ZERO = new StockAgg();
        BigDecimal qty = BigDecimal.ZERO;
        BigDecimal value = BigDecimal.ZERO;
        int storeCount = 0;
    }
}
