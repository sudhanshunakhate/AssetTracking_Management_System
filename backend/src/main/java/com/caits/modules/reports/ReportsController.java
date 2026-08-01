package com.caits.modules.reports;

import com.caits.common.PageResponse;
import com.caits.domain.entity.InvItemMst;
import com.caits.domain.entity.InvStockMst;
import com.caits.domain.entity.TxnDetailDtl;
import com.caits.domain.entity.TxnHeaderMst;
import com.caits.domain.repository.InvItemMstRepository;
import com.caits.domain.repository.InvStockMstRepository;
import com.caits.domain.repository.TxnDetailDtlRepository;
import com.caits.domain.repository.TxnHeaderMstRepository;
import com.caits.security.AccessScopeService;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportsController {

    private final InvStockMstRepository stockRepo;
    private final InvItemMstRepository itemRepo;
    private final TxnHeaderMstRepository headerRepo;
    private final TxnDetailDtlRepository detailRepo;
    private final AccessScopeService accessScope;

    public ReportsController(
            InvStockMstRepository stockRepo,
            InvItemMstRepository itemRepo,
            TxnHeaderMstRepository headerRepo,
            TxnDetailDtlRepository detailRepo,
            AccessScopeService accessScope
    ) {
        this.stockRepo = stockRepo;
        this.itemRepo = itemRepo;
        this.headerRepo = headerRepo;
        this.detailRepo = detailRepo;
        this.accessScope = accessScope;
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

        Map<Integer, InvItemMst> items = new HashMap<>();
        itemRepo.findAll().forEach(i -> items.put(i.getItmItemId(), i));

        List<Map<String, Object>> rows = new ArrayList<>();
        for (InvStockMst s : stocks) {
            InvItemMst item = items.get(s.getStkItemIdItm());
            if (item == null) continue;
            if (categoryId != null && !categoryId.equals(item.getItmCategoryIdCat())) continue;
            if (search != null && !search.isBlank()) {
                String q = search.toLowerCase();
                String code = item.getItmItemCode() == null ? "" : item.getItmItemCode().toLowerCase();
                String name = item.getItmItemName() == null ? "" : item.getItmItemName().toLowerCase();
                if (!code.contains(q) && !name.contains(q)) continue;
            }
            BigDecimal current = s.getStkCurrentQty() == null ? BigDecimal.ZERO : s.getStkCurrentQty();
            BigDecimal reorder = s.getStkReorderLevel() == null ? BigDecimal.ZERO : s.getStkReorderLevel();
            String status = current.compareTo(BigDecimal.ZERO) <= 0 ? "Out of Stock"
                    : (reorder.compareTo(BigDecimal.ZERO) > 0 && current.compareTo(reorder) <= 0 ? "Low Stock" : "In Stock");

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

        int p = Math.max(page, 1);
        int size = Math.min(Math.max(pageSize, 1), 200);
        int from = Math.min((p - 1) * size, rows.size());
        int to = Math.min(from + size, rows.size());
        return PageResponse.of(p, size, rows.size(), rows.subList(from, to));
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
                    // Match any location column so transfers are not missed or leaked.
                    preds.add(cb.or(
                            root.get("txhLocationIdLoc").in(locFilter),
                            root.get("txhFromLocationIdLoc").in(locFilter),
                            root.get("txhToLocationIdLoc").in(locFilter)
                    ));
                }
            }
            return preds.isEmpty() ? cb.conjunction() : cb.and(preds.toArray(Predicate[]::new));
        }, PageRequest.of(0, 500)).getContent();

        Map<Integer, InvItemMst> items = new HashMap<>();
        itemRepo.findAll().forEach(i -> items.put(i.getItmItemId(), i));

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

        int p = Math.max(page, 1);
        int size = Math.min(Math.max(pageSize, 1), 200);
        int from = Math.min((p - 1) * size, rows.size());
        int to = Math.min(from + size, rows.size());
        return PageResponse.of(p, size, rows.size(), rows.subList(from, to));
    }
}
