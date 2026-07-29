package com.caits.modules.dashboard;

import com.caits.domain.entity.InvStockMst;
import com.caits.domain.repository.InvItemMstRepository;
import com.caits.domain.repository.InvStockMstRepository;
import com.caits.domain.repository.InvVendorMstRepository;
import com.caits.domain.repository.TxnHeaderMstRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
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

    public DashboardController(
            InvItemMstRepository itemRepo,
            InvVendorMstRepository vendorRepo,
            InvStockMstRepository stockRepo,
            TxnHeaderMstRepository headerRepo
    ) {
        this.itemRepo = itemRepo;
        this.vendorRepo = vendorRepo;
        this.stockRepo = stockRepo;
        this.headerRepo = headerRepo;
    }

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        List<InvStockMst> stocks = stockRepo.findAll();
        long lowStock = stocks.stream().filter(s -> {
            BigDecimal cur = s.getStkCurrentQty() == null ? BigDecimal.ZERO : s.getStkCurrentQty();
            BigDecimal reorder = s.getStkReorderLevel() == null ? BigDecimal.ZERO : s.getStkReorderLevel();
            return reorder.compareTo(BigDecimal.ZERO) > 0 && cur.compareTo(reorder) <= 0;
        }).count();

        Map<String, Object> body = new HashMap<>();
        body.put("totalItems", itemRepo.count());
        body.put("totalVendors", vendorRepo.count());
        body.put("totalTransactions", headerRepo.count());
        body.put("lowStockCount", lowStock);
        body.put("stockRows", stocks.size());
        return body;
    }
}
