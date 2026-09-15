package com.caits.modules.dashboard;

import com.caits.domain.entity.DashRoleWidgetDtl;
import com.caits.domain.entity.DashWidgetMst;
import com.caits.domain.entity.InvItemMst;
import com.caits.domain.entity.SysmMenutreeMst;
import com.caits.domain.entity.SysmRolepermissionDtl;
import com.caits.domain.entity.SysmRolesMst;
import com.caits.domain.entity.SysmUserloginMst;
import com.caits.domain.entity.TxnDetailDtl;
import com.caits.domain.entity.TxnHeaderMst;
import com.caits.domain.repository.DashRoleWidgetDtlRepository;
import com.caits.domain.repository.DashWidgetMstRepository;
import com.caits.domain.repository.InvItemMstRepository;
import com.caits.domain.repository.InvStockMstRepository;
import com.caits.domain.repository.InvVendorMstRepository;
import com.caits.domain.repository.SysmMenutreeMstRepository;
import com.caits.domain.repository.SysmRolepermissionDtlRepository;
import com.caits.domain.repository.SysmRolesMstRepository;
import com.caits.domain.repository.SysmUserloginMstRepository;
import com.caits.domain.repository.TxnDetailDtlRepository;
import com.caits.domain.repository.TxnHeaderMstRepository;
import com.caits.modules.dashboard.DashboardDtos.HomeResponse;
import com.caits.modules.dashboard.DashboardDtos.ShortcutDto;
import com.caits.modules.dashboard.DashboardDtos.WidgetDto;
import com.caits.modules.transactions.DocType;
import com.caits.security.AccessScopeService;
import com.caits.security.SecurityUtils;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DashboardHomeService {

    private static final Map<String, String> MENU_PATH = Map.ofEntries(
            Map.entry("AIM", "/masters/items"),
            Map.entry("VPM", "/masters/vendors"),
            Map.entry("STR", "/masters/stores"),
            Map.entry("OPN", "/transactions/opening-stock"),
            Map.entry("SR", "/transactions/requisitions"),
            Map.entry("GRN", "/transactions/grn"),
            Map.entry("GP", "/transactions/gatepass"),
            Map.entry("ISS", "/transactions/issues/pick-requisition"),
            Map.entry("TRF", "/transactions/transfers"),
            Map.entry("RTN", "/transactions/returns"),
            Map.entry("IAPR", "/transactions/inspection-approvals"),
            Map.entry("STKREG", "/reports/stock-register"),
            Map.entry("FULLRPT", "/reports/full-report"),
            Map.entry("STKOWN", "/reports/stock-owner"),
            Map.entry("STKMOV", "/reports/stock-movement"),
            Map.entry("ITEMREG", "/reports/item-register"),
            Map.entry("DASH", "/dashboard")
    );

    private static final Map<String, String> DOC_LABEL = Map.ofEntries(
            Map.entry("OPENING_STOCK", "Opening Stock"),
            Map.entry("MATERIAL_REQUISITION", "Store Requisition"),
            Map.entry("GRN", "GRN"),
            Map.entry("GATEPASS_INWARD", "GP Inward"),
            Map.entry("GATEPASS_OUTWARD", "GP Outward"),
            Map.entry("MATERIAL_ISSUE", "Store Issue"),
            Map.entry("MATERIAL_TRANSFER", "Transfer"),
            Map.entry("MATERIAL_RETURN", "Return"),
            Map.entry("INSPECTION_APPROVAL", "Inspection")
    );

    private static final List<String> SHORTCUT_MENUS = List.of(
            "OPN", "SR", "GRN", "ISS", "IAPR", "GP", "TRF", "RTN", "STKREG", "FULLRPT"
    );

    private final DashWidgetMstRepository widgetRepo;
    private final DashRoleWidgetDtlRepository roleWidgetRepo;
    private final SysmUserloginMstRepository userRepo;
    private final SysmRolesMstRepository roleRepo;
    private final SysmRolepermissionDtlRepository rolePermRepo;
    private final SysmMenutreeMstRepository menuRepo;
    private final InvItemMstRepository itemRepo;
    private final InvVendorMstRepository vendorRepo;
    private final InvStockMstRepository stockRepo;
    private final TxnHeaderMstRepository headerRepo;
    private final TxnDetailDtlRepository detailRepo;
    private final AccessScopeService accessScope;

    public DashboardHomeService(
            DashWidgetMstRepository widgetRepo,
            DashRoleWidgetDtlRepository roleWidgetRepo,
            SysmUserloginMstRepository userRepo,
            SysmRolesMstRepository roleRepo,
            SysmRolepermissionDtlRepository rolePermRepo,
            SysmMenutreeMstRepository menuRepo,
            InvItemMstRepository itemRepo,
            InvVendorMstRepository vendorRepo,
            InvStockMstRepository stockRepo,
            TxnHeaderMstRepository headerRepo,
            TxnDetailDtlRepository detailRepo,
            AccessScopeService accessScope) {
        this.widgetRepo = widgetRepo;
        this.roleWidgetRepo = roleWidgetRepo;
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.rolePermRepo = rolePermRepo;
        this.menuRepo = menuRepo;
        this.itemRepo = itemRepo;
        this.vendorRepo = vendorRepo;
        this.stockRepo = stockRepo;
        this.headerRepo = headerRepo;
        this.detailRepo = detailRepo;
        this.accessScope = accessScope;
    }

    @Transactional(readOnly = true)
    public HomeResponse home() {
        var cu = SecurityUtils.requireCurrentUser();
        SysmUserloginMst user = userRepo.findById(cu.userId()).orElseThrow();
        SysmRolesMst role = roleRepo.findById(user.getUsrRoleIdRol()).orElseThrow();
        Set<String> viewMenus = viewableMenuCodes(role.getRolRoleId());

        List<ResolvedWidget> layout = resolveLayout(role.getRolRoleId(), viewMenus);
        DashboardDataBundle data = loadData(layout, viewMenus);

        List<WidgetDto> widgets = new ArrayList<>();
        for (ResolvedWidget rw : layout) {
            Map<String, Object> payload = buildPayload(rw.widget().getDshwWidgetCode(), data);
            if (payload == null) {
                continue; // hide empty/conditional widgets
            }
            widgets.add(new WidgetDto(
                    rw.widget().getDshwWidgetCode(),
                    rw.widget().getDshwWidgetType(),
                    rw.widget().getDshwTitle(),
                    rw.widget().getDshwSubtitle(),
                    rw.widget().getDshwIcon(),
                    rw.widget().getDshwTone(),
                    rw.widget().getDshwLinkPath(),
                    rw.colSpan(),
                    rw.sortOrder(),
                    payload
            ));
        }

        String roleCode = role.getRolRoleCode();
        return new HomeResponse(
                roleCode,
                role.getRolRoleName(),
                role.getRolRoleName() + " dashboard",
                "Widgets for your role and menus — not a fixed layout.",
                widgets
        );
    }

    private Set<String> viewableMenuCodes(Integer roleId) {
        Map<Integer, SysmRolepermissionDtl> byMenu = rolePermRepo.findByRlpmRoleIdRol(roleId).stream()
                .collect(Collectors.toMap(SysmRolepermissionDtl::getRlpmMenuIdMtree, p -> p, (a, b) -> a));
        Set<String> codes = new HashSet<>();
        for (SysmMenutreeMst menu : menuRepo.findByMtreeIsactiveTrueOrderByMtreeSortOrderAsc()) {
            SysmRolepermissionDtl p = byMenu.get(menu.getMtreeMenuId());
            if (p != null && Boolean.TRUE.equals(p.getRlpmCanView())) {
                codes.add(menu.getMtreeMenuCode().toUpperCase(Locale.ROOT));
            }
        }
        return codes;
    }

    private List<ResolvedWidget> resolveLayout(Integer roleId, Set<String> viewMenus) {
        Map<Integer, DashWidgetMst> byId = widgetRepo.findByDshwIsactiveTrueOrderByDshwDefaultSortAsc().stream()
                .collect(Collectors.toMap(DashWidgetMst::getDshwWidgetId, w -> w, (a, b) -> a, LinkedHashMap::new));

        List<ResolvedWidget> out = new ArrayList<>();
        long mapped = roleWidgetRepo.countByDshrRoleIdRolAndDshrIsVisibleTrue(roleId);
        if (mapped > 0) {
            for (DashRoleWidgetDtl row : roleWidgetRepo.findByDshrRoleIdRolAndDshrIsVisibleTrueOrderByDshrSortOrderAsc(roleId)) {
                DashWidgetMst w = byId.get(row.getDshrWidgetIdDshw());
                if (w == null || !Boolean.TRUE.equals(w.getDshwIsactive())) continue;
                if (!menuAllows(w, viewMenus)) continue;
                out.add(new ResolvedWidget(w, row.getDshrSortOrder(), Math.max(1, row.getDshrColSpan())));
            }
        } else {
            // Fallback: any active widget the user's menus allow.
            for (DashWidgetMst w : byId.values()) {
                if (!menuAllows(w, viewMenus)) continue;
                out.add(new ResolvedWidget(w, w.getDshwDefaultSort(), Math.max(1, w.getDshwDefaultColSpan())));
            }
            out.sort(Comparator.comparingInt(ResolvedWidget::sortOrder));
        }
        return out;
    }

    private static boolean menuAllows(DashWidgetMst w, Set<String> viewMenus) {
        String req = w.getDshwRequiredMenuCode();
        if (req == null || req.isBlank()) return true;
        return viewMenus.contains(req.toUpperCase(Locale.ROOT));
    }

    private DashboardDataBundle loadData(List<ResolvedWidget> layout, Set<String> viewMenus) {
        Set<String> codes = layout.stream().map(r -> r.widget().getDshwWidgetCode()).collect(Collectors.toSet());
        List<Integer> locFilter = accessScope.resolveLocationFilter(null);

        long items = codes.contains("KPI_ITEMS") ? itemRepo.count() : 0;
        long vendors = codes.contains("KPI_VENDORS") ? vendorRepo.count() : 0;

        long lowStock = 0;
        long stockRows = 0;
        if (needsStockKpis(codes)) {
            if (locFilter == null) {
                lowStock = stockRepo.countLowStockAll();
                stockRows = stockRepo.countActiveStockRowsAll();
            } else if (locFilter.isEmpty()) {
                lowStock = 0;
                stockRows = 0;
            } else {
                lowStock = stockRepo.countLowStockByLocations(locFilter);
                stockRows = stockRepo.countActiveStockRowsByLocations(locFilter);
            }
        }

        long txnCount = 0;
        if (codes.contains("KPI_TXNS")) {
            txnCount = countTransactions(locFilter);
        }

        long pendingIapr = 0;
        if (codes.contains("KPI_PENDING_IAPR")) {
            pendingIapr = countHeaders(DocType.INSPECTION_APPROVAL.code(), "Pending", locFilter);
        }
        long pendingSr = 0;
        if (codes.contains("KPI_PENDING_SR")) {
            pendingSr = countHeaders(DocType.MATERIAL_REQUISITION.code(), "Requested", locFilter);
        }

        List<Map<String, Object>> stockByStore = List.of();
        if (codes.contains("CHART_STOCK_BY_STORE")) {
            stockByStore = mapStoreSeries(loadStockByStore(locFilter));
        }

        Map<String, Object> stockHealth = Map.of("inStock", 0, "low", 0, "out", 0);
        if (codes.contains("PANEL_STOCK_HEALTH")) {
            stockHealth = loadStockHealth(locFilter);
        }

        Map<String, Object> stockFocus = Map.of("mode", "top", "title", "Top stock",
                "subtitle", "Highest on-hand quantities", "rows", List.of());
        if (codes.contains("LIST_STOCK_FOCUS")) {
            stockFocus = loadStockFocus(locFilter);
        }

        List<Map<String, Object>> activity = List.of();
        List<Map<String, Object>> docTypes = List.of();
        if (codes.contains("CHART_DOC_BY_TYPE")) {
            docTypes = mapDocTypeSeries(loadDocTypeCounts(locFilter));
        }
        if (codes.contains("LIST_RECENT_ACTIVITY")) {
            activity = buildActivity(loadRecentHeaders(locFilter, 12));
        }

        List<ShortcutDto> shortcuts = List.of();
        if (codes.contains("SHORTCUTS_TXN")) {
            Map<String, String> labels = menuRepo.findByMtreeIsactiveTrueOrderByMtreeSortOrderAsc().stream()
                    .collect(Collectors.toMap(m -> m.getMtreeMenuCode().toUpperCase(Locale.ROOT),
                            SysmMenutreeMst::getMtreeMenuLabel, (a, b) -> a));
            List<ShortcutDto> sc = new ArrayList<>();
            for (String code : SHORTCUT_MENUS) {
                if (!viewMenus.contains(code)) continue;
                String path = MENU_PATH.get(code);
                if (path == null) continue;
                sc.add(new ShortcutDto(code, labels.getOrDefault(code, code), path));
            }
            shortcuts = sc;
        }

        return new DashboardDataBundle(items, vendors, txnCount, lowStock, stockRows, pendingIapr, pendingSr,
                stockByStore, stockHealth, stockFocus, docTypes, activity, shortcuts);
    }

    private boolean needsStockKpis(Set<String> codes) {
        return codes.contains("KPI_LOW_STOCK") || codes.contains("KPI_STOCK_ROWS")
                || codes.contains("ALERT_LOW_STOCK");
    }

    private List<Object[]> loadStockByStore(List<Integer> locFilter) {
        if (locFilter == null) return stockRepo.stockQtyByStoreAll();
        if (locFilter.isEmpty()) return List.of();
        return stockRepo.stockQtyByStoreByLocations(locFilter);
    }

    private Map<String, Object> loadStockHealth(List<Integer> locFilter) {
        List<Object[]> rows;
        if (locFilter == null) {
            rows = stockRepo.stockHealthAll();
        } else if (locFilter.isEmpty()) {
            return Map.of("inStock", 0, "low", 0, "out", 0);
        } else {
            rows = stockRepo.stockHealthByLocations(locFilter);
        }
        Object[] row = (rows == null || rows.isEmpty()) ? new Object[]{0, 0, 0} : rows.get(0);
        // Hibernate sometimes flattens a single aggregate row oddly; normalize.
        if (row.length == 1 && row[0] instanceof Object[] nested) row = nested;
        return Map.of(
                "out", toLong(row, 0),
                "low", toLong(row, 1),
                "inStock", toLong(row, 2)
        );
    }

    private Map<String, Object> loadStockFocus(List<Integer> locFilter) {
        List<Object[]> alertRows;
        if (locFilter == null) {
            alertRows = stockRepo.stockAlertRowsAll(12);
        } else if (locFilter.isEmpty()) {
            alertRows = List.of();
        } else {
            alertRows = stockRepo.stockAlertRowsByLocations(locFilter, 12);
        }

        // Prefer low-stock (qty > 0) so the list shows real numbers; pure zeros are already in Stock health.
        List<Object[]> lowRows = alertRows.stream()
                .filter(r -> toBigDecimal(r[5]).compareTo(BigDecimal.ZERO) > 0)
                .limit(6)
                .toList();
        // Out-of-stock totals belong in Stock health; this list shows quantities when possible.
        Map<String, Object> health = loadStockHealth(locFilter);
        long outTotal = health.get("out") instanceof Number n ? n.longValue() : 0L;

        boolean alertMode = !lowRows.isEmpty();
        List<Object[]> source = lowRows;
        if (!alertMode) {
            if (locFilter == null) source = stockRepo.stockTopRowsAll(6);
            else if (locFilter.isEmpty()) source = List.of();
            else source = stockRepo.stockTopRowsByLocations(locFilter, 6);
        }

        List<Map<String, Object>> rows = mapStockFocusRows(source);

        String subtitle;
        if (alertMode) {
            subtitle = outTotal > 0
                    ? "At/below reorder - " + outTotal + " also out of stock"
                    : "At or below reorder level";
        } else if (outTotal > 0) {
            subtitle = "Highest on-hand - " + outTotal + " out of stock (see Stock health)";
        } else {
            subtitle = "Highest on-hand quantities";
        }

        return Map.of(
                "mode", alertMode ? "alert" : "top",
                "title", alertMode ? "Low stock" : "Top stock",
                "subtitle", subtitle,
                "outOfStock", outTotal,
                "rows", rows
        );
    }

    private static List<Map<String, Object>> mapStockFocusRows(List<Object[]> source) {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Object[] r : source) {
            BigDecimal qty = toBigDecimal(r[5]);
            BigDecimal reorder = r[6] == null ? null : toBigDecimal(r[6]);
            String status = "In Stock";
            if (qty.compareTo(BigDecimal.ZERO) <= 0) status = "Out of Stock";
            else if (reorder != null && reorder.compareTo(BigDecimal.ZERO) > 0 && qty.compareTo(reorder) <= 0) {
                status = "Low Stock";
            }
            rows.add(Map.of(
                    "id", ((Number) r[0]).intValue(),
                    "itemCode", String.valueOf(r[2] == null ? "" : r[2]),
                    "itemName", String.valueOf(r[3] == null ? "" : r[3]),
                    "store", String.valueOf(r[4] == null ? "—" : r[4]),
                    "closing", qty.doubleValue(),
                    "status", status
            ));
        }
        return rows;
    }

    private List<Object[]> loadDocTypeCounts(List<Integer> locFilter) {
        if (locFilter == null) return headerRepo.countByDocTypeAll();
        if (locFilter.isEmpty()) return List.of();
        return headerRepo.countByDocTypeByLocations(locFilter);
    }

    private static List<Map<String, Object>> mapStoreSeries(List<Object[]> rows) {
        return rows.stream()
                .limit(8)
                .map(r -> Map.<String, Object>of(
                        "label", String.valueOf(r[0] == null ? "—" : r[0]),
                        "value", toBigDecimal(r[1]).doubleValue()))
                .toList();
    }

    private static List<Map<String, Object>> mapDocTypeSeries(List<Object[]> rows) {
        return rows.stream()
                .map(r -> {
                    String docType = String.valueOf(r[0] == null ? "OTHER" : r[0]);
                    return Map.<String, Object>of(
                            "label", DOC_LABEL.getOrDefault(docType, docType),
                            "value", toLong(r, 1),
                            "docType", docType);
                })
                .toList();
    }

    private long countTransactions(List<Integer> locFilter) {
        if (locFilter == null) return headerRepo.count();
        if (locFilter.isEmpty()) return 0;
        return headerRepo.count((root, query, cb) -> {
            List<Predicate> ors = new ArrayList<>();
            ors.add(root.get("txhLocationIdLoc").in(locFilter));
            ors.add(root.get("txhFromLocationIdLoc").in(locFilter));
            ors.add(root.get("txhToLocationIdLoc").in(locFilter));
            return cb.or(ors.toArray(Predicate[]::new));
        });
    }

    private long countHeaders(String docType, String status, List<Integer> locFilter) {
        Specification<TxnHeaderMst> spec = (root, query, cb) -> {
            List<Predicate> ands = new ArrayList<>();
            ands.add(cb.equal(root.get("txhDocType"), docType));
            ands.add(cb.equal(cb.lower(root.get("txhStatus")), status.toLowerCase(Locale.ROOT)));
            if (locFilter != null) {
                if (locFilter.isEmpty()) return cb.disjunction();
                List<Predicate> ors = new ArrayList<>();
                ors.add(root.get("txhLocationIdLoc").in(locFilter));
                ors.add(root.get("txhFromLocationIdLoc").in(locFilter));
                ors.add(root.get("txhToLocationIdLoc").in(locFilter));
                ands.add(cb.or(ors.toArray(Predicate[]::new)));
            }
            return cb.and(ands.toArray(Predicate[]::new));
        };
        return headerRepo.count(spec);
    }

    private List<TxnHeaderMst> loadRecentHeaders(List<Integer> locFilter, int limit) {
        Specification<TxnHeaderMst> spec = (root, query, cb) -> {
            if (locFilter == null) return cb.conjunction();
            if (locFilter.isEmpty()) return cb.disjunction();
            List<Predicate> ors = new ArrayList<>();
            ors.add(root.get("txhLocationIdLoc").in(locFilter));
            ors.add(root.get("txhFromLocationIdLoc").in(locFilter));
            ors.add(root.get("txhToLocationIdLoc").in(locFilter));
            return cb.or(ors.toArray(Predicate[]::new));
        };
        return headerRepo.findAll(spec, PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "txhCreatedOn"))).getContent();
    }

    private List<Map<String, Object>> buildActivity(List<TxnHeaderMst> headers) {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (TxnHeaderMst h : headers) {
            List<TxnDetailDtl> lines = detailRepo.findByTxdTxnHeaderIdTxhOrderByTxdSrNoAsc(h.getTxhTxnHeaderId());
            String itemLabel = "—";
            BigDecimal qty = BigDecimal.ZERO;
            if (!lines.isEmpty()) {
                TxnDetailDtl first = lines.get(0);
                InvItemMst item = itemRepo.findById(first.getTxdItemIdItm()).orElse(null);
                itemLabel = item == null ? String.valueOf(first.getTxdItemIdItm())
                        : (item.getItmItemCode() + " - " + item.getItmItemName());
                if (lines.size() > 1) itemLabel += " +" + (lines.size() - 1);
                qty = first.getTxdQty() != null ? first.getTxdQty() : BigDecimal.ZERO;
            }
            rows.add(Map.of(
                    "id", h.getTxhTxnHeaderId(),
                    "date", h.getTxhDocDate() == null ? "" : h.getTxhDocDate().toString(),
                    "txnType", h.getTxhDocType() == null ? "" : h.getTxhDocType(),
                    "txnNo", h.getTxhDocNo() == null ? "" : h.getTxhDocNo(),
                    "item", itemLabel,
                    "qty", qty,
                    "status", h.getTxhStatus() == null ? "" : h.getTxhStatus()
            ));
        }
        return rows;
    }

    private Map<String, Object> buildPayload(String code, DashboardDataBundle d) {
        return switch (code) {
            case "KPI_ITEMS" -> Map.of("value", d.items());
            case "KPI_VENDORS" -> Map.of("value", d.vendors());
            case "KPI_TXNS" -> Map.of("value", d.txnCount());
            case "KPI_LOW_STOCK" -> Map.of("value", d.lowStock());
            case "KPI_STOCK_ROWS" -> Map.of("value", d.stockRows());
            case "KPI_PENDING_IAPR" -> Map.of("value", d.pendingIapr());
            case "KPI_PENDING_SR" -> Map.of("value", d.pendingSr());
            case "ALERT_LOW_STOCK" -> d.lowStock() > 0
                    ? Map.of("value", d.lowStock(), "message", d.lowStock() + " item(s) at or below reorder")
                    : null;
            case "CHART_STOCK_BY_STORE" -> Map.of("series", d.stockByStore());
            case "CHART_DOC_BY_TYPE" -> Map.of("series", d.docTypes());
            case "PANEL_STOCK_HEALTH" -> d.stockHealth();
            case "LIST_STOCK_FOCUS" -> d.stockFocus();
            case "LIST_RECENT_ACTIVITY" -> Map.of("rows", d.activity());
            case "SHORTCUTS_TXN" -> Map.of("items", d.shortcuts());
            default -> Map.of();
        };
    }

    private static long toLong(Object[] row, int idx) {
        if (row == null || idx >= row.length || row[idx] == null) return 0;
        if (row[idx] instanceof Number n) return n.longValue();
        return Long.parseLong(String.valueOf(row[idx]));
    }

    private static BigDecimal toBigDecimal(Object v) {
        if (v == null) return BigDecimal.ZERO;
        if (v instanceof BigDecimal bd) return bd;
        if (v instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        return new BigDecimal(String.valueOf(v));
    }

    private record ResolvedWidget(DashWidgetMst widget, int sortOrder, int colSpan) {}

    private record DashboardDataBundle(
            long items,
            long vendors,
            long txnCount,
            long lowStock,
            long stockRows,
            long pendingIapr,
            long pendingSr,
            List<Map<String, Object>> stockByStore,
            Map<String, Object> stockHealth,
            Map<String, Object> stockFocus,
            List<Map<String, Object>> docTypes,
            List<Map<String, Object>> activity,
            List<ShortcutDto> shortcuts
    ) {}
}
