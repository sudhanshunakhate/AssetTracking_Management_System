package com.caits.modules.dashboard;

import com.caits.domain.entity.InvStockMst;
import com.caits.domain.repository.InvItemMstRepository;
import com.caits.domain.repository.InvStockMstRepository;
import com.caits.domain.repository.InvVendorMstRepository;
import com.caits.domain.repository.TxnHeaderMstRepository;
import com.caits.security.AccessScopeService;
import jakarta.persistence.criteria.Predicate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final InvItemMstRepository itemRepo;
    private final InvVendorMstRepository vendorRepo;
    private final InvStockMstRepository stockRepo;
    private final TxnHeaderMstRepository headerRepo;
    private final AccessScopeService accessScope;

    public DashboardController(
            InvItemMstRepository itemRepo,
            InvVendorMstRepository vendorRepo,
            InvStockMstRepository stockRepo,
            TxnHeaderMstRepository headerRepo,
            AccessScopeService accessScope
    ) {
        this.itemRepo = itemRepo;
        this.vendorRepo = vendorRepo;
        this.stockRepo = stockRepo;
        this.headerRepo = headerRepo;
        this.accessScope = accessScope;
    }

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        List<Integer> locFilter = accessScope.resolveLocationFilter(null);

        List<InvStockMst> stocks = locFilter == null
                ? stockRepo.findAll()
                : stockRepo.findAll((root, query, cb) ->
                        locFilter.isEmpty() ? cb.disjunction() : root.get("stkLocationIdLoc").in(locFilter));

        long lowStock = stocks.stream().filter(s -> {
            BigDecimal cur = s.getStkCurrentQty() == null ? BigDecimal.ZERO : s.getStkCurrentQty();
            BigDecimal reorder = s.getStkReorderLevel() == null ? BigDecimal.ZERO : s.getStkReorderLevel();
            return reorder.compareTo(BigDecimal.ZERO) > 0 && cur.compareTo(reorder) <= 0;
        }).count();

        long txnCount = locFilter == null
                ? headerRepo.count()
                : headerRepo.count((root, query, cb) -> {
                    if (locFilter.isEmpty()) return cb.disjunction();
                    List<Predicate> ors = new ArrayList<>();
                    ors.add(root.get("txhLocationIdLoc").in(locFilter));
                    ors.add(root.get("txhFromLocationIdLoc").in(locFilter));
                    ors.add(root.get("txhToLocationIdLoc").in(locFilter));
                    return cb.or(ors.toArray(Predicate[]::new));
                });

        Map<String, Object> body = new HashMap<>();
        body.put("totalItems", itemRepo.count());
        body.put("totalVendors", vendorRepo.count());
        body.put("totalTransactions", txnCount);
        body.put("lowStockCount", lowStock);
        body.put("stockRows", stocks.size());
        return body;
    }
}
