package com.caits.modules.reports;

import com.caits.common.PageResponse;
import com.caits.domain.entity.HrcDepartmentMst;
import com.caits.domain.entity.HrcEmployeeMst;
import com.caits.domain.entity.InvBlsMst;
import com.caits.domain.entity.InvItemMst;
import com.caits.domain.entity.InvStockMst;
import com.caits.domain.entity.OrgLocationMst;
import com.caits.domain.entity.TxnDetailDtl;
import com.caits.domain.entity.TxnHeaderMst;
import com.caits.domain.repository.HrcDepartmentMstRepository;
import com.caits.domain.repository.HrcEmployeeMstRepository;
import com.caits.domain.repository.InvBlsMstRepository;
import com.caits.domain.repository.InvItemMstRepository;
import com.caits.domain.repository.InvStockMstRepository;
import com.caits.domain.repository.OrgLocationMstRepository;
import com.caits.domain.repository.TxnDetailDtlRepository;
import com.caits.domain.repository.TxnHeaderMstRepository;
import com.caits.domain.repository.UnitMstRepository;
import com.caits.modules.masters.SystemLocationRole;
import com.caits.modules.masters.SystemLocationService;
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
import java.util.Objects;
import java.util.Set;

/**
 * Report endpoints aligned to ASSET_TRACKING_ERP.xlsx layouts:
 * Stock Ledger, Asset Movement Register, Item Ledger.
 */
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

    private static final Set<String> RECEIPT_DOC_TYPES = Set.of(
            "OPENING_STOCK", "GRN", "GATEPASS_INWARD", "MATERIAL_RETURN"
    );

    private static final Set<String> ISSUE_DOC_TYPES = Set.of(
            "MATERIAL_ISSUE", "GATEPASS_OUTWARD"
    );

    private static final Set<String> LEDGER_DOC_TYPES = Set.of(
            "OPENING_STOCK",
            "GRN",
            "GATEPASS_INWARD",
            "GATEPASS_OUTWARD",
            "MATERIAL_ISSUE",
            "MATERIAL_TRANSFER",
            "MATERIAL_RETURN",
            "INSPECTION_APPROVAL"
    );

    private final InvStockMstRepository stockRepo;
    private final InvItemMstRepository itemRepo;
    private final TxnHeaderMstRepository headerRepo;
    private final TxnDetailDtlRepository detailRepo;
    private final AccessScopeService accessScope;
    private final OrgLocationMstRepository locationRepo;
    private final HrcEmployeeMstRepository employeeRepo;
    private final UnitMstRepository unitRepo;
    private final HrcDepartmentMstRepository departmentRepo;
    private final InvBlsMstRepository blsRepo;
    private final SystemLocationService systemLocations;

    public ReportsController(
            InvStockMstRepository stockRepo,
            InvItemMstRepository itemRepo,
            TxnHeaderMstRepository headerRepo,
            TxnDetailDtlRepository detailRepo,
            AccessScopeService accessScope,
            OrgLocationMstRepository locationRepo,
            HrcEmployeeMstRepository employeeRepo,
            UnitMstRepository unitRepo,
            HrcDepartmentMstRepository departmentRepo,
            InvBlsMstRepository blsRepo,
            SystemLocationService systemLocations
    ) {
        this.stockRepo = stockRepo;
        this.itemRepo = itemRepo;
        this.headerRepo = headerRepo;
        this.detailRepo = detailRepo;
        this.accessScope = accessScope;
        this.locationRepo = locationRepo;
        this.employeeRepo = employeeRepo;
        this.unitRepo = unitRepo;
        this.departmentRepo = departmentRepo;
        this.blsRepo = blsRepo;
        this.systemLocations = systemLocations;
    }

    /**
     * STOCK LEDGER — Sr No, Item Name, UOM, Opening, Receipt, Issue, Closing, Owner.
     */
    @GetMapping("/stock-register")
    public PageResponse<Map<String, Object>> stockRegister(
            @RequestParam(required = false) Integer locationId,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
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
        Map<Integer, String> uomCodes = unitCodeMap();
        Map<Integer, HrcEmployeeMst> employees = employeeMap();
        Map<String, IssueCustody> lastIssue = latestIssueCustodyByItemLocation();
        Map<Integer, Integer> blsOwnerByItem = blsOwnerByItem();
        Map<String, PeriodQty> period = (fromDate != null || toDate != null)
                ? periodReceiptIssue(fromDate, toDate, locFilter)
                : Map.of();

        // Aggregate stock by item (sum across matching locations) for ledger rows.
        Map<Integer, StockLedgerAgg> byItem = new LinkedHashMap<>();
        for (InvStockMst s : stocks) {
            InvItemMst item = items.get(s.getStkItemIdItm());
            if (item == null) continue;
            if (categoryId != null && !categoryId.equals(item.getItmCategoryIdCat())) continue;
            if (!matchesItemSearch(item, search)) continue;

            StockLedgerAgg agg = byItem.computeIfAbsent(item.getItmItemId(), id -> {
                StockLedgerAgg a = new StockLedgerAgg();
                a.item = item;
                a.uomId = s.getStkUomIdUnt() != null ? s.getStkUomIdUnt() : item.getItmUomIdUnt();
                return a;
            });
            if (agg.uomId == null) {
                agg.uomId = s.getStkUomIdUnt() != null ? s.getStkUomIdUnt() : item.getItmUomIdUnt();
            }
            agg.opening = agg.opening.add(nz(s.getStkOpeningQty()));
            agg.inward = agg.inward.add(nz(s.getStkInwardQty()));
            agg.issued = agg.issued.add(nz(s.getStkIssuedQty()));
            agg.closing = agg.closing.add(nz(s.getStkCurrentQty()));
            agg.locationIds.add(s.getStkLocationIdLoc());
        }

        List<Map<String, Object>> rows = new ArrayList<>();
        int sr = 1;
        for (StockLedgerAgg agg : byItem.values()) {
            Integer itemId = agg.item.getItmItemId();
            BigDecimal receipt;
            BigDecimal issue;
            BigDecimal opening;
            BigDecimal closing = agg.closing;

            if (fromDate != null || toDate != null) {
                PeriodQty pq = PeriodQty.ZERO;
                for (Integer locId : agg.locationIds) {
                    PeriodQty part = period.getOrDefault(periodKey(itemId, locId), PeriodQty.ZERO);
                    pq = pq.add(part);
                }
                // Also try item-only key when location was null on lines
                pq = pq.add(period.getOrDefault(periodKey(itemId, null), PeriodQty.ZERO));
                receipt = pq.receipt;
                issue = pq.issue;
                opening = closing.subtract(receipt).add(issue);
                if (opening.compareTo(BigDecimal.ZERO) < 0) opening = BigDecimal.ZERO;
            } else {
                opening = agg.opening;
                receipt = agg.inward;
                issue = agg.issued;
            }

            String ownerName = null;
            Integer blsEmp = blsOwnerByItem.get(itemId);
            if (blsEmp != null) {
                ownerName = empLabel(employees.get(blsEmp));
            }
            if (ownerName == null) {
                for (Integer locId : agg.locationIds) {
                    IssueCustody issued = lastIssue.get(custodyKey(itemId, locId));
                    if (issued != null && issued.empId != null) {
                        ownerName = empLabel(employees.get(issued.empId));
                        break;
                    }
                }
            }

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", itemId);
            row.put("srNo", sr++);
            row.put("itemId", itemId);
            row.put("itemCode", agg.item.getItmItemCode());
            row.put("itemName", agg.item.getItmItemName());
            row.put("uomId", agg.uomId);
            row.put("uomCode", agg.uomId == null ? null : uomCodes.get(agg.uomId));
            row.put("openingBalance", opening);
            row.put("receiptDuringPeriod", receipt);
            row.put("issueDuringPeriod", issue);
            row.put("closingBalance", closing);
            row.put("ownerName", ownerName);
            rows.add(row);
        }

        rows.sort(Comparator.comparing(r -> String.valueOf(r.getOrDefault("itemName", "")), String.CASE_INSENSITIVE_ORDER));
        // Re-number after sort
        int n = 1;
        for (Map<String, Object> row : rows) {
            row.put("srNo", n++);
        }
        return pageOf(rows, page, pageSize);
    }

    /**
     * Store-centric ownership of current stock (unchanged layout; not in Excel workbook).
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
        Map<Integer, String> deptNames = departmentNameMap();
        Map<String, IssueCustody> lastIssueByBucket = latestIssueCustodyByBucket();
        Map<String, Integer> blsIssuedTo = blsIssuedToByStockKey();

        List<Map<String, Object>> rows = new ArrayList<>();
        for (InvStockMst s : stocks) {
            InvItemMst item = items.get(s.getStkItemIdItm());
            if (item == null) continue;
            if (categoryId != null && !categoryId.equals(item.getItmCategoryIdCat())) continue;
            if (!matchesItemSearch(item, search)) continue;

            OrgLocationMst store = locations.get(s.getStkLocationIdLoc());
            String bucketKey = stockCustodyKey(s.getStkItemIdItm(), s.getStkLocationIdLoc(), s.getStkBatchLotNo());
            IssueCustody issued = lastIssueByBucket.get(bucketKey);
            Integer blsEmp = blsIssuedTo.get(bucketKey);
            if (blsEmp != null) {
                if (issued == null) {
                    issued = new IssueCustody(blsEmp, null, null);
                } else if (issued.empId == null) {
                    issued = new IssueCustody(blsEmp, issued.docNo, issued.docDate);
                }
            }

            Integer custodianEmpId = issued != null ? issued.empId : null;
            String custodyMode = custodianEmpId != null ? "ISSUED_TO" : "IN_STORE";

            BigDecimal current = nz(s.getStkCurrentQty());
            BigDecimal available = s.getStkAvailableQty() != null ? s.getStkAvailableQty() : current;
            BigDecimal reserved = nz(s.getStkReservedQty());
            // Drop empty ghost buckets (e.g. zeroed serial rows after stock moved).
            if (current.compareTo(BigDecimal.ZERO) == 0
                    && available.compareTo(BigDecimal.ZERO) == 0
                    && reserved.compareTo(BigDecimal.ZERO) == 0
                    && "IN_STORE".equals(custodyMode)) {
                continue;
            }

            if (employeeId != null && !employeeId.equals(custodianEmpId)
                    && !employeeId.equals(store == null ? null : store.getLocManagerEmpIdEmp())) {
                continue;
            }
            if (custody != null && !custody.isBlank() && !custody.equalsIgnoreCase(custodyMode)) {
                continue;
            }

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
            row.put("custodianDept", custodian == null ? null : deptNames.get(custodian.getEmpDepartmentIdDept()));
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
     * Asset Movement Register — Date, Asset ID/Name, From/To Loc & Dept, Custodian, Type, Reason, Document.
     */
    @GetMapping("/stock-movement")
    public PageResponse<Map<String, Object>> stockMovement(
            @RequestParam(required = false) String docType,
            @RequestParam(required = false) String direction,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false) Integer locationId,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Integer itemId,
            @RequestParam(required = false) Integer employeeId,
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
        Map<Integer, String> deptNames = departmentNameMap();

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

            Integer fromEmpId = h.getTxhInitiatedByEmpIdEmp();
            Integer toEmpId = h.getTxhHandedOverToEmpIdEmp() != null
                    ? h.getTxhHandedOverToEmpIdEmp()
                    : ("MATERIAL_ISSUE".equals(h.getTxhDocType()) ? h.getTxhInitiatedByEmpIdEmp() : null);
            // Issue form stores "Issued To" in initiatedBy
            if ("MATERIAL_ISSUE".equals(h.getTxhDocType())) {
                toEmpId = h.getTxhInitiatedByEmpIdEmp();
                fromEmpId = null;
            }

            if (employeeId != null
                    && !employeeId.equals(fromEmpId)
                    && !employeeId.equals(toEmpId)
                    && !employeeId.equals(h.getTxhInitiatedByEmpIdEmp())
                    && !employeeId.equals(h.getTxhHandedOverToEmpIdEmp())) {
                continue;
            }

            HrcEmployeeMst fromEmp = fromEmpId == null ? null : employees.get(fromEmpId);
            HrcEmployeeMst toEmp = toEmpId == null ? null : employees.get(toEmpId);

            String fromDept = firstNonBlank(
                    fromEmp == null ? null : deptNames.get(fromEmp.getEmpDepartmentIdDept()),
                    deptNames.get(h.getTxhDepartmentIdDept())
            );
            String toDept = toEmp == null ? null : deptNames.get(toEmp.getEmpDepartmentIdDept());
            if (toDept == null && "IN".equals(dir)) {
                toDept = deptNames.get(h.getTxhDepartmentIdDept());
            }

            String custodian = custodianArrow(fromEmp, toEmp);
            String reason = firstNonBlank(h.getTxhPurpose(), h.getTxhRemarks());
            String movementType = movementTypeLabel(h.getTxhDocType());

            List<TxnDetailDtl> lines = detailRepo.findByTxdTxnHeaderIdTxhOrderByTxdSrNoAsc(h.getTxhTxnHeaderId());
            for (TxnDetailDtl d : lines) {
                InvItemMst item = items.get(d.getTxdItemIdItm());
                if (itemId != null && (item == null || !itemId.equals(item.getItmItemId()))) continue;
                if (categoryId != null && (item == null || !categoryId.equals(item.getItmCategoryIdCat()))) continue;
                if (item != null && !matchesItemSearch(item, search)) continue;
                if (search != null && !search.isBlank() && item == null) {
                    if (!String.valueOf(h.getTxhDocNo()).toLowerCase().contains(search.toLowerCase())) continue;
                }

                // Prefer assets; still include serialized lines even if type is missing
                boolean isAsset = item != null && (
                        !"consumable".equalsIgnoreCase(nullToEmpty(item.getItmItemType()))
                                || Boolean.TRUE.equals(item.getItmIsSerialized())
                                || (d.getTxdSerialNo() != null && !d.getTxdSerialNo().isBlank())
                );
                if (!isAsset) continue;

                Integer lineFrom = fromLoc;
                Integer lineTo = toLoc;
                Integer lineLoc = d.getTxdLocationIdLoc() != null ? d.getTxdLocationIdLoc() : h.getTxhLocationIdLoc();
                if (lineTo == null && "IN".equals(dir) && lineLoc != null) lineTo = lineLoc;
                if (lineFrom == null && ("OUT".equals(dir) || "TRANSFER".equals(dir)) && lineLoc != null) lineFrom = lineLoc;
                // Opening / GRN: destination is the document location
                if (lineTo == null && lineLoc != null && RECEIPT_DOC_TYPES.contains(h.getTxhDocType())) {
                    lineTo = lineLoc;
                }

                OrgLocationMst from = lineFrom == null ? null : locations.get(lineFrom);
                OrgLocationMst to = lineTo == null ? null : locations.get(lineTo);

                // Per-line issued-to overrides header custodian when present
                String lineCustodian = custodian;
                if (d.getTxdIssuedToEmpIdEmp() != null) {
                    HrcEmployeeMst lineEmp = employees.get(d.getTxdIssuedToEmpIdEmp());
                    if (lineEmp != null) {
                        lineCustodian = empLabel(lineEmp);
                        if (employeeId != null && !employeeId.equals(d.getTxdIssuedToEmpIdEmp())) continue;
                    }
                }

                String assetId = firstNonBlank(d.getTxdSerialNo(), item == null ? null : item.getItmItemCode());
                String assetName = item == null ? null : item.getItmItemName();
                String fromLabel = locLabel(from);
                String toLabel = locLabel(to);

                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", d.getTxdTxnDetailId());
                row.put("date", h.getTxhDocDate());
                row.put("assetId", assetId);
                row.put("assetName", assetName);
                row.put("itemId", d.getTxdItemIdItm());
                row.put("itemCode", item == null ? null : item.getItmItemCode());
                row.put("itemName", assetName);
                row.put("fromLocation", fromLabel);
                row.put("toLocation", toLabel);
                row.put("fromStore", from == null ? null : from.getLocLocationCode());
                row.put("toStore", to == null ? null : to.getLocLocationCode());
                row.put("fromLocationId", lineFrom);
                row.put("toLocationId", lineTo);
                row.put("fromDept", fromDept);
                row.put("toDept", toDept);
                row.put("custodian", lineCustodian);
                row.put("employee", lineCustodian);
                row.put("movementType", movementType);
                row.put("reason", reason);
                row.put("document", h.getTxhDocNo());
                row.put("docType", h.getTxhDocType());
                row.put("docNo", h.getTxhDocNo());
                row.put("direction", dir);
                row.put("serialNo", d.getTxdSerialNo());
                rows.add(row);
            }
        }
        return pageOf(rows, page, pageSize);
    }

    /**
     * Item Ledger — Date, Doc Type, Doc No, Batch, UOM, Receipt, Issue, running Balance.
     * When itemId is omitted, returns ledger lines for all items (balance resets per item).
     */
    @GetMapping("/item-ledger")
    public PageResponse<Map<String, Object>> itemLedger(
            @RequestParam(required = false) Integer itemId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false) Integer locationId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "200") int pageSize
    ) {
        Map<Integer, InvItemMst> items = itemMap();
        Set<Integer> focusIds = new java.util.HashSet<>();
        if (itemId != null) {
            if (items.containsKey(itemId)) focusIds.add(itemId);
        } else if (search != null && !search.isBlank()) {
            String q = search.trim().toLowerCase();
            items.values().stream()
                    .filter(i -> {
                        String code = nullToEmpty(i.getItmItemCode()).toLowerCase();
                        String name = nullToEmpty(i.getItmItemName()).toLowerCase();
                        return code.contains(q) || name.contains(q);
                    })
                    .map(InvItemMst::getItmItemId)
                    .forEach(focusIds::add);
        } else {
            focusIds.addAll(items.keySet());
        }
        if (focusIds.isEmpty()) {
            return pageOf(List.of(), page, pageSize);
        }

        List<Integer> locFilter = accessScope.resolveLocationFilter(locationId);

        var headers = headerRepo.findAll((root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            preds.add(root.get("txhDocType").in(LEDGER_DOC_TYPES));
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
        }, PageRequest.of(0, 2000, Sort.by(Sort.Direction.ASC, "txhDocDate", "txhTxnHeaderId"))).getContent();

        Map<Integer, OrgLocationMst> locations = locationMap();
        Map<Integer, TxnHeaderMst> grnById = new HashMap<>();
        for (TxnHeaderMst h : headers) {
            if ("GRN".equals(h.getTxhDocType())) {
                grnById.put(h.getTxhTxnHeaderId(), h);
            }
        }
        for (TxnHeaderMst h : headers) {
            if ("INSPECTION_APPROVAL".equals(h.getTxhDocType()) && h.getTxhRefTxnHeaderIdTxh() != null) {
                grnById.computeIfAbsent(h.getTxhRefTxnHeaderIdTxh(), id ->
                        headerRepo.findById(id).orElse(null));
            }
        }

        Map<Integer, String> uomCodes = unitCodeMap();
        List<LedgerEvent> events = new ArrayList<>();
        for (TxnHeaderMst h : headers) {
            if (!isLedgerEligibleStatus(h)) continue;

            List<TxnDetailDtl> lines = detailRepo.findByTxdTxnHeaderIdTxhOrderByTxdSrNoAsc(h.getTxhTxnHeaderId());
            for (TxnDetailDtl d : lines) {
                Integer lineItemId = d.getTxdItemIdItm();
                if (lineItemId == null || !focusIds.contains(lineItemId)) continue;
                InvItemMst item = items.get(lineItemId);
                if (item == null) continue;
                events.addAll(itemLedgerEvents(h, d, item, grnById, locations, uomCodes, locationId));
            }
        }

        events.sort(Comparator
                .comparing((LedgerEvent e) -> nullToEmpty(e.itemCode), String.CASE_INSENSITIVE_ORDER)
                .thenComparing(e -> e.date == null ? LocalDate.MIN : e.date)
                .thenComparing(e -> e.headerId == null ? 0 : e.headerId)
                .thenComparing(e -> e.detailId == null ? 0 : e.detailId)
                .thenComparing(e -> e.subOrder));

        Map<String, BigDecimal> balanceByKey = new HashMap<>();
        List<Map<String, Object>> rows = new ArrayList<>();
        for (LedgerEvent e : events) {
            boolean beforeFrom = fromDate != null && e.date != null && e.date.isBefore(fromDate);
            boolean afterTo = toDate != null && e.date != null && e.date.isAfter(toDate);
            String balKey = ledgerBalanceKey(e.itemId, locationId);
            BigDecimal bal = balanceByKey.getOrDefault(balKey, BigDecimal.ZERO);
            if (beforeFrom) {
                balanceByKey.put(balKey, bal.add(e.receipt).subtract(e.issue));
                continue;
            }
            if (afterTo) continue;

            bal = bal.add(e.receipt).subtract(e.issue);
            balanceByKey.put(balKey, bal);

            String rowId = e.rowSuffix == null || e.rowSuffix.isBlank()
                    ? String.valueOf(e.detailId)
                    : e.detailId + "-" + e.rowSuffix;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", rowId);
            row.put("date", e.date);
            row.put("itemId", e.itemId);
            row.put("itemCode", e.itemCode);
            row.put("itemName", e.itemName);
            row.put("docType", e.docType);
            row.put("docNo", e.docNo);
            row.put("batch", e.batch);
            row.put("uomCode", e.uomCode);
            row.put("locationId", e.locationId);
            row.put("locationCode", e.locationCode);
            row.put("receipt", e.receipt.compareTo(BigDecimal.ZERO) == 0 ? null : e.receipt);
            row.put("issue", e.issue.compareTo(BigDecimal.ZERO) == 0 ? null : e.issue);
            row.put("balance", bal);
            rows.add(row);
        }

        return pageOf(rows, page, pageSize);
    }

    /**
     * Item master catalog register (legacy; Item Register page now uses Item Ledger).
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
        }, PageRequest.of(0, 500, Sort.by(Sort.Direction.DESC, "txhDocDate", "txhTxnHeaderId"))).getContent();

        Map<Integer, InvItemMst> items = itemMap();
        Map<Integer, TxnHeaderMst> grnById = new HashMap<>();
        for (TxnHeaderMst h : headers) {
            if ("GRN".equals(h.getTxhDocType())) {
                grnById.put(h.getTxhTxnHeaderId(), h);
            }
        }
        for (TxnHeaderMst h : headers) {
            if ("INSPECTION_APPROVAL".equals(h.getTxhDocType()) && h.getTxhRefTxnHeaderIdTxh() != null) {
                grnById.computeIfAbsent(h.getTxhRefTxnHeaderIdTxh(), id ->
                        headerRepo.findById(id).orElse(null));
            }
        }

        List<Map<String, Object>> rows = new ArrayList<>();
        for (TxnHeaderMst h : headers) {
            List<TxnDetailDtl> lines = detailRepo.findByTxdTxnHeaderIdTxhOrderByTxdSrNoAsc(h.getTxhTxnHeaderId());
            for (TxnDetailDtl d : lines) {
                InvItemMst item = items.get(d.getTxdItemIdItm());
                rows.addAll(fullReportRowsForLine(h, d, item, grnById));
            }
        }
        return pageOf(rows, page, pageSize);
    }

    /**
     * Full report rows reflect where stock actually lands (rejected store, quarantine, home store),
     * not just the document header store and accepted qty.
     */
    private List<Map<String, Object>> fullReportRowsForLine(
            TxnHeaderMst header,
            TxnDetailDtl line,
            InvItemMst item,
            Map<Integer, TxnHeaderMst> grnById
    ) {
        String docType = header.getTxhDocType();
        if ("GRN".equals(docType)) {
            return fullReportGrnRows(header, line, item);
        }
        if ("INSPECTION_APPROVAL".equals(docType)) {
            return fullReportInspectionRows(header, line, item, grnById);
        }
        BigDecimal qty = line.getTxdQty() != null ? line.getTxdQty() : nz(line.getTxdAcceptedQty());
        Integer fromLoc = header.getTxhFromLocationIdLoc();
        Integer toLoc = header.getTxhToLocationIdLoc() != null
                ? header.getTxhToLocationIdLoc()
                : header.getTxhLocationIdLoc();
        return List.of(buildFullReportRow(header, line, item, qty, fromLoc, toLoc, header.getTxhStatus(), null));
    }

    private List<Map<String, Object>> fullReportGrnRows(
            TxnHeaderMst header, TxnDetailDtl line, InvItemMst item
    ) {
        List<Map<String, Object>> rows = new ArrayList<>();
        BigDecimal rejectedQty = nz(line.getTxdRejectedQty());
        BigDecimal acceptedQty = firstNonNullBigDecimal(
                line.getTxdAcceptedQty(), line.getTxdReceivedQty(), line.getTxdQty());

        if (rejectedQty.compareTo(BigDecimal.ZERO) > 0) {
            Integer rejectedLoc = systemLocForGrnStore(header.getTxhLocationIdLoc(), SystemLocationRole.REJECTED);
            rows.add(buildFullReportRow(
                    header, line, item, rejectedQty, null, rejectedLoc, header.getTxhStatus(), "rej"));
        }
        if (acceptedQty.compareTo(BigDecimal.ZERO) > 0) {
            Integer targetLoc;
            if (item != null && Boolean.TRUE.equals(item.getItmInspectionNeeded())) {
                targetLoc = systemLocForGrnStore(header.getTxhLocationIdLoc(), SystemLocationRole.QUARANTINE);
            } else {
                targetLoc = line.getTxdLocationIdLoc() != null
                        ? line.getTxdLocationIdLoc()
                        : header.getTxhLocationIdLoc();
            }
            rows.add(buildFullReportRow(
                    header, line, item, acceptedQty, null, targetLoc, header.getTxhStatus(), "acc"));
        }
        return rows;
    }

    private List<Map<String, Object>> fullReportInspectionRows(
            TxnHeaderMst header,
            TxnDetailDtl line,
            InvItemMst item,
            Map<Integer, TxnHeaderMst> grnById
    ) {
        List<Map<String, Object>> rows = new ArrayList<>();
        BigDecimal qty = firstNonNullBigDecimal(line.getTxdQty(), line.getTxdAcceptedQty());
        if (qty.compareTo(BigDecimal.ZERO) == 0) {
            return rows;
        }

        Integer quarantineLoc = inspectionQuarantineForHeader(header, grnById);
        String status = header.getTxhStatus();
        boolean rejected = status != null && status.toLowerCase().contains("reject");

        if (rejected) {
            Integer rejectedLoc = rejectedLocForGrnRef(header.getTxhRefTxnHeaderIdTxh(), grnById);
            rows.add(buildFullReportRow(header, line, item, qty, quarantineLoc, rejectedLoc, status, "rej"));
        } else {
            Integer homeLoc = line.getTxdLocationIdLoc();
            if (homeLoc == null && item != null) {
                homeLoc = item.getItmCurrentLocationIdLoc();
            }
            if ("Approved".equalsIgnoreCase(status) || isMovementEligibleStatus(status)) {
                rows.add(buildFullReportRow(header, line, item, qty, quarantineLoc, homeLoc, status, null));
            } else {
                rows.add(buildFullReportRow(header, line, item, qty, null, quarantineLoc, status, null));
            }
        }
        return rows;
    }

    private Map<String, Object> buildFullReportRow(
            TxnHeaderMst header,
            TxnDetailDtl line,
            InvItemMst item,
            BigDecimal qty,
            Integer fromLocationId,
            Integer toLocationId,
            String status,
            String rowSuffix
    ) {
        Map<String, Object> row = new HashMap<>();
        String id = rowSuffix == null
                ? String.valueOf(line.getTxdTxnDetailId())
                : line.getTxdTxnDetailId() + "-" + rowSuffix;
        row.put("id", id);
        row.put("date", header.getTxhDocDate());
        row.put("txnType", header.getTxhDocType());
        row.put("txnNo", header.getTxhDocNo());
        row.put("itemId", line.getTxdItemIdItm());
        row.put("item", item == null ? null : item.getItmItemName());
        row.put("categoryId", item == null ? null : item.getItmCategoryIdCat());
        row.put("qty", qty);
        row.put("uomId", line.getTxdUomIdUnt());
        row.put("fromLocationId", fromLocationId);
        row.put("toLocationId", toLocationId);
        row.put("entityId", header.getTxhEntityIdEnt());
        row.put("employeeId", header.getTxhInitiatedByEmpIdEmp());
        row.put("status", status);
        row.put("value", lineValueForQty(line, qty));
        return row;
    }

    private BigDecimal lineValueForQty(TxnDetailDtl line, BigDecimal qty) {
        if (qty == null || qty.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        if (line.getTxdRate() != null) {
            return line.getTxdRate().multiply(qty);
        }
        BigDecimal totalQty = firstNonNullBigDecimal(
                line.getTxdAcceptedQty(), line.getTxdReceivedQty(), line.getTxdQty());
        if (line.getTxdAmount() != null && totalQty.compareTo(BigDecimal.ZERO) > 0) {
            return line.getTxdAmount()
                    .multiply(qty)
                    .divide(totalQty, 2, java.math.RoundingMode.HALF_UP);
        }
        return line.getTxdAmount();
    }

    private Integer systemLocForGrnStore(Integer grnStoreId, SystemLocationRole role) {
        Integer buId = systemLocations.resolveBuId(grnStoreId);
        if (buId == null) {
            return null;
        }
        return locationRepo.findByLocBuIdBuAndLocSystemRoleAndLocIsactiveTrue(buId, role.code())
                .map(OrgLocationMst::getLocLocationId)
                .orElse(null);
    }

    private Integer rejectedLocForGrnRef(Integer grnHeaderId, Map<Integer, TxnHeaderMst> grnById) {
        if (grnHeaderId == null) {
            return null;
        }
        TxnHeaderMst grn = grnById.get(grnHeaderId);
        if (grn == null) {
            grn = headerRepo.findById(grnHeaderId).orElse(null);
        }
        if (grn == null) {
            return null;
        }
        return systemLocForGrnStore(grn.getTxhLocationIdLoc(), SystemLocationRole.REJECTED);
    }

    private Integer inspectionQuarantineForHeader(TxnHeaderMst header, Map<Integer, TxnHeaderMst> grnById) {
        if (header.getTxhRefTxnHeaderIdTxh() != null) {
            TxnHeaderMst grn = grnById.get(header.getTxhRefTxnHeaderIdTxh());
            if (grn == null) {
                grn = headerRepo.findById(header.getTxhRefTxnHeaderIdTxh()).orElse(null);
            }
            if (grn != null) {
                Integer q = systemLocForGrnStore(grn.getTxhLocationIdLoc(), SystemLocationRole.QUARANTINE);
                if (q != null) {
                    return q;
                }
            }
        }
        return header.getTxhLocationIdLoc();
    }

    private static BigDecimal firstNonNullBigDecimal(BigDecimal... values) {
        if (values == null) {
            return BigDecimal.ZERO;
        }
        for (BigDecimal v : values) {
            if (v != null) {
                return v;
            }
        }
        return BigDecimal.ZERO;
    }

    private List<LedgerEvent> itemLedgerEvents(
            TxnHeaderMst header,
            TxnDetailDtl line,
            InvItemMst item,
            Map<Integer, TxnHeaderMst> grnById,
            Map<Integer, OrgLocationMst> locations,
            Map<Integer, String> uomCodes,
            Integer locationFilter
    ) {
        String docType = header.getTxhDocType();
        String batch = firstNonBlank(line.getTxdSerialNo(), line.getTxdBatchLotNo());
        Integer uomId = line.getTxdUomIdUnt() != null ? line.getTxdUomIdUnt() : item.getItmUomIdUnt();
        String uomCode = uomId == null ? null : uomCodes.get(uomId);

        if ("GRN".equals(docType)) {
            List<LedgerEvent> events = new ArrayList<>();
            BigDecimal rejectedQty = nz(line.getTxdRejectedQty());
            BigDecimal acceptedQty = firstNonNullBigDecimal(
                    line.getTxdAcceptedQty(), line.getTxdReceivedQty(), line.getTxdQty());
            if (rejectedQty.compareTo(BigDecimal.ZERO) > 0) {
                Integer rejectedLoc = systemLocForGrnStore(header.getTxhLocationIdLoc(), SystemLocationRole.REJECTED);
                addLedgerReceipt(events, header, line, item, rejectedQty, "GRN · Rejected", batch, uomCode,
                        rejectedLoc, locations, "rej", 1);
            }
            if (acceptedQty.compareTo(BigDecimal.ZERO) > 0) {
                Integer targetLoc;
                if (Boolean.TRUE.equals(item.getItmInspectionNeeded())) {
                    targetLoc = systemLocForGrnStore(header.getTxhLocationIdLoc(), SystemLocationRole.QUARANTINE);
                } else {
                    targetLoc = line.getTxdLocationIdLoc() != null
                            ? line.getTxdLocationIdLoc()
                            : header.getTxhLocationIdLoc();
                }
                addLedgerReceipt(events, header, line, item, acceptedQty, docTypeLabel(docType), batch, uomCode,
                        targetLoc, locations, "acc", 2);
            }
            return filterLedgerEventsByLocation(events, locationFilter);
        }

        if ("INSPECTION_APPROVAL".equals(docType)) {
            List<LedgerEvent> events = new ArrayList<>();
            BigDecimal qty = firstNonNullBigDecimal(line.getTxdQty(), line.getTxdAcceptedQty());
            if (qty.compareTo(BigDecimal.ZERO) == 0) {
                return events;
            }
            Integer quarantineLoc = inspectionQuarantineForHeader(header, grnById);
            boolean rejected = header.getTxhStatus() != null
                    && header.getTxhStatus().toLowerCase().contains("reject");
            if (rejected) {
                Integer rejectedLoc = rejectedLocForGrnRef(header.getTxhRefTxnHeaderIdTxh(), grnById);
                addLedgerIssue(events, header, line, item, qty, "Inspection · Rejected", batch, uomCode,
                        quarantineLoc, locations, "rej-out", 1);
                addLedgerReceipt(events, header, line, item, qty, "Inspection · Rejected", batch, uomCode,
                        rejectedLoc, locations, "rej-in", 2);
            } else if ("Approved".equalsIgnoreCase(header.getTxhStatus())
                    || isMovementEligibleStatus(header.getTxhStatus())) {
                if (locationFilter != null) {
                    Integer homeLoc = line.getTxdLocationIdLoc() != null
                            ? line.getTxdLocationIdLoc()
                            : item.getItmCurrentLocationIdLoc();
                    addLedgerIssue(events, header, line, item, qty, "Inspection", batch, uomCode,
                            quarantineLoc, locations, "out", 1);
                    addLedgerReceipt(events, header, line, item, qty, "Inspection", batch, uomCode,
                            homeLoc, locations, "in", 2);
                }
            }
            return filterLedgerEventsByLocation(events, locationFilter);
        }

        if ("MATERIAL_TRANSFER".equals(docType)) {
            List<LedgerEvent> events = new ArrayList<>();
            BigDecimal qty = firstNonNullBigDecimal(line.getTxdQty(), line.getTxdAcceptedQty());
            if (locationFilter != null) {
                if (Objects.equals(locationFilter, header.getTxhToLocationIdLoc())) {
                    addLedgerReceipt(events, header, line, item, qty, docTypeLabel(docType), batch, uomCode,
                            header.getTxhToLocationIdLoc(), locations, null, 0);
                } else if (Objects.equals(locationFilter, header.getTxhFromLocationIdLoc())) {
                    addLedgerIssue(events, header, line, item, qty, docTypeLabel(docType), batch, uomCode,
                            header.getTxhFromLocationIdLoc(), locations, null, 0);
                }
            } else {
                addLedgerIssue(events, header, line, item, qty, docTypeLabel(docType), batch, uomCode,
                        header.getTxhFromLocationIdLoc(), locations, null, 0);
            }
            return events;
        }

        List<LedgerEvent> events = new ArrayList<>();
        BigDecimal qty = firstNonNullBigDecimal(
                line.getTxdQty(), line.getTxdAcceptedQty(), line.getTxdReceivedQty(), line.getTxdRequestedQty());
        if (qty.compareTo(BigDecimal.ZERO) == 0) {
            return events;
        }
        if (RECEIPT_DOC_TYPES.contains(docType)) {
            Integer loc = line.getTxdLocationIdLoc() != null ? line.getTxdLocationIdLoc() : header.getTxhLocationIdLoc();
            addLedgerReceipt(events, header, line, item, qty, docTypeLabel(docType), batch, uomCode,
                    loc, locations, null, 0);
        } else if (ISSUE_DOC_TYPES.contains(docType)) {
            Integer loc = header.getTxhFromLocationIdLoc() != null
                    ? header.getTxhFromLocationIdLoc()
                    : header.getTxhLocationIdLoc();
            addLedgerIssue(events, header, line, item, qty, docTypeLabel(docType), batch, uomCode,
                    loc, locations, null, 0);
        }
        return filterLedgerEventsByLocation(events, locationFilter);
    }

    private void addLedgerReceipt(
            List<LedgerEvent> events,
            TxnHeaderMst header,
            TxnDetailDtl line,
            InvItemMst item,
            BigDecimal qty,
            String docTypeLabel,
            String batch,
            String uomCode,
            Integer locationId,
            Map<Integer, OrgLocationMst> locations,
            String rowSuffix,
            int subOrder
    ) {
        if (qty == null || qty.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        events.add(new LedgerEvent(
                header.getTxhDocDate(),
                header.getTxhTxnHeaderId(),
                line.getTxdTxnDetailId(),
                rowSuffix,
                subOrder,
                item.getItmItemId(),
                item.getItmItemCode(),
                item.getItmItemName(),
                docTypeLabel,
                header.getTxhDocNo(),
                batch,
                uomCode,
                locationId,
                ledgerLocationCode(locations, locationId),
                qty,
                BigDecimal.ZERO
        ));
    }

    private void addLedgerIssue(
            List<LedgerEvent> events,
            TxnHeaderMst header,
            TxnDetailDtl line,
            InvItemMst item,
            BigDecimal qty,
            String docTypeLabel,
            String batch,
            String uomCode,
            Integer locationId,
            Map<Integer, OrgLocationMst> locations,
            String rowSuffix,
            int subOrder
    ) {
        if (qty == null || qty.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        events.add(new LedgerEvent(
                header.getTxhDocDate(),
                header.getTxhTxnHeaderId(),
                line.getTxdTxnDetailId(),
                rowSuffix,
                subOrder,
                item.getItmItemId(),
                item.getItmItemCode(),
                item.getItmItemName(),
                docTypeLabel,
                header.getTxhDocNo(),
                batch,
                uomCode,
                locationId,
                ledgerLocationCode(locations, locationId),
                BigDecimal.ZERO,
                qty
        ));
    }

    private static List<LedgerEvent> filterLedgerEventsByLocation(List<LedgerEvent> events, Integer locationFilter) {
        if (locationFilter == null) {
            return events;
        }
        return events.stream()
                .filter(e -> Objects.equals(locationFilter, e.locationId))
                .toList();
    }

    private static String ledgerLocationCode(Map<Integer, OrgLocationMst> locations, Integer locationId) {
        if (locationId == null) {
            return null;
        }
        OrgLocationMst loc = locations.get(locationId);
        return loc == null ? null : loc.getLocLocationCode();
    }

    private static String ledgerBalanceKey(Integer itemId, Integer locationFilter) {
        if (locationFilter != null) {
            return itemId + "|" + locationFilter;
        }
        return String.valueOf(itemId);
    }

    private static boolean isLedgerEligibleStatus(TxnHeaderMst header) {
        if (isMovementEligibleStatus(header.getTxhStatus())) {
            return true;
        }
        return "INSPECTION_APPROVAL".equals(header.getTxhDocType())
                && header.getTxhStatus() != null
                && header.getTxhStatus().toLowerCase().contains("reject");
    }

    // --- helpers ---

    private Map<String, PeriodQty> periodReceiptIssue(LocalDate fromDate, LocalDate toDate, List<Integer> locFilter) {
        var headers = headerRepo.findAll((root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            preds.add(root.get("txhDocType").in(MOVEMENT_DOC_TYPES));
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
        }, PageRequest.of(0, 2000, Sort.by(Sort.Direction.ASC, "txhDocDate", "txhTxnHeaderId"))).getContent();

        Map<String, PeriodQty> map = new HashMap<>();
        for (TxnHeaderMst h : headers) {
            if (!isMovementEligibleStatus(h.getTxhStatus())) continue;
            String docType = h.getTxhDocType();
            if ("MATERIAL_TRANSFER".equals(docType)) continue;
            boolean receipt = RECEIPT_DOC_TYPES.contains(docType);
            boolean issue = ISSUE_DOC_TYPES.contains(docType);
            if (!receipt && !issue) continue;

            List<TxnDetailDtl> lines = detailRepo.findByTxdTxnHeaderIdTxhOrderByTxdSrNoAsc(h.getTxhTxnHeaderId());
            for (TxnDetailDtl d : lines) {
                if (d.getTxdItemIdItm() == null) continue;
                BigDecimal qty = nz(d.getTxdQty() != null ? d.getTxdQty() : d.getTxdAcceptedQty());
                Integer loc = d.getTxdLocationIdLoc() != null
                        ? d.getTxdLocationIdLoc()
                        : (issue
                            ? (h.getTxhFromLocationIdLoc() != null ? h.getTxhFromLocationIdLoc() : h.getTxhLocationIdLoc())
                            : h.getTxhLocationIdLoc());
                String key = periodKey(d.getTxdItemIdItm(), loc);
                PeriodQty pq = map.computeIfAbsent(key, k -> new PeriodQty());
                if (receipt) pq.receipt = pq.receipt.add(qty);
                if (issue) pq.issue = pq.issue.add(qty);
            }
        }
        return map;
    }

    private Map<Integer, Integer> blsOwnerByItem() {
        Map<Integer, Integer> map = new HashMap<>();
        for (InvBlsMst bls : blsRepo.findAll()) {
            if (!Boolean.TRUE.equals(bls.getIbmIsactive())) continue;
            if (bls.getIbmIssuedToEmpIdEmp() == null) continue;
            // Prefer non-dummy serial units
            if (Boolean.TRUE.equals(bls.getIbmIsDummy()) && map.containsKey(bls.getIbmItemIdItm())) continue;
            map.put(bls.getIbmItemIdItm(), bls.getIbmIssuedToEmpIdEmp());
        }
        return map;
    }

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

    private Map<Integer, String> unitCodeMap() {
        Map<Integer, String> map = new HashMap<>();
        unitRepo.findAll().forEach(u -> map.put(u.getUntUnitId(), u.getUntUnitCode()));
        return map;
    }

    private Map<Integer, String> departmentNameMap() {
        Map<Integer, String> map = new HashMap<>();
        for (HrcDepartmentMst d : departmentRepo.findAll()) {
            map.put(d.getDeptDepartmentId(), d.getDeptDepartmentName());
        }
        return map;
    }

    private Map<String, IssueCustody> latestIssueCustodyByItemLocation() {
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
                Integer lineEmp = d.getTxdIssuedToEmpIdEmp() != null ? d.getTxdIssuedToEmpIdEmp() : empId;
                String key = custodyKey(d.getTxdItemIdItm(), locId);
                latest.putIfAbsent(key, new IssueCustody(lineEmp, h.getTxhDocNo(), h.getTxhDocDate()));
            }
        }
        return latest;
    }

    /** Latest material issue per item + store + serial/batch bucket (not whole item at store). */
    private Map<String, IssueCustody> latestIssueCustodyByBucket() {
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
                Integer lineEmp = d.getTxdIssuedToEmpIdEmp() != null ? d.getTxdIssuedToEmpIdEmp() : empId;
                String batch = firstNonBlank(d.getTxdSerialNo(), d.getTxdBatchLotNo());
                String key = stockCustodyKey(d.getTxdItemIdItm(), locId, batch);
                latest.putIfAbsent(key, new IssueCustody(lineEmp, h.getTxhDocNo(), h.getTxhDocDate()));
            }
        }
        return latest;
    }

    private Map<String, Integer> blsIssuedToByStockKey() {
        Map<String, Integer> map = new HashMap<>();
        for (InvBlsMst bls : blsRepo.findAll()) {
            if (!Boolean.TRUE.equals(bls.getIbmIsactive())) continue;
            if (bls.getIbmIssuedToEmpIdEmp() == null) continue;
            if (Boolean.TRUE.equals(bls.getIbmIsDummy())) continue;
            String batchKey = firstNonBlank(bls.getIbmSerialNo(), bls.getIbmBatchNo());
            if (batchKey == null) continue;
            map.put(
                    stockCustodyKey(bls.getIbmItemIdItm(), bls.getIbmCurrentLocationIdLoc(), batchKey),
                    bls.getIbmIssuedToEmpIdEmp());
        }
        return map;
    }

    private static String stockCustodyKey(Integer itemId, Integer locationId, String batchOrSerial) {
        String batch = batchOrSerial == null || batchOrSerial.isBlank() ? "" : batchOrSerial.trim();
        return itemId + "|" + (locationId == null ? "_" : locationId) + "|" + batch;
    }

    private static String custodyKey(Integer itemId, Integer locationId) {
        return itemId + "|" + locationId;
    }

    private static String periodKey(Integer itemId, Integer locationId) {
        return itemId + "|" + (locationId == null ? "_" : locationId);
    }

    private static String movementDirection(String docType) {
        if (docType == null) return "IN";
        return switch (docType) {
            case "MATERIAL_ISSUE", "GATEPASS_OUTWARD" -> "OUT";
            case "MATERIAL_TRANSFER" -> "TRANSFER";
            default -> "IN";
        };
    }

    private static String movementTypeLabel(String docType) {
        if (docType == null) return "";
        return switch (docType) {
            case "OPENING_STOCK" -> "Opening";
            case "GRN" -> "GRN";
            case "GATEPASS_INWARD" -> "Gatepass In";
            case "GATEPASS_OUTWARD" -> "Gatepass Out";
            case "MATERIAL_ISSUE" -> "Issue";
            case "MATERIAL_TRANSFER" -> "Transfer";
            case "MATERIAL_RETURN" -> "Return";
            case "INSPECTION_APPROVAL" -> "Inspection";
            default -> docType;
        };
    }

    private static String docTypeLabel(String docType) {
        return movementTypeLabel(docType);
    }

    private static boolean isMovementEligibleStatus(String status) {
        if (status == null || status.isBlank()) return true;
        String s = status.toLowerCase();
        return !s.contains("draft") && !s.contains("reject") && !s.contains("cancel")
                && !s.contains("pending") && !s.equals("in pending");
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
        return name.isEmpty() ? null : name;
    }

    private static String locLabel(OrgLocationMst loc) {
        if (loc == null) return null;
        String code = loc.getLocLocationCode();
        String name = loc.getLocLocationName();
        if (code != null && name != null) return code + " – " + name;
        return name != null ? name : code;
    }

    private static String custodianArrow(HrcEmployeeMst from, HrcEmployeeMst to) {
        String a = empShort(from);
        String b = empShort(to);
        if (a != null && b != null) return a + " → " + b;
        if (b != null) return b;
        return a;
    }

    private static String empShort(HrcEmployeeMst e) {
        if (e == null) return null;
        String last = e.getEmpLastName() == null ? "" : e.getEmpLastName().trim();
        String name = (nullToEmpty(e.getEmpFirstName()) + (last.isEmpty() ? "" : " " + last)).trim();
        return name.isEmpty() ? e.getEmpEmployeeCode() : name;
    }

    private static String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String v : values) {
            if (v != null && !v.isBlank()) return v.trim();
        }
        return null;
    }

    private static String nullToEmpty(String v) {
        return v == null ? "" : v;
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

    private record LedgerEvent(
            LocalDate date,
            Integer headerId,
            Integer detailId,
            String rowSuffix,
            int subOrder,
            Integer itemId,
            String itemCode,
            String itemName,
            String docType,
            String docNo,
            String batch,
            String uomCode,
            Integer locationId,
            String locationCode,
            BigDecimal receipt,
            BigDecimal issue
    ) {}

    private static final class PeriodQty {
        static final PeriodQty ZERO = new PeriodQty();
        BigDecimal receipt = BigDecimal.ZERO;
        BigDecimal issue = BigDecimal.ZERO;

        PeriodQty add(PeriodQty other) {
            if (other == null) return this;
            PeriodQty n = new PeriodQty();
            n.receipt = this.receipt.add(other.receipt);
            n.issue = this.issue.add(other.issue);
            return n;
        }
    }

    private static final class StockLedgerAgg {
        InvItemMst item;
        Integer uomId;
        BigDecimal opening = BigDecimal.ZERO;
        BigDecimal inward = BigDecimal.ZERO;
        BigDecimal issued = BigDecimal.ZERO;
        BigDecimal closing = BigDecimal.ZERO;
        final List<Integer> locationIds = new ArrayList<>();
    }

    private static final class StockAgg {
        static final StockAgg ZERO = new StockAgg();
        BigDecimal qty = BigDecimal.ZERO;
        BigDecimal value = BigDecimal.ZERO;
        int storeCount = 0;
    }
}
