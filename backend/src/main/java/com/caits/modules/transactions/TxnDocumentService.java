package com.caits.modules.transactions;

import com.caits.common.ApiException;
import com.caits.common.MessageResponse;
import com.caits.common.PageResponse;
import com.caits.domain.entity.HrcDepartmentMst;
import com.caits.domain.entity.HrcEmployeeMst;
import com.caits.domain.entity.InvBlsMst;
import com.caits.domain.entity.InvItemMst;
import com.caits.domain.entity.InvStockMst;
import com.caits.domain.entity.InvVendorMst;
import com.caits.domain.entity.OrgLocationMst;
import com.caits.domain.entity.TxnDetailDtl;
import com.caits.domain.entity.TxnHeaderMst;
import com.caits.domain.entity.UnitMst;
import com.caits.domain.repository.HrcDepartmentMstRepository;
import com.caits.domain.repository.HrcEmployeeMstRepository;
import com.caits.domain.repository.InvItemMstRepository;
import com.caits.domain.repository.InvStockMstRepository;
import com.caits.domain.repository.InvVendorMstRepository;
import com.caits.domain.repository.OrgLocationMstRepository;
import com.caits.domain.repository.TxnDetailDtlRepository;
import com.caits.domain.repository.TxnHeaderMstRepository;
import com.caits.domain.repository.UnitMstRepository;
import com.caits.modules.masters.SystemLocationRole;
import com.caits.modules.masters.SystemLocationService;
import com.caits.modules.inventory.BlsService;
import com.caits.modules.transactions.TxnDtos.*;
import com.caits.modules.notifications.TxnLifecycleNotificationEvent;
import com.caits.security.AccessScopeService;
import com.caits.security.CurrentUser;
import com.caits.security.SecurityUtils;
import org.springframework.context.ApplicationEventPublisher;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class TxnDocumentService {

    private final TxnHeaderMstRepository headerRepo;
    private final TxnDetailDtlRepository detailRepo;
    private final InvStockMstRepository stockRepo;
    private final InvItemMstRepository itemRepo;
    private final UnitMstRepository unitRepo;
    private final AccessScopeService accessScope;
    private final BlsService blsService;
    private final SystemLocationService systemLocations;
    private final OrgLocationMstRepository locationRepo;
    private final ApplicationEventPublisher events;
    private final HrcEmployeeMstRepository employeeRepo;
    private final HrcDepartmentMstRepository departmentRepo;
    private final InvVendorMstRepository vendorRepo;

    public TxnDocumentService(
            TxnHeaderMstRepository headerRepo,
            TxnDetailDtlRepository detailRepo,
            InvStockMstRepository stockRepo,
            InvItemMstRepository itemRepo,
            UnitMstRepository unitRepo,
            AccessScopeService accessScope,
            BlsService blsService,
            SystemLocationService systemLocations,
            OrgLocationMstRepository locationRepo,
            ApplicationEventPublisher events,
            HrcEmployeeMstRepository employeeRepo,
            HrcDepartmentMstRepository departmentRepo,
            InvVendorMstRepository vendorRepo
    ) {
        this.headerRepo = headerRepo;
        this.detailRepo = detailRepo;
        this.stockRepo = stockRepo;
        this.itemRepo = itemRepo;
        this.unitRepo = unitRepo;
        this.accessScope = accessScope;
        this.blsService = blsService;
        this.systemLocations = systemLocations;
        this.locationRepo = locationRepo;
        this.events = events;
        this.employeeRepo = employeeRepo;
        this.departmentRepo = departmentRepo;
        this.vendorRepo = vendorRepo;
    }

    public PageResponse<ListItem> list(
            DocType docType,
            String status,
            LocalDate fromDate,
            LocalDate toDate,
            Integer locationId,
            Integer fromLocationId,
            Integer toLocationId,
            Integer departmentId,
            Integer refTxnHeaderId,
            Integer entityId,
            String docSubtype,
            String returnFlag,
            Integer initiatedByEmpId,
            int page,
            int pageSize
    ) {
        int p = Math.max(page, 1);
        int size = Math.min(Math.max(pageSize, 1), 200);

        List<Integer> allowedLocs = accessScope.resolveLocationFilter(null);
        // When the caller asked for a specific location, intersect with the allow-list.
        List<Integer> locFilter = locationId == null
                ? allowedLocs
                : (allowedLocs == null
                        ? List.of(locationId)
                        : (allowedLocs.contains(locationId) ? List.of(locationId) : List.of()));

        Specification<TxnHeaderMst> spec = (root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            preds.add(cb.equal(root.get("txhDocType"), docType.code()));
            if (status != null && !status.isBlank()) {
                preds.add(cb.equal(root.get("txhStatus"), status));
            }
            if (fromDate != null) {
                preds.add(cb.greaterThanOrEqualTo(root.get("txhDocDate"), fromDate));
            }
            if (toDate != null) {
                preds.add(cb.lessThanOrEqualTo(root.get("txhDocDate"), toDate));
            }
            if (locFilter != null) {
                if (locFilter.isEmpty()) {
                    preds.add(cb.disjunction());
                } else {
                    Predicate locMatch = cb.or(
                            root.get("txhLocationIdLoc").in(locFilter),
                            root.get("txhFromLocationIdLoc").in(locFilter),
                            root.get("txhToLocationIdLoc").in(locFilter)
                    );
                    if (docType == DocType.INSPECTION_APPROVAL) {
                        Integer assignee = accessScope.currentEmployeeId();
                        if (assignee != null) {
                            preds.add(cb.or(locMatch, cb.equal(root.get("txhInitiatedByEmpIdEmp"), assignee)));
                        } else {
                            preds.add(locMatch);
                        }
                    } else {
                        preds.add(locMatch);
                    }
                }
            }
            if (fromLocationId != null) {
                preds.add(cb.equal(root.get("txhFromLocationIdLoc"), fromLocationId));
            }
            if (toLocationId != null) {
                preds.add(cb.equal(root.get("txhToLocationIdLoc"), toLocationId));
            }
            if (departmentId != null) {
                preds.add(cb.equal(root.get("txhDepartmentIdDept"), departmentId));
            }
            if (refTxnHeaderId != null) {
                preds.add(cb.equal(root.get("txhRefTxnHeaderIdTxh"), refTxnHeaderId));
            }
            if (entityId != null) {
                preds.add(cb.equal(root.get("txhEntityIdEnt"), entityId));
            }
            if (docSubtype != null && !docSubtype.isBlank()) {
                preds.add(cb.equal(root.get("txhDocSubtype"), docSubtype));
            }
            if (returnFlag != null && !returnFlag.isBlank()) {
                preds.add(cb.equal(root.get("txhReturnFlag"), returnFlag));
            }
            if (initiatedByEmpId != null) {
                preds.add(cb.equal(root.get("txhInitiatedByEmpIdEmp"), initiatedByEmpId));
            }
            return cb.and(preds.toArray(Predicate[]::new));
        };

        // Edited / recently touched first, then newer doc dates, then higher id.
        PageRequest pageable = PageRequest.of(
                p - 1,
                size,
                Sort.by(
                        Sort.Order.desc("txhModifiedOn"),
                        Sort.Order.desc("txhDocDate"),
                        Sort.Order.desc("txhTxnHeaderId")
                )
        );
        Page<TxnHeaderMst> result = headerRepo.findAll(spec, pageable);
        Map<Integer, Integer> lineCounts = lineCountsFor(result.getContent());
        List<ListItem> data = result.getContent().stream()
                .map(h -> toListItem(h, lineCounts.getOrDefault(h.getTxhTxnHeaderId(), 0)))
                .toList();
        return PageResponse.of(p, size, result.getTotalElements(), data);
    }

    private Map<Integer, Integer> lineCountsFor(List<TxnHeaderMst> headers) {
        if (headers.isEmpty()) {
            return Map.of();
        }
        List<Integer> ids = headers.stream().map(TxnHeaderMst::getTxhTxnHeaderId).toList();
        Map<Integer, Integer> counts = new HashMap<>();
        for (Object[] row : detailRepo.countLinesByHeaderIds(ids)) {
            counts.put((Integer) row[0], ((Number) row[1]).intValue());
        }
        return counts;
    }

    public DocumentResponse get(DocType docType, Integer docId) {
        TxnHeaderMst header = requireHeader(docType, docId);
        List<TxnDetailDtl> lines = detailRepo.findByTxdTxnHeaderIdTxhOrderByTxdSrNoAsc(header.getTxhTxnHeaderId());
        return toDocument(header, lines, null);
    }

    /**
     * Items currently allotted to an employee: posted Issue / Opening Stock (Issued)
     * minus posted Material Return, plus serial/batch units still marked issued-to on BLS.
     */
    public AllottedItemsResponse listAllottedItems(Integer employeeId) {
        if (employeeId == null) {
            return new AllottedItemsResponse(List.of(), List.of(), List.of());
        }

        Map<Integer, BigDecimal> net = new HashMap<>();
        Set<Integer> headerIds = new HashSet<>();
        for (TxnDetailDtl d : detailRepo.findByTxdIssuedToEmpIdEmp(employeeId)) {
            if (d.getTxdTxnHeaderIdTxh() != null) {
                headerIds.add(d.getTxdTxnHeaderIdTxh());
            }
        }
        headerRepo.findAll((root, query, cb) -> cb.and(
                root.get("txhDocType").in(
                        DocType.MATERIAL_ISSUE.code(),
                        DocType.MATERIAL_RETURN.code(),
                        DocType.OPENING_STOCK.code()),
                cb.or(
                        cb.equal(root.get("txhInitiatedByEmpIdEmp"), employeeId),
                        cb.and(
                                cb.equal(root.get("txhDocType"), DocType.MATERIAL_ISSUE.code()),
                                cb.equal(root.get("txhHandedOverToEmpIdEmp"), employeeId)
                        )
                )
        )).forEach(h -> headerIds.add(h.getTxhTxnHeaderId()));

        if (!headerIds.isEmpty()) {
            Map<Integer, TxnHeaderMst> headers = new HashMap<>();
            headerRepo.findAllById(headerIds).forEach(h -> headers.put(h.getTxhTxnHeaderId(), h));
            for (TxnHeaderMst header : headers.values()) {
                if (!isPostedStatus(header.getTxhStatus())) {
                    continue;
                }
                DocType type;
                try {
                    type = DocType.fromCode(header.getTxhDocType());
                } catch (IllegalArgumentException ex) {
                    continue;
                }
                Integer headerEmp = header.getTxhHandedOverToEmpIdEmp() != null
                        ? header.getTxhHandedOverToEmpIdEmp()
                        : header.getTxhInitiatedByEmpIdEmp();
                for (TxnDetailDtl line : detailRepo.findByTxdTxnHeaderIdTxhOrderByTxdSrNoAsc(header.getTxhTxnHeaderId())) {
                    Integer itemId = line.getTxdItemIdItm();
                    if (itemId == null) {
                        continue;
                    }
                    BigDecimal qty = resolveQty(type, line);
                    if (qty == null || qty.compareTo(BigDecimal.ZERO) == 0) {
                        continue;
                    }
                    if (type == DocType.MATERIAL_ISSUE) {
                        Integer emp = line.getTxdIssuedToEmpIdEmp() != null
                                ? line.getTxdIssuedToEmpIdEmp()
                                : headerEmp;
                        if (employeeId.equals(emp)) {
                            addNet(net, itemId, qty);
                        }
                    } else if (type == DocType.OPENING_STOCK) {
                        if (employeeId.equals(line.getTxdIssuedToEmpIdEmp())) {
                            addNet(net, itemId, qty);
                        }
                    } else if (type == DocType.MATERIAL_RETURN) {
                        if (employeeId.equals(header.getTxhInitiatedByEmpIdEmp())) {
                            addNet(net, itemId, qty.negate());
                        }
                    }
                }
            }
        }

        Map<Integer, Long> blsUnitCount = new HashMap<>();
        for (InvBlsMst bls : blsService.listUnitsIssuedTo(employeeId)) {
            Integer itemId = bls.getIbmItemIdItm();
            if (itemId == null) {
                continue;
            }
            blsUnitCount.merge(itemId, 1L, Long::sum);
        }

        Set<Integer> allotted = new HashSet<>();
        for (Map.Entry<Integer, BigDecimal> e : net.entrySet()) {
            if (e.getValue().compareTo(BigDecimal.ZERO) > 0) {
                allotted.add(e.getKey());
            }
        }
        allotted.addAll(blsUnitCount.keySet());

        List<AllottedItemQty> quantities = new ArrayList<>();
        for (Integer itemId : allotted) {
            BigDecimal fromNet = net.getOrDefault(itemId, BigDecimal.ZERO);
            long fromBls = blsUnitCount.getOrDefault(itemId, 0L);
            BigDecimal qty = fromNet.compareTo(BigDecimal.ZERO) > 0 ? fromNet : BigDecimal.valueOf(fromBls);
            if (fromBls > 0 && qty.compareTo(BigDecimal.valueOf(fromBls)) < 0) {
                qty = BigDecimal.valueOf(fromBls);
            }
            if (qty.compareTo(BigDecimal.ZERO) > 0) {
                quantities.add(new AllottedItemQty(itemId, qty));
            }
        }
        quantities.sort(Comparator.comparing(AllottedItemQty::itemId));

        List<Integer> ids = quantities.stream().map(AllottedItemQty::itemId).toList();

        List<AllottedUnit> units = new ArrayList<>();
        Set<Integer> idSet = new HashSet<>(ids);
        for (InvBlsMst bls : blsService.listUnitsIssuedTo(employeeId)) {
            Integer itemId = bls.getIbmItemIdItm();
            if (itemId == null || !idSet.contains(itemId)) {
                continue;
            }
            units.add(new AllottedUnit(
                    itemId,
                    bls.getIbmSerialNo(),
                    bls.getIbmIpAddress(),
                    bls.getIbmMacAddress(),
                    bls.getIbmHostname(),
                    bls.getIbmBatchNo()
            ));
        }
        return new AllottedItemsResponse(ids, units, quantities);
    }

    /**
     * Items currently allotted to a department: posted Department Issues minus posted
     * Material Returns for that department, plus serial/batch units at the department's mapped location.
     */
    public AllottedItemsResponse listAllottedItemsForDepartment(Integer departmentId) {
        if (departmentId == null) {
            return new AllottedItemsResponse(List.of(), List.of(), List.of());
        }

        Map<Integer, BigDecimal> net = new HashMap<>();
        List<TxnHeaderMst> headers = headerRepo.findAll((root, query, cb) -> cb.and(
                root.get("txhDocType").in(
                        DocType.MATERIAL_ISSUE.code(),
                        DocType.MATERIAL_RETURN.code()),
                cb.equal(root.get("txhDepartmentIdDept"), departmentId)
        ));

        for (TxnHeaderMst header : headers) {
            if (!isPostedStatus(header.getTxhStatus())) {
                continue;
            }
            DocType type;
            try {
                type = DocType.fromCode(header.getTxhDocType());
            } catch (IllegalArgumentException ex) {
                continue;
            }
            for (TxnDetailDtl line : detailRepo.findByTxdTxnHeaderIdTxhOrderByTxdSrNoAsc(header.getTxhTxnHeaderId())) {
                Integer itemId = line.getTxdItemIdItm();
                if (itemId == null) {
                    continue;
                }
                BigDecimal qty = resolveQty(type, line);
                if (qty == null || qty.compareTo(BigDecimal.ZERO) == 0) {
                    continue;
                }
                if (type == DocType.MATERIAL_ISSUE) {
                    // Only department-targeted issues (exclude employee issues that happen to carry a dept id).
                    String subtype = header.getTxhDocSubtype();
                    if (subtype == null || !"DEPARTMENT".equalsIgnoreCase(subtype.trim())) {
                        continue;
                    }
                    addNet(net, itemId, qty);
                } else if (type == DocType.MATERIAL_RETURN) {
                    addNet(net, itemId, qty.negate());
                }
            }
        }

        Integer deptLoc = resolveDepartmentLocationId(departmentId);
        Map<Integer, Long> blsUnitCount = new HashMap<>();
        List<InvBlsMst> blsAtDept = deptLoc == null
                ? List.of()
                : blsService.listUnitsAtLocationNotIssued(deptLoc);
        for (InvBlsMst bls : blsAtDept) {
            Integer itemId = bls.getIbmItemIdItm();
            if (itemId == null) {
                continue;
            }
            blsUnitCount.merge(itemId, 1L, Long::sum);
        }

        Set<Integer> allotted = new HashSet<>();
        for (Map.Entry<Integer, BigDecimal> e : net.entrySet()) {
            if (e.getValue().compareTo(BigDecimal.ZERO) > 0) {
                allotted.add(e.getKey());
            }
        }
        // Only bring in BLS units for items that still have positive issue−return net
        // (avoids treating unrelated stock sitting at the department location as allotted).
        Set<Integer> netPositive = new HashSet<>(allotted);

        List<AllottedItemQty> quantities = new ArrayList<>();
        for (Integer itemId : allotted) {
            BigDecimal fromNet = net.getOrDefault(itemId, BigDecimal.ZERO);
            long fromBls = netPositive.contains(itemId) ? blsUnitCount.getOrDefault(itemId, 0L) : 0L;
            BigDecimal qty = fromNet.compareTo(BigDecimal.ZERO) > 0 ? fromNet : BigDecimal.ZERO;
            if (fromBls > 0 && qty.compareTo(BigDecimal.valueOf(fromBls)) < 0) {
                qty = BigDecimal.valueOf(fromBls);
            }
            if (qty.compareTo(BigDecimal.ZERO) > 0) {
                quantities.add(new AllottedItemQty(itemId, qty));
            }
        }
        quantities.sort(Comparator.comparing(AllottedItemQty::itemId));

        List<Integer> ids = quantities.stream().map(AllottedItemQty::itemId).toList();
        Set<Integer> idSet = new HashSet<>(ids);

        List<AllottedUnit> units = new ArrayList<>();
        for (InvBlsMst bls : blsAtDept) {
            Integer itemId = bls.getIbmItemIdItm();
            if (itemId == null || !idSet.contains(itemId)) {
                continue;
            }
            // Prefer serial/batch identity rows for the picker; skip empty identity.
            String serial = bls.getIbmSerialNo();
            String batch = bls.getIbmBatchNo();
            boolean hasSerial = serial != null && !serial.isBlank();
            boolean hasBatch = batch != null && !batch.isBlank();
            if (!hasSerial && !hasBatch) {
                continue;
            }
            units.add(new AllottedUnit(
                    itemId,
                    bls.getIbmSerialNo(),
                    bls.getIbmIpAddress(),
                    bls.getIbmMacAddress(),
                    bls.getIbmHostname(),
                    bls.getIbmBatchNo()
            ));
        }
        return new AllottedItemsResponse(ids, units, quantities);
    }

    /**
     * Serial units available to Issue / Transfer at a store.
     * When {@code locationId} is set, only serials that both (a) are not currently issued
     * and (b) have positive on-hand stock at that location (stock batch = serial) are returned.
     * This keeps the picker aligned with what stock posting can actually move.
     */
    @Transactional(readOnly = true)
    public List<AvailableSerialUnit> listAvailableSerials(Integer itemId, Integer locationId) {
        if (itemId == null) {
            return List.of();
        }
        Set<String> inStockBatches = locationId == null
                ? null
                : positiveStockBatches(itemId, locationId);
        if (inStockBatches != null && inStockBatches.isEmpty()) {
            return List.of();
        }
        List<AvailableSerialUnit> out = new ArrayList<>();
        List<InvBlsMst> units = blsService.listAvailableSerials(itemId, locationId);
        Map<Integer, InboundPartyInfo> partyByBls = safeInboundPartiesForBlsIds(
                units.stream().map(InvBlsMst::getIbmBlsId).filter(id -> id != null).toList());
        for (InvBlsMst bls : units) {
            String serial = bls.getIbmSerialNo();
            if (inStockBatches != null) {
                if (serial == null || serial.isBlank()) {
                    continue;
                }
                if (!inStockBatches.contains(serial.trim().toUpperCase())) {
                    continue;
                }
            }
            InboundPartyInfo party = partyByBls.get(bls.getIbmBlsId());
            out.add(toAvailableSerialUnit(bls, party));
        }
        return out;
    }

    /** Batch/serial keys with positive available (or current) qty for an item at one location. */
    private Set<String> positiveStockBatches(Integer itemId, Integer locationId) {
        Set<String> out = new HashSet<>();
        List<InvStockMst> rows = stockRepo.findAll((root, query, cb) -> cb.and(
                cb.equal(root.get("stkItemIdItm"), itemId),
                cb.equal(root.get("stkLocationIdLoc"), locationId)
        ));
        for (InvStockMst stock : rows) {
            BigDecimal avail = nz(stock.getStkAvailableQty());
            if (avail.compareTo(BigDecimal.ZERO) <= 0) {
                avail = nz(stock.getStkCurrentQty());
            }
            if (avail.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            String batch = stock.getStkBatchLotNo();
            if (batch == null || batch.isBlank()) {
                continue;
            }
            out.add(batch.trim().toUpperCase());
        }
        return out;
    }

    /**
     * All free serials at one store (not issued, positive on-hand) — one round-trip for Transfer item step.
     */
    @Transactional(readOnly = true)
    public List<AvailableSerialUnit> listAvailableSerialsAtLocation(Integer locationId) {
        if (locationId == null) {
            return List.of();
        }
        Set<String> inStock = new HashSet<>();
        List<InvStockMst> stocks = stockRepo.findAll((root, query, cb) ->
                cb.equal(root.get("stkLocationIdLoc"), locationId));
        for (InvStockMst stock : stocks) {
            BigDecimal avail = nz(stock.getStkAvailableQty());
            if (avail.compareTo(BigDecimal.ZERO) <= 0) {
                avail = nz(stock.getStkCurrentQty());
            }
            if (avail.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            String batch = stock.getStkBatchLotNo();
            if (batch == null || batch.isBlank() || stock.getStkItemIdItm() == null) {
                continue;
            }
            inStock.add(stock.getStkItemIdItm() + "|" + batch.trim().toUpperCase());
        }
        if (inStock.isEmpty()) {
            return List.of();
        }
        List<AvailableSerialUnit> out = new ArrayList<>();
        List<InvBlsMst> units = blsService.listAvailableSerialsAtLocation(locationId);
        Map<Integer, InboundPartyInfo> partyByBls = safeInboundPartiesForBlsIds(
                units.stream().map(InvBlsMst::getIbmBlsId).filter(id -> id != null).toList());
        for (InvBlsMst bls : units) {
            String serial = bls.getIbmSerialNo();
            if (serial == null || serial.isBlank()) {
                continue;
            }
            String key = bls.getIbmItemIdItm() + "|" + serial.trim().toUpperCase();
            if (!inStock.contains(key)) {
                continue;
            }
            InboundPartyInfo party = partyByBls.get(bls.getIbmBlsId());
            out.add(toAvailableSerialUnit(bls, party));
        }
        return out;
    }

    private AvailableSerialUnit toAvailableSerialUnit(InvBlsMst bls, InboundPartyInfo party) {
        return new AvailableSerialUnit(
                bls.getIbmBlsId(),
                bls.getIbmItemIdItm(),
                bls.getIbmCurrentLocationIdLoc(),
                bls.getIbmSerialNo(),
                bls.getIbmIpAddress(),
                bls.getIbmMacAddress(),
                bls.getIbmHostname(),
                bls.getIbmBatchNo(),
                bls.getIbmItemCondition(),
                party != null ? party.partyId() : null,
                party != null ? party.partyName() : null
        );
    }

    /** Never fail serial listing because inbound party lookup failed. */
    private Map<Integer, InboundPartyInfo> safeInboundPartiesForBlsIds(List<Integer> blsIds) {
        try {
            return inboundPartiesForBlsIds(blsIds);
        } catch (Exception ignored) {
            return Map.of();
        }
    }

    /**
     * Vendor / party from the GRN or Opening Stock that received the unit (or item at store).
     * Used by Gatepass Outward to prefill Customer / Party after item selection.
     */
    @Transactional(readOnly = true)
    public InboundPartyInfo resolveInboundParty(Integer blsId, Integer itemId, Integer locationId) {
        if (blsId != null) {
            InboundPartyInfo fromBls = inboundPartiesForBlsIds(List.of(blsId)).get(blsId);
            if (fromBls != null) {
                return fromBls;
            }
        }
        if (itemId == null || locationId == null) {
            return new InboundPartyInfo(null, null, null);
        }
        List<Object[]> rows = detailRepo.findInboundPartiesByItemAndLocation(itemId, locationId);
        if (rows == null || rows.isEmpty()) {
            return new InboundPartyInfo(null, null, null);
        }
        Object[] row = rows.get(0);
        Integer partyId = (Integer) row[0];
        InboundPartyInfo info = toInboundParty(partyId, null);
        return info != null ? info : new InboundPartyInfo(null, null, null);
    }

    private Map<Integer, InboundPartyInfo> inboundPartiesForBlsIds(List<Integer> blsIds) {
        Map<Integer, InboundPartyInfo> out = new HashMap<>();
        if (blsIds == null || blsIds.isEmpty()) {
            return out;
        }
        List<Object[]> rows = detailRepo.findInboundPartiesByBlsIds(blsIds);
        // Prefer earliest inbound document per BLS (original receipt).
        Map<Integer, Object[]> best = new HashMap<>();
        for (Object[] row : rows) {
            Integer blsId = (Integer) row[0];
            if (blsId == null) {
                continue;
            }
            Object[] prev = best.get(blsId);
            if (prev == null) {
                best.put(blsId, row);
                continue;
            }
            LocalDate prevDate = (LocalDate) prev[2];
            LocalDate curDate = (LocalDate) row[2];
            Integer prevHeader = (Integer) prev[3];
            Integer curHeader = (Integer) row[3];
            boolean earlier = curDate != null && (prevDate == null || curDate.isBefore(prevDate)
                    || (curDate.equals(prevDate) && curHeader != null && prevHeader != null && curHeader < prevHeader));
            if (earlier) {
                best.put(blsId, row);
            }
        }
        Set<Integer> partyIds = new HashSet<>();
        for (Object[] row : best.values()) {
            if (row[1] instanceof Integer partyId) {
                partyIds.add(partyId);
            }
        }
        Map<Integer, String> names = vendorNames(partyIds);
        for (Map.Entry<Integer, Object[]> e : best.entrySet()) {
            Integer partyId = (Integer) e.getValue()[1];
            out.put(e.getKey(), toInboundParty(partyId, names.get(partyId)));
        }
        return out;
    }

    private Map<Integer, String> vendorNames(Set<Integer> partyIds) {
        Map<Integer, String> names = new HashMap<>();
        if (partyIds == null || partyIds.isEmpty()) {
            return names;
        }
        for (InvVendorMst v : vendorRepo.findAllById(partyIds)) {
            if (v.getVndVendorId() == null) {
                continue;
            }
            String code = v.getVndVendorCode() != null ? v.getVndVendorCode().trim() : "";
            String name = v.getVndVendorName() != null ? v.getVndVendorName().trim() : "";
            names.put(v.getVndVendorId(), code.isEmpty() ? name : (name.isEmpty() ? code : code + " - " + name));
        }
        return names;
    }

    private InboundPartyInfo toInboundParty(Integer partyId, String knownName) {
        if (partyId == null) {
            return null;
        }
        String name = knownName;
        if (name == null || name.isBlank()) {
            name = vendorNames(Set.of(partyId)).get(partyId);
        }
        if (name == null || name.isBlank()) {
            name = String.valueOf(partyId);
        }
        return new InboundPartyInfo(partyId, name, null);
    }

    @Transactional
    public DocumentResponse create(DocType docType, DocumentRequest req) {
        if (docType == DocType.INSPECTION_APPROVAL && req.refTxnHeaderId() == null) {
            throw ApiException.badRequest("Inspection approval must be linked to a source document (GRN or Gatepass Inward)");
        }
        validateLines(docType, req.lines());
        validateGatepassParty(docType, req);
        validateNormalGatepassOutwardSystemLocation(docType, req);
        validateInspectionRouting(docType, req);
        requireWriteLocations(docType, req);
        String action = normalizeAction(req.docSubmitAction());
        String status = resolveStatusOnSave(docType, action);

        TxnHeaderMst header = new TxnHeaderMst();
        applyHeader(header, docType, req, false);
        header.setTxhDocNo(nextDocNo(docType));
        header.setTxhStatus(status);
        header.setTxhCreatedBy(SecurityUtils.loginIdOrSystem());
        header.setTxhCreatedOn(LocalDateTime.now());
        header = headerRepo.save(header);

        List<TxnDetailDtl> savedLines = saveLines(header, docType, req.lines());
        if (docType == DocType.INSPECTION_APPROVAL) {
            ensureInspectionQuarantineOnHeader(header, savedLines);
            header = headerRepo.save(header);
        }
        if (docType == DocType.GATEPASS_INWARD) {
            syncNewGatepassInwardHeaderFromLines(header, savedLines);
            header = headerRepo.save(header);
        }
        if ("SUBMIT".equals(action) || "REJECT".equals(action)) {
            if (docType == DocType.INSPECTION_APPROVAL) {
                requireInspectionApprovalActor(header);
            }
            if (docType == DocType.GRN && "SUBMIT".equals(action)) {
                validateGrnInspectionRequirements(header, savedLines);
            }
            if (docType == DocType.GATEPASS_INWARD && "SUBMIT".equals(action)) {
                validateGrnInspectionRequirements(header, savedLines);
            }
            if ("SUBMIT".equals(action) && shouldPostStockOnSubmit(docType, header)) {
                if (docType == DocType.INSPECTION_APPROVAL) {
                    stampInspectionApproved(header);
                }
                postStock(header, savedLines, true);
                if (docType == DocType.INSPECTION_APPROVAL) {
                    syncLinkedSourceLocationsAfterInspection(header, savedLines);
                }
                boolean awaitingInspection = false;
                if (docType == DocType.GRN || docType == DocType.GATEPASS_INWARD) {
                    awaitingInspection = createPendingInspectionApproval(header, savedLines);
                }
                header.setTxhStatus(awaitingInspection
                        ? "Under Inspection"
                        : resolveSubmitStatusAfterPosting(docType, header));
                header.setTxhPostingDate(header.getTxhPostingDate() != null ? header.getTxhPostingDate() : LocalDate.now());
                header = headerRepo.save(header);
                markLinkedRequisitionIssued(docType, header);
            } else if ("SUBMIT".equals(action) && docType == DocType.GATEPASS_OUTWARD
                    && isLinkedMaterialTransfer(header.getTxhRefTxnHeaderIdTxh())) {
                // Linked outward is gate documentation only — stock already moved on the transfer.
                header.setTxhStatus(resolveSubmitStatusAfterPosting(docType, header));
                header.setTxhPostingDate(header.getTxhPostingDate() != null ? header.getTxhPostingDate() : LocalDate.now());
                header = headerRepo.save(header);
            } else if ("REJECT".equals(action) && docType == DocType.INSPECTION_APPROVAL) {
                stampInspectionApproved(header);
                postInspectionRejectStock(header, savedLines, true);
                syncLinkedSourceLocationsAfterInspectionReject(header, savedLines);
                header.setTxhStatus("Rejected");
                header.setTxhPostingDate(LocalDate.now());
                header = headerRepo.save(header);
            }
            if ("SUBMIT".equals(action)) {
                markLinkedTransferCompleted(docType, header);
            }
        }
        emitLifecycle(action, docType, header);
        return toDocument(header, savedLines, docType.name().replace('_', ' ') + " created successfully");
    }

    @Transactional
    public DocumentResponse update(DocType docType, Integer docId, DocumentRequest req) {
        TxnHeaderMst header = requireHeader(docType, docId);
        if (!isEditable(header)) {
            throw ApiException.conflict("Only draft / pending documents can be updated");
        }
        validateLines(docType, req.lines());
        validateGatepassParty(docType, req);
        validateNormalGatepassOutwardSystemLocation(docType, req);
        validateInspectionRouting(docType, req);
        requireWriteLocations(docType, req);

        applyHeader(header, docType, req, true);
        String action = normalizeAction(req.docSubmitAction());
        if ("SAVE_DRAFT".equals(action)) {
            header.setTxhStatus(draftStatus(docType));
        } else if ("REJECT".equals(action) && docType == DocType.INSPECTION_APPROVAL) {
            header.setTxhStatus("Rejected");
        } else if ("SUBMIT".equals(action)) {
            header.setTxhStatus(initialSubmitStatus(docType));
        }
        header.setTxhModifiedBy(SecurityUtils.loginIdOrSystem());
        header.setTxhModifiedOn(LocalDateTime.now());
        header = headerRepo.save(header);

        detailRepo.deleteByTxdTxnHeaderIdTxh(header.getTxhTxnHeaderId());
        List<TxnDetailDtl> savedLines = saveLines(header, docType, req.lines());

        if (docType == DocType.INSPECTION_APPROVAL) {
            ensureInspectionQuarantineOnHeader(header, savedLines);
            header = headerRepo.save(header);
        }
        if (docType == DocType.GATEPASS_INWARD) {
            syncNewGatepassInwardHeaderFromLines(header, savedLines);
            header = headerRepo.save(header);
        }

        if ("SUBMIT".equals(action) || "REJECT".equals(action)) {
            if (docType == DocType.INSPECTION_APPROVAL) {
                requireInspectionApprovalActor(header);
            }
            if (docType == DocType.GRN && "SUBMIT".equals(action)) {
                validateGrnInspectionRequirements(header, savedLines);
            }
            if (docType == DocType.GATEPASS_INWARD && "SUBMIT".equals(action)) {
                validateGrnInspectionRequirements(header, savedLines);
            }
            if ("SUBMIT".equals(action) && shouldPostStockOnSubmit(docType, header)) {
                if (docType == DocType.INSPECTION_APPROVAL) {
                    stampInspectionApproved(header);
                }
                postStock(header, savedLines, true);
                if (docType == DocType.INSPECTION_APPROVAL) {
                    syncLinkedSourceLocationsAfterInspection(header, savedLines);
                }
                boolean awaitingInspection = false;
                if (docType == DocType.GRN || docType == DocType.GATEPASS_INWARD) {
                    awaitingInspection = createPendingInspectionApproval(header, savedLines);
                }
                header.setTxhStatus(awaitingInspection
                        ? "Under Inspection"
                        : resolveSubmitStatusAfterPosting(docType, header));
                header.setTxhPostingDate(LocalDate.now());
                header = headerRepo.save(header);
                markLinkedRequisitionIssued(docType, header);
            } else if ("SUBMIT".equals(action) && docType == DocType.GATEPASS_OUTWARD
                    && isLinkedMaterialTransfer(header.getTxhRefTxnHeaderIdTxh())) {
                header.setTxhStatus(resolveSubmitStatusAfterPosting(docType, header));
                header.setTxhPostingDate(LocalDate.now());
                header = headerRepo.save(header);
            } else if ("REJECT".equals(action) && docType == DocType.INSPECTION_APPROVAL) {
                stampInspectionApproved(header);
                postInspectionRejectStock(header, savedLines, true);
                syncLinkedSourceLocationsAfterInspectionReject(header, savedLines);
                header.setTxhStatus("Rejected");
                header.setTxhPostingDate(LocalDate.now());
                header = headerRepo.save(header);
            }
            if ("SUBMIT".equals(action)) {
                markLinkedTransferCompleted(docType, header);
            }
        }
        emitLifecycle(action, docType, header);
        return toDocument(header, savedLines, "Document updated successfully");
    }

    /**
     * Posted store issues cannot be re-lined (stock already posted). Allow serial / network
     * identity edits on existing lines and the linked BLS row only.
     */
    @Transactional
    public DocumentResponse patchPostedIssueIdentity(Integer docId, DocumentRequest req) {
        TxnHeaderMst header = requireHeader(DocType.MATERIAL_ISSUE, docId);
        requireDocumentVisible(header);
        if (req.lines() == null || req.lines().isEmpty()) {
            throw ApiException.badRequest("At least one line is required");
        }
        List<TxnDetailDtl> existing = detailRepo.findByTxdTxnHeaderIdTxhOrderByTxdSrNoAsc(header.getTxhTxnHeaderId());
        Map<Integer, TxnDetailDtl> byDetailId = new HashMap<>();
        Map<Integer, TxnDetailDtl> bySrNo = new HashMap<>();
        for (TxnDetailDtl d : existing) {
            if (d.getTxdTxnDetailId() != null) byDetailId.put(d.getTxdTxnDetailId(), d);
            if (d.getTxdSrNo() != null) bySrNo.put(d.getTxdSrNo(), d);
        }
        for (LineRequest line : req.lines()) {
            TxnDetailDtl d = null;
            if (line.detailId() != null) {
                d = byDetailId.get(line.detailId());
            }
            if (d == null && line.srNo() != null) {
                d = bySrNo.get(line.srNo());
            }
            if (d == null) {
                throw ApiException.badRequest("Issue line not found for identity update");
            }
            if (line.serialNo() != null) d.setTxdSerialNo(blankToNull(line.serialNo()));
            if (line.ipAddress() != null) d.setTxdIpAddress(blankToNull(line.ipAddress()));
            if (line.macAddress() != null) d.setTxdMacAddress(blankToNull(line.macAddress()));
            if (line.hostname() != null) d.setTxdHostname(blankToNull(line.hostname()));
            detailRepo.save(d);
            blsService.patchUnitIdentity(
                    d.getTxdBlsIdIbm(),
                    d.getTxdSerialNo(),
                    d.getTxdIpAddress(),
                    d.getTxdMacAddress(),
                    d.getTxdHostname());
        }
        header.setTxhModifiedBy(SecurityUtils.loginIdOrSystem());
        header.setTxhModifiedOn(LocalDateTime.now());
        header = headerRepo.save(header);
        return toDocument(header, existing, "Issue identity fields updated");
    }

    private static String blankToNull(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }

    @Transactional
    public MessageResponse delete(DocType docType, Integer docId) {
        TxnHeaderMst header = requireHeader(docType, docId);
        if (!isEditable(header)) {
            throw ApiException.conflict("Only draft / pending documents can be deleted");
        }
        detailRepo.deleteByTxdTxnHeaderIdTxh(header.getTxhTxnHeaderId());
        headerRepo.delete(header);
        return MessageResponse.of("Document deleted successfully");
    }

    @Transactional
    public DocumentResponse approve(DocType docType, Integer docId, ApproveRequest req) {
        TxnHeaderMst header = requireHeader(docType, docId);
        if (!"Pending Approval".equalsIgnoreCase(header.getTxhStatus())) {
            throw ApiException.conflict("Only Pending Approval documents can be approved");
        }
        header.setTxhApprovedByEmpIdEmp(req != null ? req.approvedByEmpId() : null);
        header.setTxhApprovedDate(LocalDate.now());
        if (req != null && req.remarks() != null && !req.remarks().isBlank()) {
            header.setTxhRemarks(req.remarks());
        }
        List<TxnDetailDtl> lines = detailRepo.findByTxdTxnHeaderIdTxhOrderByTxdSrNoAsc(header.getTxhTxnHeaderId());
        postStock(header, lines, true);
        header.setTxhStatus("Approved");
        header.setTxhPostingDate(LocalDate.now());
        header.setTxhModifiedBy(SecurityUtils.loginIdOrSystem());
        header.setTxhModifiedOn(LocalDateTime.now());
        header = headerRepo.save(header);
        emitKind("APPROVED", docType, header);
        return toDocument(header, lines, "Document approved successfully");
    }

    @Transactional
    public MessageResponse reject(DocType docType, Integer docId, RejectRequest req) {
        TxnHeaderMst header = requireHeader(docType, docId);
        if (!"Pending Approval".equalsIgnoreCase(header.getTxhStatus())) {
            throw ApiException.conflict("Only Pending Approval documents can be rejected");
        }
        if (req == null || req.reason() == null || req.reason().isBlank()) {
            throw ApiException.badRequest("Rejection reason is required");
        }
        header.setTxhStatus("Rejected");
        header.setTxhRemarks(req.reason());
        header.setTxhModifiedBy(SecurityUtils.loginIdOrSystem());
        header.setTxhModifiedOn(LocalDateTime.now());
        headerRepo.save(header);
        emitKind("REJECTED", docType, header);
        return MessageResponse.of("Document rejected successfully");
    }

    public DocumentResponse printView(DocType docType, Integer docId) {
        return get(docType, docId);
    }

    /**
     * Creates missing Pending inspection approvals for completed GRNs that have
     * inspection-needed lines but no linked approval yet (e.g. submitted before auto-create existed).
     */
    @Transactional
    public void syncPendingInspectionsFromGrn() {
        Specification<TxnHeaderMst> grnSpec = (root, query, cb) -> cb.and(
                cb.equal(root.get("txhDocType"), DocType.GRN.code()),
                cb.or(
                        cb.equal(root.get("txhStatus"), initialSubmitStatus(DocType.GRN)),
                        cb.equal(cb.lower(root.get("txhStatus")), "under inspection")
                )
        );
        List<TxnHeaderMst> grns = headerRepo.findAll(grnSpec);
        for (TxnHeaderMst grn : grns) {
            List<TxnDetailDtl> lines = detailRepo.findByTxdTxnHeaderIdTxhOrderByTxdSrNoAsc(grn.getTxhTxnHeaderId());
            createPendingInspectionApproval(grn, lines);
        }
        repairPendingInspectionHeaders();
    }

    /** Backfill quarantine location on pending inspections from their linked GRN. */
    @Transactional
    public void repairPendingInspectionHeaders() {
        Specification<TxnHeaderMst> spec = (root, query, cb) -> cb.and(
                cb.equal(root.get("txhDocType"), DocType.INSPECTION_APPROVAL.code()),
                cb.equal(root.get("txhStatus"), draftStatus(DocType.INSPECTION_APPROVAL))
        );
        for (TxnHeaderMst header : headerRepo.findAll(spec)) {
            List<TxnDetailDtl> lines = detailRepo.findByTxdTxnHeaderIdTxhOrderByTxdSrNoAsc(header.getTxhTxnHeaderId());
            ensureInspectionQuarantineOnHeader(header, lines);
            headerRepo.save(header);
        }
    }

    public PageResponse<ListItem> pendingRequisitions(Integer locationId) {
        return list(
                DocType.MATERIAL_REQUISITION,
                "Requested",
                null, null, locationId, null, null, null, null, null, null, null, null,
                1, 100
        );
    }

    private void emitLifecycle(String action, DocType docType, TxnHeaderMst header) {
        if ("SUBMIT".equals(action)) {
            emitKind("SUBMITTED", docType, header);
        } else if ("REJECT".equals(action)) {
            emitKind("REJECTED", docType, header);
        }
    }

    private void emitKind(String kind, DocType docType, TxnHeaderMst header) {
        Integer actor = null;
        try {
            CurrentUser cu = SecurityUtils.requireCurrentUser();
            actor = cu.userId();
        } catch (Exception ignored) {
            // system / unauthenticated jobs
        }
        events.publishEvent(new TxnLifecycleNotificationEvent(
                kind,
                docType,
                header.getTxhTxnHeaderId(),
                header.getTxhDocNo(),
                header.getTxhStatus(),
                header.getTxhInspectedByEmpIdEmp(),
                header.getTxhInitiatedByEmpIdEmp(),
                actor
        ));
    }

    private TxnHeaderMst requireHeader(DocType docType, Integer docId) {
        TxnHeaderMst header = headerRepo.findById(docId)
                .orElseThrow(() -> ApiException.notFound("Document not found"));
        if (!docType.code().equals(header.getTxhDocType())) {
            throw ApiException.notFound("Document not found for this transaction type");
        }
        requireDocumentVisible(header);
        return header;
    }

    private void requireDocumentVisible(TxnHeaderMst header) {
        if (DocType.INSPECTION_APPROVAL.code().equals(header.getTxhDocType())) {
            Integer assignee = accessScope.currentEmployeeId();
            if (assignee != null && assignee.equals(header.getTxhInitiatedByEmpIdEmp())) {
                return;
            }
        }
        AccessScopeService.Scope scope = accessScope.current();
        if (!scope.locationRestricted()) return;
        List<Integer> allowed = scope.allowedLocationIds();
        boolean ok = (header.getTxhLocationIdLoc() != null && allowed.contains(header.getTxhLocationIdLoc()))
                || (header.getTxhFromLocationIdLoc() != null && allowed.contains(header.getTxhFromLocationIdLoc()))
                || (header.getTxhToLocationIdLoc() != null && allowed.contains(header.getTxhToLocationIdLoc()));
        if (!ok && header.getTxhLocationIdLoc() != null && accessScope.canAccessLocation(header.getTxhLocationIdLoc())) {
            ok = true;
        }
        if (!ok) throw ApiException.forbidden("You do not have access to this document");
    }

    /**
     * Inspection approval moves stock from quarantine to each line's move-to store
     * (GRN-selected location, else item default). Assigned inspectors are not limited
     * to their location mapping for those targets.
     * Store Issue to a department destination uses the department's mapped location — the issuer
     * only needs access to the issuing (from) store, not the destination.
     */
    private void requireWriteLocations(DocType docType, DocumentRequest req) {
        if (docType == DocType.INSPECTION_APPROVAL) {
            return;
        }
        // New gatepass inward: locations come from Item Master / org Quarantine in DB — validate those.
        if (docType == DocType.GATEPASS_INWARD && req.refTxnHeaderId() == null) {
            requireNewGatepassInwardLocationsAllowed(req);
            return;
        }
        if (docType == DocType.GATEPASS_INWARD) {
            requireNamedLocationAllowed(req.locationId(), "document location");
            requireGatepassInwardInspectionLocationsAllowed(req);
            return;
        }
        requireNamedLocationAllowed(req.locationId(), "document location");
        requireNamedLocationAllowed(req.fromLocationId(), "From Location");
        boolean departmentIssueDestination = docType == DocType.MATERIAL_ISSUE
                && req.docSubtype() != null
                && "DEPARTMENT".equalsIgnoreCase(req.docSubtype().trim());
        if (!departmentIssueDestination) {
            requireNamedLocationAllowed(req.toLocationId(), "To Location");
        }
    }

    /** Access check against Item Master home store and org Quarantine (from DB), not client-sent ids. */
    private void requireNewGatepassInwardLocationsAllowed(DocumentRequest req) {
        if (req.lines() == null) {
            return;
        }
        for (LineRequest line : req.lines()) {
            if (line.itemId() == null) {
                continue;
            }
            InvItemMst item = itemRepo.findById(line.itemId())
                    .orElseThrow(() -> ApiException.badRequest("Item not found: " + line.itemId()));
            Integer home = item.getItmCurrentLocationIdLoc();
            if (home == null) {
                String code = item.getItmItemCode() != null ? item.getItmItemCode() : String.valueOf(item.getItmItemId());
                throw ApiException.badRequest("Item " + code + " needs a home store in Item Master");
            }
            requireNamedLocationAllowed(home, "item home store");
        }
        requireGatepassInwardInspectionLocationsAllowed(req);
    }

    /** Inspection-needed inward lines (new or returnable) land in Quarantine. */
    private void requireGatepassInwardInspectionLocationsAllowed(DocumentRequest req) {
        if (req.lines() == null) {
            return;
        }
        for (LineRequest line : req.lines()) {
            if (line.itemId() == null) {
                continue;
            }
            InvItemMst item = itemRepo.findById(line.itemId())
                    .orElseThrow(() -> ApiException.badRequest("Item not found: " + line.itemId()));
            if (!Boolean.TRUE.equals(item.getItmInspectionNeeded())) {
                continue;
            }
            Integer home = item.getItmCurrentLocationIdLoc();
            if (home == null) {
                String code = item.getItmItemCode() != null ? item.getItmItemCode() : String.valueOf(item.getItmItemId());
                throw ApiException.badRequest("Item " + code + " needs a home store in Item Master");
            }
            requireNamedLocationAllowed(home, "item home store");
            Integer entityId = systemLocations.resolveEntityId(item.getItmEntityIdEnt(), home);
            if (entityId == null) {
                String code = item.getItmItemCode() != null ? item.getItmItemCode() : String.valueOf(item.getItmItemId());
                throw ApiException.badRequest("Organization could not be resolved for item " + code);
            }
            Integer quarantine = systemLocations
                    .requireSystemLocationForEntity(entityId, SystemLocationRole.QUARANTINE)
                    .getLocLocationId();
            requireNamedLocationAllowed(quarantine, "quarantine location");
        }
    }

    private void requireNamedLocationAllowed(Integer locationId, String role) {
        if (accessScope.canAccessLocation(locationId)) {
            return;
        }
        // Reuse AccessScopeService message which includes location code/name.
        try {
            accessScope.requireLocationAllowed(locationId);
        } catch (ApiException ex) {
            String detail = ex.getMessage() != null ? ex.getMessage() : "You do not have access to this location";
            throw ApiException.forbidden(detail.replace(
                    "You do not have access to location ",
                    "You do not have access to " + role + " "));
        }
    }

    private void validateLines(DocType docType, List<LineRequest> lines) {
        if (lines == null || lines.isEmpty()) {
            throw ApiException.badRequest("At least one line item is required");
        }
        boolean requireAssetSerial = docType == DocType.MATERIAL_ISSUE
                || docType == DocType.MATERIAL_RETURN
                || docType == DocType.GATEPASS_OUTWARD
                || StockPostingRules.isInboundStock(docType);
        if (!requireAssetSerial) {
            return;
        }
        for (int i = 0; i < lines.size(); i++) {
            LineRequest line = lines.get(i);
            if (line.itemId() == null) continue;
            InvItemMst item = itemRepo.findById(line.itemId()).orElse(null);
            if (item == null) continue;
            boolean serialized = Boolean.TRUE.equals(item.getItmIsSerialized());
            boolean asset = item.getItmItemType() != null
                    && !"consumable".equalsIgnoreCase(item.getItmItemType());
            boolean mustHaveSerial = serialized
                    || ((docType == DocType.MATERIAL_ISSUE
                            || docType == DocType.MATERIAL_RETURN
                            || docType == DocType.GATEPASS_OUTWARD
                            || docType == DocType.GATEPASS_INWARD) && asset);
            if (!mustHaveSerial) continue;
            String serial = line.serialNo() == null ? "" : line.serialNo().trim();
            if (serial.isEmpty()) {
                String code = item.getItmItemCode() != null ? item.getItmItemCode() : String.valueOf(line.itemId());
                throw ApiException.badRequest(
                        "Serial No. is required for serialized item " + code + " (line " + (i + 1) + ")");
            }
        }
    }

    private void validateGatepassParty(DocType docType, DocumentRequest req) {
        if (docType != DocType.GATEPASS_INWARD && docType != DocType.GATEPASS_OUTWARD) {
            return;
        }
        String party = req.partyAdd() == null ? "" : req.partyAdd().trim();
        if (req.partyId() == null && party.isEmpty()) {
            throw ApiException.badRequest("Vendor / Party / Customer is required");
        }
    }

    /**
     * Standalone (non-transfer-linked) outward gatepass may only leave system-derived locations.
     * Linked transfer outward keeps the transfer's from-location (may be operational).
     * Returnable inward receives into a system-derived location (Quarantine when the item
     * needs inspection, otherwise the linked outward store).
     * New inward: location from Item Master (home store) or Quarantine when inspection is needed.
     */
    private void validateNormalGatepassOutwardSystemLocation(DocType docType, DocumentRequest req) {
        if (docType == DocType.GATEPASS_INWARD) {
            // Returnable inward (linked to outward) stays system-store only.
            if (req.refTxnHeaderId() != null) {
                Integer locId = req.locationId() != null ? req.locationId() : req.fromLocationId();
                if (locId == null) {
                    throw ApiException.badRequest("System location is required for returnable inward gatepass");
                }
                OrgLocationMst loc = locationRepo.findById(locId)
                        .orElseThrow(() -> ApiException.badRequest("Location not found: " + locId));
                if (!Boolean.TRUE.equals(loc.getLocIsSystemLocation())) {
                    throw ApiException.badRequest(
                            "Returnable inward can only receive stock into system-derived locations");
                }
                return;
            }
            // New inward: receive location is derived from Item Master / Quarantine on save (DB).
            if (req.lines() == null || req.lines().isEmpty()) {
                throw ApiException.badRequest("At least one line item is required");
            }
            for (int i = 0; i < req.lines().size(); i++) {
                LineRequest line = req.lines().get(i);
                if (line.itemId() == null) {
                    throw ApiException.badRequest("Line " + (i + 1) + ": item is required");
                }
                InvItemMst item = itemRepo.findById(line.itemId())
                        .orElseThrow(() -> ApiException.badRequest("Item not found: " + line.itemId()));
                if (item.getItmCurrentLocationIdLoc() == null) {
                    String code = item.getItmItemCode() != null ? item.getItmItemCode() : String.valueOf(item.getItmItemId());
                    throw ApiException.badRequest(
                            "Item " + code + " needs a home store in Item Master for inward receiving");
                }
            }
            return;
        }
        if (docType != DocType.GATEPASS_OUTWARD) {
            return;
        }
        if (req.refTxnHeaderId() != null) {
            return;
        }
        Integer locId = req.locationId() != null ? req.locationId() : req.fromLocationId();
        if (locId == null) {
            throw ApiException.badRequest("System location is required for new outward gatepass");
        }
        OrgLocationMst loc = locationRepo.findById(locId)
                .orElseThrow(() -> ApiException.badRequest("Location not found: " + locId));
        if (!Boolean.TRUE.equals(loc.getLocIsSystemLocation())) {
            throw ApiException.badRequest(
                    "New outward gatepass can only issue stock from system-derived locations");
        }
        if (req.lines() != null) {
            for (int i = 0; i < req.lines().size(); i++) {
                LineRequest line = req.lines().get(i);
                Integer lineLoc = line.locationId() != null ? line.locationId() : locId;
                if (!locId.equals(lineLoc)) {
                    throw ApiException.badRequest(
                            "Line " + (i + 1) + " location must match the outward system location");
                }
            }
        }
    }

    /**
     * New Outward: inspection-needed items cannot leave from Quarantine until Inspection Approval.
     * Damaged / Scrap outward is allowed after assets are returned there.
     */
    private void validateInspectionRouting(DocType docType, DocumentRequest req) {
        if (req.lines() == null || req.lines().isEmpty()) {
            return;
        }
        if (docType == DocType.MATERIAL_TRANSFER) {
            // Returning / transferring assets to Damaged, Scrap, Quarantine, etc. is allowed.
            return;
        }
        if (docType != DocType.GATEPASS_OUTWARD || req.refTxnHeaderId() != null) {
            return;
        }
        Integer locId = req.locationId() != null ? req.locationId() : req.fromLocationId();
        for (int i = 0; i < req.lines().size(); i++) {
            LineRequest line = req.lines().get(i);
            if (line.itemId() == null) {
                continue;
            }
            InvItemMst item = itemRepo.findById(line.itemId()).orElse(null);
            if (item == null || !InspectionRoutingRules.inspectionRequired(item.getItmInspectionNeeded())) {
                continue;
            }
            Integer lineLoc = line.locationId() != null ? line.locationId() : locId;
            if (lineLoc == null) {
                continue;
            }
            OrgLocationMst loc = locationRepo.findById(lineLoc).orElse(null);
            String role = loc == null ? null : loc.getLocSystemRole();
            if (InspectionRoutingRules.blocksNewOutwardFromRole(role)) {
                String code = item.getItmItemCode() != null ? item.getItmItemCode() : String.valueOf(item.getItmItemId());
                throw ApiException.badRequest(
                        "Item " + code + " is in Quarantine and needs Inspection Approval before New Outward.");
            }
        }
    }

    private String normalizeAction(String action) {
        if (action == null || action.isBlank()) {
            return "SUBMIT";
        }
        String a = action.trim().toUpperCase();
        if (a.contains("DRAFT")) {
            return "SAVE_DRAFT";
        }
        if (a.contains("REJECT")) {
            return "REJECT";
        }
        return "SUBMIT";
    }

    private String resolveStatusOnSave(DocType docType, String action) {
        if ("SAVE_DRAFT".equals(action)) {
            return draftStatus(docType);
        }
        if ("REJECT".equals(action) && docType == DocType.INSPECTION_APPROVAL) {
            return "Rejected";
        }
        return initialSubmitStatus(docType);
    }

    private boolean isEditable(TxnHeaderMst header) {
        if (DocType.INSPECTION_APPROVAL.code().equals(header.getTxhDocType())) {
            String s = header.getTxhStatus();
            if (s == null || s.isBlank()) {
                return true;
            }
            return "Pending".equalsIgnoreCase(s)
                    || "Draft".equalsIgnoreCase(s)
                    || "In Pending".equalsIgnoreCase(s);
        }
        return StockPostingRules.isEditableStatus(header.getTxhStatus());
    }

    /** GRN with inspection-needed accepted qty requires inspector and a post-inspection destination. */
    private void validateGrnInspectionRequirements(TxnHeaderMst header, List<TxnDetailDtl> lines) {
        boolean needsInspector = false;
        for (TxnDetailDtl line : lines) {
            InvItemMst item = itemRepo.findById(line.getTxdItemIdItm()).orElse(null);
            if (item == null || !Boolean.TRUE.equals(item.getItmInspectionNeeded())) {
                continue;
            }
            BigDecimal accepted = firstNonNull(line.getTxdAcceptedQty(), line.getTxdReceivedQty(), line.getTxdQty());
            if (accepted.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            needsInspector = true;
            if (resolvePostInspectionLocation(line, item) == null) {
                String code = item.getItmItemCode() != null ? item.getItmItemCode() : String.valueOf(item.getItmItemId());
                throw ApiException.badRequest(
                        "Item " + code + " needs a GRN location or a home store in Item Master for inspection workflow");
            }
        }
        if (needsInspector && header.getTxhInspectedByEmpIdEmp() == null) {
            throw ApiException.badRequest("Inspected By is required when receiving items that need inspection");
        }
    }

    /** Only the GRN-assigned inspector (or ADMIN) may approve / reject a pending inspection. */
    private void requireInspectionApprovalActor(TxnHeaderMst header) {
        if (accessScope.isRoleExempt()) {
            return;
        }
        Integer assignee = header.getTxhInitiatedByEmpIdEmp();
        Integer actor = accessScope.currentEmployeeId();
        if (assignee == null) {
            throw ApiException.conflict("Inspection approval has no assigned inspector");
        }
        if (actor == null || !assignee.equals(actor)) {
            throw ApiException.forbidden("Only the assigned inspector can approve or reject this inspection");
        }
    }

    private String draftStatus(DocType docType) {
        return StockPostingRules.draftStatus(docType);
    }

    private String initialSubmitStatus(DocType docType) {
        return StockPostingRules.initialSubmitStatus(docType);
    }

  /** Status after stock posting — transfers that need gatepass stay pending for outward. */
    private String resolveSubmitStatusAfterPosting(DocType docType, TxnHeaderMst header) {
        if (docType == DocType.MATERIAL_TRANSFER) {
            return TransferGatepassRules.transferStatusAfterSubmit(needsGatepassForTransfer(header));
        }
        return initialSubmitStatus(docType);
    }

    private boolean needsGatepassForTransfer(TxnHeaderMst header) {
        Integer from = header.getTxhFromLocationIdLoc();
        Integer to = header.getTxhToLocationIdLoc();
        OrgLocationMst toLoc = to != null ? locationRepo.findById(to).orElse(null) : null;
        return TransferGatepassRules.needsGatepassOutward(
                header.getTxhDocSubtype(),
                from,
                to,
                toLoc != null ? toLoc.getLocSystemRole() : null,
                toLoc != null ? toLoc.getLocLocationCode() : null,
                toLoc != null ? toLoc.getLocLocationName() : null
        );
    }

    /** When outward gatepass is submitted against a transfer, mark the transfer Transferred. */
    private void markLinkedTransferCompleted(DocType docType, TxnHeaderMst outwardHeader) {
        if (docType != DocType.GATEPASS_OUTWARD) {
            return;
        }
        Integer refId = outwardHeader.getTxhRefTxnHeaderIdTxh();
        if (refId == null) {
            return;
        }
        headerRepo.findById(refId).ifPresent(transfer -> {
            if (!DocType.MATERIAL_TRANSFER.code().equals(transfer.getTxhDocType())) {
                return;
            }
            if (!TransferGatepassRules.PENDING_FOR_OUTWARD.equalsIgnoreCase(transfer.getTxhStatus())) {
                return;
            }
            transfer.setTxhStatus(TransferGatepassRules.TRANSFERRED);
            transfer.setTxhModifiedBy(SecurityUtils.loginIdOrSystem());
            transfer.setTxhModifiedOn(LocalDateTime.now());
            headerRepo.save(transfer);
        });
    }

    /** When a store issue is submitted against a requisition, mark that requisition Issued. */
    private void markLinkedRequisitionIssued(DocType docType, TxnHeaderMst issueHeader) {
        if (docType != DocType.MATERIAL_ISSUE) return;
        Integer refId = issueHeader.getTxhRefTxnHeaderIdTxh();
        if (refId == null) return;
        headerRepo.findById(refId).ifPresent(req -> {
            if (!DocType.MATERIAL_REQUISITION.code().equals(req.getTxhDocType())) return;
            req.setTxhStatus("Issued");
            req.setTxhModifiedBy(SecurityUtils.loginIdOrSystem());
            req.setTxhModifiedOn(LocalDateTime.now());
            headerRepo.save(req);
        });
    }

    private boolean postsStockOnSubmit(DocType docType) {
        return StockPostingRules.postsStockOnSubmit(docType);
    }

    /** Outward linked to a material transfer is gate documentation — stock already moved on the transfer. */
    private boolean shouldPostStockOnSubmit(DocType docType, TxnHeaderMst header) {
        if (!postsStockOnSubmit(docType)) {
            return false;
        }
        if (docType == DocType.GATEPASS_OUTWARD && isLinkedMaterialTransfer(header.getTxhRefTxnHeaderIdTxh())) {
            return false;
        }
        return true;
    }

    private boolean isLinkedMaterialTransfer(Integer refTxnHeaderId) {
        if (refTxnHeaderId == null) {
            return false;
        }
        return headerRepo.findById(refTxnHeaderId)
                .map(t -> DocType.MATERIAL_TRANSFER.code().equals(t.getTxhDocType()))
                .orElse(false);
    }

    private String nextDocNo(DocType docType) {
        String year = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy"));
        String prefix = docType.seriesPrefix() + "-" + year + "-";
        long count = headerRepo.count((root, query, cb) -> cb.and(
                cb.equal(root.get("txhDocType"), docType.code()),
                cb.like(root.get("txhDocNo"), prefix + "%")
        ));
        return prefix + String.format("%04d", count + 1);
    }

    private void applyHeader(TxnHeaderMst h, DocType docType, DocumentRequest req, boolean merge) {
        h.setTxhDocType(docType.code());
        h.setTxhDocDate(req.docDate() != null ? req.docDate() : LocalDate.now());
        h.setTxhPostingDate(req.postingDate());
        h.setTxhRequiredByDate(req.requiredByDate());
        if (!merge || req.entityId() != null) {
        h.setTxhEntityIdEnt(req.entityId());
        }
        if (!merge || req.locationId() != null) {
        h.setTxhLocationIdLoc(req.locationId());
        }
        if (!merge || req.fromLocationId() != null) {
        h.setTxhFromLocationIdLoc(req.fromLocationId());
        }
        if (!merge || req.toLocationId() != null) {
        h.setTxhToLocationIdLoc(req.toLocationId());
        }
        h.setTxhPartyIdVnd(req.partyId());
        h.setTxhPartyAdd(req.partyAdd());
        h.setTxhPartyContactPerson(req.partyContactPerson());
        h.setTxhPartyPhone(req.partyPhone());
        h.setTxhPartyGstin(req.partyGstin());
        h.setTxhShipTo(req.shipTo());
        if (!merge || req.departmentId() != null) {
            h.setTxhDepartmentIdDept(req.departmentId());
        }
        if (!merge || req.initiatedByEmpId() != null) {
        h.setTxhInitiatedByEmpIdEmp(req.initiatedByEmpId());
        }
        h.setTxhEmployeeRefCode(req.employeeRefCode());
        h.setTxhDesignation(req.designation());
        h.setTxhDocSubtype(req.docSubtype());
        h.setTxhReturnFlag(req.returnFlag());
        if (!merge || req.refTxnHeaderId() != null) {
        h.setTxhRefTxnHeaderIdTxh(req.refTxnHeaderId());
        }
        if (!merge || req.referenceNo() != null) {
        h.setTxhReferenceNo(req.referenceNo());
        }
        h.setTxhInvoiceNo(req.invoiceNo());
        h.setTxhInvoiceDate(req.invoiceDate());
        h.setTxhPoNo(req.poNo());
        h.setTxhPoDate(req.poDate());
        h.setTxhPurpose(req.purpose());
        h.setTxhAttachmentUrl(packAttachment(req.attachmentUrl(), req.attachmentName()));
        h.setTxhInspectedByEmpIdEmp(req.inspectedByEmpId());
        h.setTxhInspectionDate(req.inspectionDate());
        h.setTxhHandedOverToEmpIdEmp(req.handedOverToEmpId());
        h.setTxhHandoverDesignation(req.handoverDesignation());
        h.setTxhHandoverDate(req.handoverDate());
        h.setTxhReceivedByEmpIdEmp(req.receivedByEmpId());
        h.setTxhReceivedByName(req.receivedByName());
        h.setTxhReceivedDesignation(req.receivedDesignation());
        h.setTxhReceivedDate(req.receivedDate());
        h.setTxhConditionOnReturn(req.conditionOnReturn());
        h.setTxhPreparedByEmpIdEmp(req.preparedByEmpId());
        h.setTxhPreparedDate(req.preparedDate());
        if (!merge || req.approvedByEmpId() != null) {
            h.setTxhApprovedByEmpIdEmp(req.approvedByEmpId());
        }
        if (!merge || req.approvedDate() != null) {
            h.setTxhApprovedDate(req.approvedDate());
        }
        h.setTxhTotalOrderedQty(req.totalOrderedQty());
        h.setTxhTotalReceivedQty(req.totalReceivedQty());
        h.setTxhTotalAcceptedQty(req.totalAcceptedQty());
        h.setTxhTotalRejectedQty(req.totalRejectedQty());
        h.setTxhTotalPendingQty(req.totalPendingQty());
        h.setTxhTotalAmount(req.totalAmount());
        h.setTxhFooterRemark(req.footerRemark());
        if (req.remarks() != null) {
        h.setTxhRemarks(req.remarks());
        }
    }

    private void stampInspectionApproved(TxnHeaderMst header) {
        Integer emp = accessScope.currentEmployeeId();
        if (emp != null) {
            header.setTxhApprovedByEmpIdEmp(emp);
        }
        header.setTxhApprovedDate(LocalDate.now());
    }

    /** Restore quarantine on header — stock was posted to the linked GRN's OU quarantine. */
    private void ensureInspectionQuarantineOnHeader(TxnHeaderMst header, List<TxnDetailDtl> lines) {
        Integer fromGrn = quarantineForGrnHeader(header.getTxhRefTxnHeaderIdTxh());
        if (fromGrn != null) {
            header.setTxhLocationIdLoc(fromGrn);
            return;
        }
        if (header.getTxhLocationIdLoc() != null) {
            return;
        }
        for (TxnDetailDtl line : lines) {
            Integer home = line.getTxdLocationIdLoc();
            if (home == null) {
                continue;
            }
        Integer buId = systemLocations.resolveBuId(home);
            if (buId == null && systemLocations.resolveEntityId(null, home) == null) {
                continue;
            }
            header.setTxhLocationIdLoc(
                    systemLocations.requireSystemLocationForStore(home, SystemLocationRole.QUARANTINE).getLocLocationId());
            return;
        }
        throw ApiException.badRequest("Quarantine location could not be resolved for this inspection approval");
    }

    private Integer quarantineForGrnHeader(Integer grnHeaderId) {
        if (grnHeaderId == null) {
            return null;
        }
        return headerRepo.findById(grnHeaderId).map(grn -> {
            Integer store = grn.getTxhLocationIdLoc();
            if (store == null) {
                return null;
            }
            return systemLocations.requireSystemLocationForStore(store, SystemLocationRole.QUARANTINE).getLocLocationId();
        }).orElse(null);
    }

    private Integer rejectedForGrnHeader(Integer grnHeaderId) {
        if (grnHeaderId == null) {
            return null;
        }
        return headerRepo.findById(grnHeaderId).map(grn -> {
            Integer store = grn.getTxhLocationIdLoc();
            if (store == null) {
                return null;
            }
            return systemLocations.requireSystemLocationForStore(store, SystemLocationRole.REJECTED).getLocLocationId();
        }).orElse(null);
    }

    private Integer inspectionQuarantineDisplayLocation(TxnHeaderMst header) {
        if (!DocType.INSPECTION_APPROVAL.code().equals(header.getTxhDocType())) {
            return header.getTxhLocationIdLoc();
        }
        Integer fromGrn = quarantineForGrnHeader(header.getTxhRefTxnHeaderIdTxh());
        if (fromGrn != null) {
            return fromGrn;
        }
        return header.getTxhLocationIdLoc();
    }

    private List<TxnDetailDtl> saveLines(TxnHeaderMst header, DocType docType, List<LineRequest> lines) {
        List<TxnDetailDtl> saved = new ArrayList<>();
        int i = 1;
        for (LineRequest line : lines) {
            if (line.itemId() == null) {
                throw ApiException.badRequest("line.itemId is required");
            }
            InvItemMst catalog = itemRepo.findById(line.itemId())
                    .orElseThrow(() -> ApiException.badRequest("Item not found: " + line.itemId()));
            Integer resolvedUom = line.uomId() != null ? line.uomId() : catalog.getItmUomIdUnt();
            if (resolvedUom == null) {
                throw ApiException.badRequest("line.uomId is required (item has no default UOM)");
            }
            TxnDetailDtl d = new TxnDetailDtl();
            d.setTxdTxnHeaderIdTxh(header.getTxhTxnHeaderId());
            d.setTxdDocType(docType.code());
            d.setTxdSrNo(line.srNo() != null ? line.srNo() : i);
            d.setTxdItemIdItm(line.itemId());
            d.setTxdUomIdUnt(resolvedUom);
            d.setTxdOrderedQty(line.orderedQty());
            d.setTxdReceivedQty(line.receivedQty());
            d.setTxdAcceptedQty(line.acceptedQty());
            d.setTxdRejectedQty(line.rejectedQty());
            d.setTxdRequestedQty(line.requestedQty());
            d.setTxdQty(line.qty());
            d.setTxdAvailableStock(line.availableStock());
            d.setTxdAmount(line.amount());
            d.setTxdRate(line.rate());
            d.setTxdMrp(line.mrp());
            d.setTxdBatchLotNo(line.batchLotNo());
            d.setTxdMfgDate(line.mfgDate());
            d.setTxdExpiryDate(line.expiryDate());
            Integer resolvedLineLoc = line.locationId() != null ? line.locationId() : header.getTxhLocationIdLoc();
            if (docType == DocType.GATEPASS_INWARD) {
                boolean newInward = header.getTxhRefTxnHeaderIdTxh() == null;
                if (newInward || Boolean.TRUE.equals(catalog.getItmInspectionNeeded())) {
                    resolvedLineLoc = resolveNewGatepassInwardLineLocation(catalog);
                }
            }
            d.setTxdLocationIdLoc(resolvedLineLoc);
            d.setTxdLocationBin(line.locationBin());
            d.setTxdItemCondition(line.itemCondition());
            d.setTxdSerialNo(line.serialNo());
            d.setTxdIpAddress(line.ipAddress());
            d.setTxdMacAddress(line.macAddress());
            d.setTxdHostname(line.hostname());
            Integer issuedTo = resolveLineIssuedTo(docType, header, line);
            d.setTxdIssuedToEmpIdEmp(issuedTo);
            d.setTxdRemark(line.remark());
            Integer blsLocation = resolveBlsLocation(docType, header, d.getTxdLocationIdLoc());
            InvBlsMst bls = blsService.resolveForLine(
                    header.getTxhEntityIdEnt(),
                    blsLocation,
                    line,
                    header.getTxhTxnHeaderId(),
                    docType,
                    issuedTo);
            d.setTxdBlsIdIbm(bls.getIbmBlsId());
            saved.add(detailRepo.save(d));
            i++;
        }
        return saved;
    }

    /**
     * Posts quantity into inv_stock_mst.
     * inward=true adds; false subtracts. Qty taken from accepted/qty/received depending on doc type.
     */
    private void postStock(TxnHeaderMst header, List<TxnDetailDtl> lines, boolean apply) {
        DocType docType = DocType.fromCode(header.getTxhDocType());
        if (docType == DocType.GRN) {
            postGrnStock(header, lines, apply);
            return;
        }
        if (docType == DocType.GATEPASS_INWARD && header.getTxhRefTxnHeaderIdTxh() == null) {
            postNewGatepassInwardStock(header, lines, apply);
            return;
        }
        if (docType == DocType.INSPECTION_APPROVAL) {
            postInspectionApprovalStock(header, lines, apply);
            return;
        }
        for (TxnDetailDtl line : lines) {
            BigDecimal qty = resolveQty(docType, line);
            if (qty == null || qty.compareTo(BigDecimal.ZERO) == 0) {
                continue;
            }
            Integer locationId = resolveLocation(docType, header, line);
            if (locationId == null) {
                throw ApiException.badRequest("Location is required for stock posting");
            }
            int sign = stockSign(docType);
            if (!apply) {
                sign = -sign;
            }
            String batch = resolveStockBatch(line);
            Integer headerId = header.getTxhTxnHeaderId();
            Integer itemId = line.getTxdItemIdItm();
            Integer uomId = line.getTxdUomIdUnt();

            if (apply && docType == DocType.MATERIAL_TRANSFER && sign < 0) {
                Integer toLoc = header.getTxhToLocationIdLoc();
                if (toLoc == null) {
                    throw ApiException.badRequest("To location is required for stock transfer");
                }
                moveStock(itemId, locationId, toLoc, uomId, batch, qty, headerId);
                // Free-stock / serial pickers key off BLS location — keep custody in sync.
                blsService.moveUnitToLocation(line.getTxdBlsIdIbm(), toLoc);
                if (batch != null && !batch.isBlank()) {
                    blsService.moveMatchingUnitsToLocation(itemId, batch, toLoc);
                }
                continue;
            }

            if (apply && docType == DocType.MATERIAL_ISSUE && sign < 0) {
                Integer toLoc = header.getTxhToLocationIdLoc();
                if (toLoc != null && !toLoc.equals(locationId)) {
                    // Issue to a different store: move on-hand stock with the unit.
                    moveStock(itemId, locationId, toLoc, uomId, batch, qty, headerId);
                    continue;
                }
                // Same store: assets stay on-hand (BLS custody only). Consumables still leave stock.
                InvItemMst issuedItem = itemRepo.findById(itemId).orElse(null);
                boolean asset = issuedItem != null
                        && issuedItem.getItmItemType() != null
                        && !"consumable".equalsIgnoreCase(issuedItem.getItmItemType());
                if (asset) {
                    continue;
                }
            }

            if (apply && docType == DocType.MATERIAL_RETURN && sign > 0) {
                Integer fromLoc = resolveReturnFromLocation(header);
                if (fromLoc != null && locationId != null && !fromLoc.equals(locationId)) {
                    moveStock(itemId, fromLoc, locationId, uomId, batch, qty, headerId);
                    continue;
                }
            }

            BigDecimal delta = qty.multiply(BigDecimal.valueOf(sign));
            // Outbound without a batch: deplete across existing buckets (FIFO) so UI can omit batchLotNo.
            if (delta.compareTo(BigDecimal.ZERO) < 0 && (batch == null || batch.isBlank())) {
                consumeFifo(itemId, locationId, uomId, delta.abs(), headerId);
            } else {
                upsertStock(itemId, locationId, uomId, batch, delta, headerId);
            }
        }
    }

    /**
     * GRN: rejected qty → Rejected store; accepted qty with inspection flag → Quarantine;
     * otherwise accepted qty → header store.
     */
    private void postGrnStock(TxnHeaderMst header, List<TxnDetailDtl> lines, boolean apply) {
        Integer headerStore = header.getTxhLocationIdLoc();
        if (headerStore == null) {
            throw ApiException.badRequest("Store is required for GRN stock posting");
        }
        Integer entityId = systemLocations.resolveEntityId(null, headerStore);
        if (entityId == null) {
            throw ApiException.badRequest("Organization could not be resolved from the GRN store");
        }
        Integer rejectedLoc = systemLocations.requireSystemLocationForEntity(entityId, SystemLocationRole.REJECTED).getLocLocationId();
        Integer quarantineLoc = systemLocations.requireSystemLocationForEntity(entityId, SystemLocationRole.QUARANTINE).getLocLocationId();
        int sign = apply ? 1 : -1;
        Integer headerId = header.getTxhTxnHeaderId();

        for (TxnDetailDtl line : lines) {
            Integer itemId = line.getTxdItemIdItm();
            Integer uomId = line.getTxdUomIdUnt();
            String batch = resolveStockBatch(line);
            BigDecimal rejectedQty = nz(line.getTxdRejectedQty());
            BigDecimal acceptedQty = firstNonNull(line.getTxdAcceptedQty(), line.getTxdReceivedQty(), line.getTxdQty());

            if (rejectedQty.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal delta = rejectedQty.multiply(BigDecimal.valueOf(sign));
                upsertStock(itemId, rejectedLoc, uomId, batch, delta, headerId);
            }
            if (acceptedQty.compareTo(BigDecimal.ZERO) > 0) {
                InvItemMst item = itemRepo.findById(itemId)
                        .orElseThrow(() -> ApiException.badRequest("Item not found: " + itemId));
                Integer lineLoc = line.getTxdLocationIdLoc();
                boolean needsInspection = Boolean.TRUE.equals(item.getItmInspectionNeeded());
                Integer targetLoc = needsInspection
                        ? quarantineLoc
                        : (lineLoc != null ? lineLoc : headerStore);
                BigDecimal delta = acceptedQty.multiply(BigDecimal.valueOf(sign));
                upsertStock(itemId, targetLoc, uomId, batch, delta, headerId);
                // Keep BLS custody with stock so free-stock / quarantine views stay consistent.
                if (apply && needsInspection) {
                    blsService.moveUnitToLocation(line.getTxdBlsIdIbm(), quarantineLoc);
                    if (batch != null && !batch.isBlank()) {
                        blsService.moveMatchingUnitsToLocation(itemId, batch, quarantineLoc);
                    }
                }
            }
        }
    }

    /**
     * New gatepass inward receive location from Item Master (DB):
     * inspection needed → org Quarantine; otherwise → item current/home location.
     */
    private Integer resolveNewGatepassInwardLineLocation(InvItemMst item) {
        Integer home = item.getItmCurrentLocationIdLoc();
        if (home == null) {
            String code = item.getItmItemCode() != null ? item.getItmItemCode() : String.valueOf(item.getItmItemId());
            throw ApiException.badRequest("Item " + code + " needs a home store in Item Master for inward receiving");
        }
        if (!Boolean.TRUE.equals(item.getItmInspectionNeeded())) {
            return home;
        }
        Integer entityId = systemLocations.resolveEntityId(item.getItmEntityIdEnt(), home);
        if (entityId == null) {
            String code = item.getItmItemCode() != null ? item.getItmItemCode() : String.valueOf(item.getItmItemId());
            throw ApiException.badRequest("Organization could not be resolved for item " + code);
        }
        return systemLocations.requireSystemLocationForEntity(entityId, SystemLocationRole.QUARANTINE).getLocLocationId();
    }

    /**
     * Align header location/entity with line receive locations (Quarantine preferred when present).
     */
    private void syncNewGatepassInwardHeaderFromLines(TxnHeaderMst header, List<TxnDetailDtl> lines) {
        Integer quarantineHeaderLoc = null;
        Integer firstLoc = null;
        Integer entityId = header.getTxhEntityIdEnt();
        for (TxnDetailDtl line : lines) {
            Integer loc = line.getTxdLocationIdLoc();
            if (loc == null) {
                continue;
            }
            if (firstLoc == null) {
                firstLoc = loc;
            }
            if (entityId == null) {
                entityId = systemLocations.resolveEntityId(null, loc);
            }
            InvItemMst item = itemRepo.findById(line.getTxdItemIdItm()).orElse(null);
            if (item != null && Boolean.TRUE.equals(item.getItmInspectionNeeded())) {
                quarantineHeaderLoc = loc;
                if (entityId == null) {
                    entityId = systemLocations.resolveEntityId(item.getItmEntityIdEnt(), loc);
                }
            }
        }
        Integer headerLoc = quarantineHeaderLoc != null ? quarantineHeaderLoc : firstLoc;
        if (headerLoc != null) {
            header.setTxhLocationIdLoc(headerLoc);
        }
        if (entityId != null) {
            header.setTxhEntityIdEnt(entityId);
        }
        if (header.getTxhLocationIdLoc() == null) {
            throw ApiException.badRequest("Location could not be resolved for inward gatepass from Item Master");
        }
    }

    /**
     * New (non-returnable) gatepass inward: inspection-needed items → Quarantine;
     * otherwise → Item Master home store (DB), not a client-supplied location.
     */
    private void postNewGatepassInwardStock(TxnHeaderMst header, List<TxnDetailDtl> lines, boolean apply) {
        Integer headerStore = header.getTxhLocationIdLoc();
        if (headerStore == null) {
            throw ApiException.badRequest("Location is required for inward gatepass stock posting");
        }
        int sign = apply ? 1 : -1;
        Integer headerId = header.getTxhTxnHeaderId();

        for (TxnDetailDtl line : lines) {
            BigDecimal qty = firstNonNull(line.getTxdAcceptedQty(), line.getTxdReceivedQty(), line.getTxdQty());
            if (qty == null || qty.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            Integer itemId = line.getTxdItemIdItm();
            Integer uomId = line.getTxdUomIdUnt();
            String batch = resolveStockBatch(line);
            InvItemMst item = itemRepo.findById(itemId)
                    .orElseThrow(() -> ApiException.badRequest("Item not found: " + itemId));
            Integer targetLoc = resolveNewGatepassInwardLineLocation(item);
            BigDecimal delta = qty.multiply(BigDecimal.valueOf(sign));
            upsertStock(itemId, targetLoc, uomId, batch, delta, headerId);
            if (apply && Boolean.TRUE.equals(item.getItmInspectionNeeded())) {
                blsService.moveUnitToLocation(line.getTxdBlsIdIbm(), targetLoc);
                if (batch != null && !batch.isBlank()) {
                    blsService.moveMatchingUnitsToLocation(itemId, batch, targetLoc);
                }
            }
        }
    }

    /**
     * When a GRN or gatepass inward is submitted, inspection-needed items are posted to Quarantine.
     * Create a Pending inspection approval assigned to the inspector so they can
     * approve and move stock to the GRN-selected store (or item default if none).
     *
     * @return true when an inspection is pending (created or already exists) for this source
     */
    private boolean createPendingInspectionApproval(TxnHeaderMst sourceHeader, List<TxnDetailDtl> sourceLines) {
        Specification<TxnHeaderMst> dup = (root, query, cb) -> cb.and(
                cb.equal(root.get("txhDocType"), DocType.INSPECTION_APPROVAL.code()),
                cb.equal(root.get("txhRefTxnHeaderIdTxh"), sourceHeader.getTxhTxnHeaderId())
        );
        if (headerRepo.count(dup) > 0) {
            return true;
        }

        Integer headerStore = sourceHeader.getTxhLocationIdLoc();
        if (headerStore == null) {
            return false;
        }
        Integer entityId = systemLocations.resolveEntityId(sourceHeader.getTxhEntityIdEnt(), headerStore);
        if (entityId == null) {
            return false;
        }

        List<LineRequest> inspectionLines = new ArrayList<>();
        int sr = 1;
        for (TxnDetailDtl line : sourceLines) {
            InvItemMst item = itemRepo.findById(line.getTxdItemIdItm()).orElse(null);
            if (item == null || !Boolean.TRUE.equals(item.getItmInspectionNeeded())) {
                continue;
            }
            BigDecimal accepted = firstNonNull(line.getTxdAcceptedQty(), line.getTxdReceivedQty(), line.getTxdQty());
            if (accepted.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            Integer destLoc = resolvePostInspectionLocation(line, item);
            if (destLoc == null) {
                String code = item.getItmItemCode() != null ? item.getItmItemCode() : String.valueOf(item.getItmItemId());
                throw ApiException.badRequest(
                        "Item " + code + " needs a GRN location or a home store in Item Master for inspection workflow");
            }
            String batch = line.getTxdBatchLotNo();
            if (batch == null || batch.isBlank()) {
                batch = line.getTxdSerialNo();
            }
            inspectionLines.add(new LineRequest(
                    sr++,
                    line.getTxdItemIdItm(),
                    line.getTxdUomIdUnt(),
                    null,
                    null,
                    null,
                    null,
                    null,
                    accepted,
                    null,
                    null,
                    null,
                    null,
                    batch,
                    line.getTxdMfgDate(),
                    line.getTxdExpiryDate(),
                    destLoc,
                    line.getTxdLocationBin(),
                    line.getTxdItemCondition(),
                    line.getTxdSerialNo(),
                    line.getTxdIpAddress(),
                    line.getTxdMacAddress(),
                    line.getTxdHostname(),
                    null,
                    line.getTxdRemark(),
                    null
            ));
        }
        if (inspectionLines.isEmpty()) {
            return false;
        }

        Integer quarantineLoc = systemLocations.requireSystemLocationForEntity(entityId, SystemLocationRole.QUARANTINE).getLocLocationId();
        Integer entityIdForHeader = sourceHeader.getTxhEntityIdEnt();
        if (entityIdForHeader == null) {
            entityIdForHeader = entityId;
        }
        Integer inspector = sourceHeader.getTxhInspectedByEmpIdEmp();
        if (inspector == null) {
            inspector = sourceHeader.getTxhPreparedByEmpIdEmp();
        }
        if (inspector == null) {
            inspector = sourceHeader.getTxhInitiatedByEmpIdEmp();
        }
        if (inspector == null) {
            throw ApiException.badRequest("Inspected By is required when items need inspection approval");
        }

        String sourceLabel = DocType.GATEPASS_INWARD.code().equals(sourceHeader.getTxhDocType())
                ? "Gatepass Inward"
                : "GRN";

        TxnHeaderMst inspection = new TxnHeaderMst();
        inspection.setTxhDocType(DocType.INSPECTION_APPROVAL.code());
        inspection.setTxhDocDate(sourceHeader.getTxhDocDate() != null ? sourceHeader.getTxhDocDate() : LocalDate.now());
        inspection.setTxhEntityIdEnt(entityIdForHeader);
        inspection.setTxhLocationIdLoc(quarantineLoc);
        inspection.setTxhInitiatedByEmpIdEmp(inspector);
        inspection.setTxhRefTxnHeaderIdTxh(sourceHeader.getTxhTxnHeaderId());
        inspection.setTxhReferenceNo(sourceHeader.getTxhDocNo());
        inspection.setTxhAttachmentUrl(sourceHeader.getTxhAttachmentUrl());
        inspection.setTxhRemarks("Pending inspection for " + sourceLabel + " " + sourceHeader.getTxhDocNo());
        inspection.setTxhDocNo(nextDocNo(DocType.INSPECTION_APPROVAL));
        inspection.setTxhStatus(draftStatus(DocType.INSPECTION_APPROVAL));
        inspection.setTxhCreatedBy(SecurityUtils.loginIdOrSystem());
        inspection.setTxhCreatedOn(LocalDateTime.now());
        inspection = headerRepo.save(inspection);
        saveLines(inspection, DocType.INSPECTION_APPROVAL, inspectionLines);
        // While stock sits in quarantine, show Quarantine on the source GRN / inward list.
        sourceHeader.setTxhLocationIdLoc(quarantineLoc);
        sourceHeader.setTxhModifiedBy(SecurityUtils.loginIdOrSystem());
        sourceHeader.setTxhModifiedOn(LocalDateTime.now());
        headerRepo.save(sourceHeader);
        emitKind("INSPECTION_ASSIGNED", DocType.INSPECTION_APPROVAL, inspection);
        return true;
    }

    /**
     * After inspection approve: set linked GRN / Gatepass Inward header + matching lines
     * to the post-inspection destination so list/detail no longer show Quarantine.
     */
    private void syncLinkedSourceLocationsAfterInspection(TxnHeaderMst inspection, List<TxnDetailDtl> inspectionLines) {
        Integer refId = inspection.getTxhRefTxnHeaderIdTxh();
        if (refId == null) {
            return;
        }
        TxnHeaderMst source = headerRepo.findById(refId).orElse(null);
        if (source == null) {
            return;
        }
        String srcType = source.getTxhDocType();
        if (!DocType.GRN.code().equals(srcType) && !DocType.GATEPASS_INWARD.code().equals(srcType)) {
            return;
        }

        List<TxnDetailDtl> sourceLines = detailRepo.findByTxdTxnHeaderIdTxhOrderByTxdSrNoAsc(refId);
        Integer headerDest = null;
        for (TxnDetailDtl inspLine : inspectionLines) {
            InvItemMst item = itemRepo.findById(inspLine.getTxdItemIdItm()).orElse(null);
            if (item == null) {
                continue;
            }
            Integer dest = resolvePostInspectionLocation(inspLine, item);
            if (dest == null) {
                continue;
            }
            if (headerDest == null) {
                headerDest = dest;
            }
            for (TxnDetailDtl srcLine : sourceLines) {
                if (!sameInspectionSourceLine(inspLine, srcLine)) {
                    continue;
                }
                srcLine.setTxdLocationIdLoc(dest);
                detailRepo.save(srcLine);
                // Keep BLS custody aligned with stock after release from quarantine.
                String batch = resolveStockBatch(inspLine);
                if (srcLine.getTxdBlsIdIbm() != null) {
                    blsService.moveUnitToLocation(srcLine.getTxdBlsIdIbm(), dest);
                } else if (batch != null && !batch.isBlank()) {
                    blsService.moveMatchingUnitsToLocation(srcLine.getTxdItemIdItm(), batch, dest);
                }
            }
        }
        if (headerDest != null) {
            source.setTxhLocationIdLoc(headerDest);
            source.setTxhStatus("Completed");
            source.setTxhModifiedBy(SecurityUtils.loginIdOrSystem());
            source.setTxhModifiedOn(LocalDateTime.now());
            headerRepo.save(source);
        }
    }

    /**
     * After inspection reject: set linked GRN / Gatepass Inward to Rejected store and Completed.
     */
    private void syncLinkedSourceLocationsAfterInspectionReject(TxnHeaderMst inspection, List<TxnDetailDtl> inspectionLines) {
        Integer refId = inspection.getTxhRefTxnHeaderIdTxh();
        if (refId == null) {
            return;
        }
        TxnHeaderMst source = headerRepo.findById(refId).orElse(null);
        if (source == null) {
            return;
        }
        String srcType = source.getTxhDocType();
        if (!DocType.GRN.code().equals(srcType) && !DocType.GATEPASS_INWARD.code().equals(srcType)) {
            return;
        }
        Integer rejectedLoc = rejectedForGrnHeader(refId);
        if (rejectedLoc == null) {
            return;
        }
        List<TxnDetailDtl> sourceLines = detailRepo.findByTxdTxnHeaderIdTxhOrderByTxdSrNoAsc(refId);
        for (TxnDetailDtl inspLine : inspectionLines) {
            for (TxnDetailDtl srcLine : sourceLines) {
                if (!sameInspectionSourceLine(inspLine, srcLine)) {
                    continue;
                }
                srcLine.setTxdLocationIdLoc(rejectedLoc);
                detailRepo.save(srcLine);
                String batch = resolveStockBatch(inspLine);
                if (srcLine.getTxdBlsIdIbm() != null) {
                    blsService.moveUnitToLocation(srcLine.getTxdBlsIdIbm(), rejectedLoc);
                } else if (batch != null && !batch.isBlank()) {
                    blsService.moveMatchingUnitsToLocation(srcLine.getTxdItemIdItm(), batch, rejectedLoc);
                }
            }
        }
        source.setTxhLocationIdLoc(rejectedLoc);
        source.setTxhStatus("Completed");
        source.setTxhModifiedBy(SecurityUtils.loginIdOrSystem());
        source.setTxhModifiedOn(LocalDateTime.now());
        headerRepo.save(source);
    }

    private static boolean sameInspectionSourceLine(TxnDetailDtl insp, TxnDetailDtl src) {
        if (!java.util.Objects.equals(insp.getTxdItemIdItm(), src.getTxdItemIdItm())) {
            return false;
        }
        String inspSerial = blankToNull(insp.getTxdSerialNo());
        String srcSerial = blankToNull(src.getTxdSerialNo());
        if (inspSerial != null || srcSerial != null) {
            return java.util.Objects.equals(inspSerial, srcSerial);
        }
        String inspBatch = blankToNull(insp.getTxdBatchLotNo());
        String srcBatch = blankToNull(src.getTxdBatchLotNo());
        if (inspBatch != null || srcBatch != null) {
            return java.util.Objects.equals(inspBatch, srcBatch);
        }
        return java.util.Objects.equals(insp.getTxdSrNo(), src.getTxdSrNo());
    }

    /**
     * Inspection approval: move stock from quarantine to the destination on each line
     * (GRN-selected store), falling back to the item default/home store.
     */
    private void postInspectionApprovalStock(TxnHeaderMst header, List<TxnDetailDtl> lines, boolean apply) {
        Integer quarantineLoc = header.getTxhLocationIdLoc();
        if (quarantineLoc == null) {
            throw ApiException.badRequest("Quarantine location is required for inspection approval");
        }
        Integer headerId = header.getTxhTxnHeaderId();

        for (TxnDetailDtl line : lines) {
            BigDecimal qty = resolveQty(DocType.INSPECTION_APPROVAL, line);
            if (qty == null || qty.compareTo(BigDecimal.ZERO) == 0) {
                continue;
            }
            Integer itemId = line.getTxdItemIdItm();
            Integer uomId = line.getTxdUomIdUnt();
            String batch = resolveStockBatch(line);
            InvItemMst item = itemRepo.findById(itemId)
                    .orElseThrow(() -> ApiException.badRequest("Item not found: " + itemId));
            Integer homeLoc = resolvePostInspectionLocation(line, item);
            if (homeLoc == null) {
                throw ApiException.badRequest(
                        "Item " + item.getItmItemCode() + " has no move-to store (GRN location or Item Master home)");
            }

            if (apply) {
                if (batch == null || batch.isBlank()) {
                    for (var taken : consumeFifo(itemId, quarantineLoc, uomId, qty, headerId)) {
                        upsertStock(itemId, homeLoc, uomId, taken.batch(), taken.qty(), headerId);
                    }
                } else {
                    upsertStock(itemId, quarantineLoc, uomId, batch, qty.negate(), headerId);
                    upsertStock(itemId, homeLoc, uomId, batch, qty, headerId);
                }
                blsService.moveUnitToLocation(line.getTxdBlsIdIbm(), homeLoc);
                if (batch != null && !batch.isBlank()) {
                    blsService.moveMatchingUnitsToLocation(itemId, batch, homeLoc);
                }
            } else {
                if (batch == null || batch.isBlank()) {
                    for (var taken : consumeFifo(itemId, homeLoc, uomId, qty, headerId)) {
                        upsertStock(itemId, quarantineLoc, uomId, taken.batch(), taken.qty(), headerId);
                    }
                } else {
                    upsertStock(itemId, homeLoc, uomId, batch, qty.negate(), headerId);
                    upsertStock(itemId, quarantineLoc, uomId, batch, qty, headerId);
                }
            }
        }
    }

    /**
     * Destination after inspection: operational location on the source/inspection line if set,
     * otherwise the item's default (ideal) store. System locations (Quarantine etc.) are ignored.
     */
    private Integer resolvePostInspectionLocation(TxnDetailDtl line, InvItemMst item) {
        Integer lineLoc = line.getTxdLocationIdLoc();
        if (lineLoc != null) {
            OrgLocationMst loc = locationRepo.findById(lineLoc).orElse(null);
            if (loc != null && !Boolean.TRUE.equals(loc.getLocIsSystemLocation())) {
                return lineLoc;
            }
        }
        return item.getItmCurrentLocationIdLoc();
    }

    /**
     * Failed inspection: move stock from quarantine to the linked GRN OU Rejected store.
     */
    private void postInspectionRejectStock(TxnHeaderMst header, List<TxnDetailDtl> lines, boolean apply) {
        Integer quarantineLoc = header.getTxhLocationIdLoc();
        if (quarantineLoc == null) {
            throw ApiException.badRequest("Quarantine location is required for inspection rejection");
        }
        Integer rejectedLoc = rejectedForGrnHeader(header.getTxhRefTxnHeaderIdTxh());
        if (rejectedLoc == null) {
            throw ApiException.badRequest("Rejected store could not be resolved for this inspection");
        }
        Integer headerId = header.getTxhTxnHeaderId();

        for (TxnDetailDtl line : lines) {
            BigDecimal qty = resolveQty(DocType.INSPECTION_APPROVAL, line);
            if (qty == null || qty.compareTo(BigDecimal.ZERO) == 0) {
                continue;
            }
            Integer itemId = line.getTxdItemIdItm();
            Integer uomId = line.getTxdUomIdUnt();
            String batch = resolveStockBatch(line);

            if (apply) {
                if (batch == null || batch.isBlank()) {
                    for (var taken : consumeFifo(itemId, quarantineLoc, uomId, qty, headerId)) {
                        upsertStock(itemId, rejectedLoc, uomId, taken.batch(), taken.qty(), headerId);
                    }
                } else {
                    upsertStock(itemId, quarantineLoc, uomId, batch, qty.negate(), headerId);
                    upsertStock(itemId, rejectedLoc, uomId, batch, qty, headerId);
                }
                blsService.moveUnitToLocation(line.getTxdBlsIdIbm(), rejectedLoc);
                if (batch != null && !batch.isBlank()) {
                    blsService.moveMatchingUnitsToLocation(itemId, batch, rejectedLoc);
                }
            } else {
                if (batch == null || batch.isBlank()) {
                    for (var taken : consumeFifo(itemId, rejectedLoc, uomId, qty, headerId)) {
                        upsertStock(itemId, quarantineLoc, uomId, taken.batch(), taken.qty(), headerId);
                    }
                } else {
                    upsertStock(itemId, rejectedLoc, uomId, batch, qty.negate(), headerId);
                    upsertStock(itemId, quarantineLoc, uomId, batch, qty, headerId);
                }
            }
        }
    }

    /**
     * Stock row key: explicit batch, else serial (one bucket per asset unit), else blank (shared).
     */
    private String resolveStockBatch(TxnDetailDtl line) {
        if (line.getTxdBatchLotNo() != null && !line.getTxdBatchLotNo().isBlank()) {
            return line.getTxdBatchLotNo().trim();
        }
        if (line.getTxdSerialNo() != null && !line.getTxdSerialNo().isBlank()) {
            return line.getTxdSerialNo().trim();
        }
        return null;
    }

    private record BatchQty(String batch, BigDecimal qty) {}

    /** Deplete {@code need} from item+location buckets with available qty, oldest first. */
    private List<BatchQty> consumeFifo(
            Integer itemId, Integer locationId, Integer ignoredUomId, BigDecimal need, Integer headerId) {
        List<InvStockMst> rows = stockRepo.findAll((root, query, cb) -> cb.and(
                cb.equal(root.get("stkItemIdItm"), itemId),
                cb.equal(root.get("stkLocationIdLoc"), locationId),
                cb.or(cb.isNull(root.get("stkIsactive")), cb.isTrue(root.get("stkIsactive")))
        )).stream()
                .filter(s -> nz(s.getStkAvailableQty()).compareTo(BigDecimal.ZERO) > 0
                        || nz(s.getStkCurrentQty()).compareTo(BigDecimal.ZERO) > 0)
                .sorted((a, b) -> {
                    LocalDateTime ca = a.getStkCreatedOn();
                    LocalDateTime cb_ = b.getStkCreatedOn();
                    if (ca == null && cb_ == null) {
                        return Integer.compare(
                                a.getStkStockId() != null ? a.getStkStockId() : 0,
                                b.getStkStockId() != null ? b.getStkStockId() : 0);
                    }
                    if (ca == null) return -1;
                    if (cb_ == null) return 1;
                    int cmp = ca.compareTo(cb_);
                    if (cmp != 0) return cmp;
                    return Integer.compare(
                            a.getStkStockId() != null ? a.getStkStockId() : 0,
                            b.getStkStockId() != null ? b.getStkStockId() : 0);
                })
                .toList();

        BigDecimal remaining = need;
        List<BatchQty> taken = new ArrayList<>();
        for (InvStockMst stock : rows) {
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) break;
            BigDecimal avail = nz(stock.getStkAvailableQty());
            if (avail.compareTo(BigDecimal.ZERO) <= 0) {
                avail = nz(stock.getStkCurrentQty());
            }
            if (avail.compareTo(BigDecimal.ZERO) <= 0) continue;
            BigDecimal take = avail.min(remaining);
            applyDeltaToExisting(stock, take.negate(), headerId);
            taken.add(new BatchQty(stock.getStkBatchLotNo(), take));
            remaining = remaining.subtract(take);
        }
        if (remaining.compareTo(BigDecimal.ZERO) > 0) {
            throw ApiException.conflict("Insufficient stock for item " + itemId + " at location " + locationId);
        }
        return taken;
    }

    private void applyDeltaToExisting(InvStockMst stock, BigDecimal delta, Integer headerId) {
        BigDecimal next = nz(stock.getStkCurrentQty()).add(delta);
        if (next.compareTo(BigDecimal.ZERO) < 0) {
            throw ApiException.conflict("Insufficient stock for item " + stock.getStkItemIdItm()
                    + " at location " + stock.getStkLocationIdLoc());
        }
        stock.setStkCurrentQty(next);
        stock.setStkAvailableQty(next.subtract(nz(stock.getStkReservedQty())));
        if (delta.compareTo(BigDecimal.ZERO) > 0) {
            stock.setStkInwardQty(nz(stock.getStkInwardQty()).add(delta));
        } else {
            stock.setStkIssuedQty(nz(stock.getStkIssuedQty()).add(delta.abs()));
        }
        stock.setStkModifiedBy(SecurityUtils.loginIdOrSystem());
        stock.setStkModifiedOn(LocalDateTime.now());
        stock.setStkLastTransactionDate(LocalDate.now());
        stock.setStkLastTxnHeaderIdTxh(headerId);
        stockRepo.save(stock);
    }

    private int stockSign(DocType docType) {
        return StockPostingRules.stockSign(docType);
    }

    private static Integer resolveLineIssuedTo(DocType docType, TxnHeaderMst header, LineRequest line) {
        if (docType == DocType.MATERIAL_RETURN) {
            return null;
        }
        if (line.issuedToEmpId() != null) {
            return line.issuedToEmpId();
        }
        if (docType == DocType.MATERIAL_ISSUE) {
            return header.getTxhHandedOverToEmpIdEmp() != null
                    ? header.getTxhHandedOverToEmpIdEmp()
                    : header.getTxhInitiatedByEmpIdEmp();
        }
        return null;
    }

    private static void addNet(Map<Integer, BigDecimal> net, Integer itemId, BigDecimal qty) {
        net.merge(itemId, qty, BigDecimal::add);
    }

    private static boolean isPostedStatus(String status) {
        if (status == null || status.isBlank()) {
            return false;
        }
        String s = status.toLowerCase();
        return !s.contains("draft") && !s.contains("pending") && !s.contains("reject") && !s.contains("cancel");
    }

    private BigDecimal resolveQty(DocType docType, TxnDetailDtl line) {
        return switch (docType) {
            case GRN -> firstNonNull(line.getTxdAcceptedQty(), line.getTxdReceivedQty(), line.getTxdQty());
            case MATERIAL_REQUISITION -> line.getTxdRequestedQty();
            case INSPECTION_APPROVAL -> firstNonNull(line.getTxdQty(), line.getTxdAcceptedQty());
            default -> firstNonNull(line.getTxdQty(), line.getTxdAcceptedQty(), line.getTxdReceivedQty(), line.getTxdRequestedQty());
        };
    }

    private Integer resolveLocation(DocType docType, TxnHeaderMst header, TxnDetailDtl line) {
        if (line.getTxdLocationIdLoc() != null) {
            return line.getTxdLocationIdLoc();
        }
        return switch (docType) {
            case MATERIAL_TRANSFER -> header.getTxhFromLocationIdLoc();
            default -> header.getTxhLocationIdLoc() != null ? header.getTxhLocationIdLoc() : header.getTxhToLocationIdLoc();
        };
    }

    private static Integer resolveBlsLocation(DocType docType, TxnHeaderMst header, Integer lineLocationId) {
        if (docType == DocType.MATERIAL_ISSUE && header.getTxhToLocationIdLoc() != null) {
            return header.getTxhToLocationIdLoc();
        }
        // Transfer: custody must land on the destination store (not the line's from-store).
        if (docType == DocType.MATERIAL_TRANSFER) {
            if (header.getTxhToLocationIdLoc() != null) {
                return header.getTxhToLocationIdLoc();
            }
            // Fall back only if To is missing — never silently keep source as custody.
            return lineLocationId;
        }
        if (docType == DocType.MATERIAL_RETURN && header.getTxhLocationIdLoc() != null) {
            return header.getTxhLocationIdLoc();
        }
        return lineLocationId;
    }

    private Integer resolveReturnFromLocation(TxnHeaderMst header) {
        if (header.getTxhFromLocationIdLoc() != null) {
            return header.getTxhFromLocationIdLoc();
        }
        Integer deptLoc = resolveDepartmentLocationId(header.getTxhDepartmentIdDept());
        if (deptLoc != null) {
            header.setTxhFromLocationIdLoc(deptLoc);
            headerRepo.save(header);
            return deptLoc;
        }
        Integer empId = header.getTxhInitiatedByEmpIdEmp();
        if (empId == null) {
            return null;
        }
        Integer base = employeeRepo.findById(empId).map(HrcEmployeeMst::getEmpBaseLocationIdLoc).orElse(null);
        if (base != null) {
            header.setTxhFromLocationIdLoc(base);
            headerRepo.save(header);
        }
        return base;
    }

    private void moveStock(
            Integer itemId,
            Integer fromLoc,
            Integer toLoc,
            Integer uomId,
            String batch,
            BigDecimal qty,
            Integer headerId
    ) {
        if (fromLoc == null || toLoc == null) {
            throw ApiException.badRequest("From and To locations are required to move stock");
        }
        if (fromLoc.equals(toLoc) || qty == null || qty.compareTo(BigDecimal.ZERO) == 0) {
            return;
        }
        if (batch == null || batch.isBlank()) {
            for (var taken : consumeFifo(itemId, fromLoc, uomId, qty, headerId)) {
                upsertStock(itemId, toLoc, uomId, taken.batch(), taken.qty(), headerId);
                blsService.moveMatchingUnitsToLocation(itemId, taken.batch(), toLoc);
            }
        } else {
            upsertStock(itemId, fromLoc, uomId, batch, qty.negate(), headerId);
            upsertStock(itemId, toLoc, uomId, batch, qty, headerId);
            blsService.moveMatchingUnitsToLocation(itemId, batch, toLoc);
        }
    }

    private void upsertStock(
            Integer itemId,
            Integer locationId,
            Integer uomId,
            String batch,
            BigDecimal delta,
            Integer headerId
    ) {
        if (delta.compareTo(BigDecimal.ZERO) == 0) {
            return;
        }
        InvStockMst stock = stockRepo.findAll((root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            preds.add(cb.equal(root.get("stkItemIdItm"), itemId));
            preds.add(cb.equal(root.get("stkLocationIdLoc"), locationId));
            if (batch == null || batch.isBlank()) {
                preds.add(cb.or(cb.isNull(root.get("stkBatchLotNo")), cb.equal(root.get("stkBatchLotNo"), "")));
            } else {
                preds.add(cb.equal(root.get("stkBatchLotNo"), batch));
            }
            return cb.and(preds.toArray(Predicate[]::new));
        }).stream().findFirst().orElse(null);

        if (stock == null) {
            if (delta.compareTo(BigDecimal.ZERO) < 0) {
                throw ApiException.conflict("Insufficient stock for item " + itemId + " at location " + locationId);
            }
            stock = new InvStockMst();
            stock.setStkItemIdItm(itemId);
            stock.setStkLocationIdLoc(locationId);
            stock.setStkUomIdUnt(uomId);
            stock.setStkBatchLotNo(batch);
            stock.setStkCurrentQty(delta);
            stock.setStkAvailableQty(delta);
            stock.setStkInwardQty(delta.compareTo(BigDecimal.ZERO) > 0 ? delta : BigDecimal.ZERO);
            stock.setStkIsactive(true);
            stock.setStkCreatedBy(SecurityUtils.loginIdOrSystem());
            stock.setStkCreatedOn(LocalDateTime.now());
            stock.setStkLastTransactionDate(LocalDate.now());
        } else {
            BigDecimal next = nz(stock.getStkCurrentQty()).add(delta);
            if (next.compareTo(BigDecimal.ZERO) < 0) {
                throw ApiException.conflict("Insufficient stock for item " + itemId + " at location " + locationId);
            }
            stock.setStkCurrentQty(next);
            stock.setStkAvailableQty(next.subtract(nz(stock.getStkReservedQty())));
            if (delta.compareTo(BigDecimal.ZERO) > 0) {
                stock.setStkInwardQty(nz(stock.getStkInwardQty()).add(delta));
            } else {
                stock.setStkIssuedQty(nz(stock.getStkIssuedQty()).add(delta.abs()));
            }
            stock.setStkModifiedBy(SecurityUtils.loginIdOrSystem());
            stock.setStkModifiedOn(LocalDateTime.now());
            stock.setStkLastTransactionDate(LocalDate.now());
        }
        stock.setStkLastTxnHeaderIdTxh(headerId);
        stockRepo.save(stock);
    }

    private BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    @SafeVarargs
    private final BigDecimal firstNonNull(BigDecimal... values) {
        for (BigDecimal v : values) {
            if (v != null) {
                return v;
            }
        }
        return BigDecimal.ZERO;
    }

    /** Original filename is stored after '#' on txh_attachment_url so no extra column is required. */
    private static String packAttachment(String url, String name) {
        if (url == null || url.isBlank()) {
            return null;
        }
        String base = url.split("#", 2)[0];
        if (name == null || name.isBlank()) {
            return base;
        }
        return base + "#" + URLEncoder.encode(name.trim(), StandardCharsets.UTF_8);
    }

    private static String unpackAttachmentUrl(String stored) {
        if (stored == null || stored.isBlank()) {
            return null;
        }
        int hash = stored.indexOf('#');
        return hash < 0 ? stored : stored.substring(0, hash);
    }

    private static String unpackAttachmentName(String stored) {
        if (stored == null) {
            return null;
        }
        int hash = stored.indexOf('#');
        if (hash < 0 || hash >= stored.length() - 1) {
            return null;
        }
        return URLDecoder.decode(stored.substring(hash + 1), StandardCharsets.UTF_8);
    }

    private Integer resolveDepartmentLocationId(Integer departmentId) {
        if (departmentId == null) {
            return null;
        }
        return departmentRepo.findById(departmentId)
                .map(HrcDepartmentMst::getDeptLocationIdLoc)
                .orElse(null);
    }

    private ListItem toListItem(TxnHeaderMst h, int totalItems) {
        String storedAttachment = h.getTxhAttachmentUrl();
        return new ListItem(
                h.getTxhTxnHeaderId(),
                h.getTxhDocNo(),
                h.getTxhDocType(),
                h.getTxhDocDate(),
                h.getTxhPostingDate(),
                h.getTxhRequiredByDate(),
                h.getTxhEntityIdEnt(),
                inspectionQuarantineDisplayLocation(h),
                h.getTxhFromLocationIdLoc(),
                h.getTxhToLocationIdLoc(),
                h.getTxhPartyIdVnd(),
                h.getTxhDepartmentIdDept(),
                resolveDepartmentLocationId(h.getTxhDepartmentIdDept()),
                h.getTxhInitiatedByEmpIdEmp(),
                h.getTxhRefTxnHeaderIdTxh(),
                h.getTxhReferenceNo(),
                h.getTxhInvoiceNo(),
                totalItems,
                h.getTxhTotalAmount(),
                h.getTxhStatus(),
                h.getTxhDocSubtype(),
                h.getTxhReturnFlag(),
                unpackAttachmentUrl(storedAttachment),
                unpackAttachmentName(storedAttachment),
                h.getTxhCreatedOn(),
                h.getTxhModifiedOn()
        );
    }

    private DocumentResponse toDocument(TxnHeaderMst h, List<TxnDetailDtl> lines, String message) {
        List<LineResponse> lineResponses = lines.stream().map(this::toLine).toList();
        return new DocumentResponse(
                h.getTxhTxnHeaderId(),
                h.getTxhDocNo(),
                h.getTxhDocType(),
                h.getTxhDocDate(),
                h.getTxhPostingDate(),
                h.getTxhRequiredByDate(),
                h.getTxhEntityIdEnt(),
                inspectionQuarantineDisplayLocation(h),
                h.getTxhFromLocationIdLoc(),
                h.getTxhToLocationIdLoc(),
                h.getTxhPartyIdVnd(),
                h.getTxhPartyAdd(),
                h.getTxhPartyContactPerson(),
                h.getTxhPartyPhone(),
                h.getTxhPartyGstin(),
                h.getTxhShipTo(),
                h.getTxhDepartmentIdDept(),
                resolveDepartmentLocationId(h.getTxhDepartmentIdDept()),
                h.getTxhInitiatedByEmpIdEmp(),
                h.getTxhEmployeeRefCode(),
                h.getTxhDesignation(),
                h.getTxhDocSubtype(),
                h.getTxhReturnFlag(),
                h.getTxhRefTxnHeaderIdTxh(),
                h.getTxhReferenceNo(),
                h.getTxhInvoiceNo(),
                h.getTxhInvoiceDate(),
                h.getTxhPoNo(),
                h.getTxhPoDate(),
                h.getTxhPurpose(),
                unpackAttachmentUrl(h.getTxhAttachmentUrl()),
                unpackAttachmentName(h.getTxhAttachmentUrl()),
                h.getTxhInspectedByEmpIdEmp(),
                h.getTxhInspectionDate(),
                h.getTxhHandedOverToEmpIdEmp(),
                h.getTxhHandoverDesignation(),
                h.getTxhHandoverDate(),
                h.getTxhReceivedByEmpIdEmp(),
                h.getTxhReceivedByName(),
                h.getTxhReceivedDesignation(),
                h.getTxhReceivedDate(),
                h.getTxhConditionOnReturn(),
                h.getTxhPreparedByEmpIdEmp(),
                h.getTxhPreparedDate(),
                h.getTxhApprovedByEmpIdEmp(),
                h.getTxhApprovedDate(),
                h.getTxhTotalOrderedQty(),
                h.getTxhTotalReceivedQty(),
                h.getTxhTotalAcceptedQty(),
                h.getTxhTotalRejectedQty(),
                h.getTxhTotalPendingQty(),
                h.getTxhTotalAmount(),
                h.getTxhFooterRemark(),
                h.getTxhRemarks(),
                h.getTxhStatus(),
                h.getTxhCreatedBy(),
                h.getTxhCreatedOn(),
                message,
                lineResponses
        );
    }

    private LineResponse toLine(TxnDetailDtl d) {
        InvItemMst item = d.getTxdItemIdItm() != null
                ? itemRepo.findById(d.getTxdItemIdItm()).orElse(null)
                : null;
        Integer uomId = d.getTxdUomIdUnt() != null
                ? d.getTxdUomIdUnt()
                : (item != null ? item.getItmUomIdUnt() : null);
        UnitMst unit = uomId != null ? unitRepo.findById(uomId).orElse(null) : null;
        return new LineResponse(
                d.getTxdTxnDetailId(),
                d.getTxdSrNo(),
                d.getTxdItemIdItm(),
                item != null ? item.getItmItemCode() : null,
                item != null ? item.getItmItemName() : null,
                item != null ? item.getItmItemType() : null,
                uomId,
                unit != null ? unit.getUntUnitCode() : null,
                d.getTxdOrderedQty(),
                d.getTxdReceivedQty(),
                d.getTxdAcceptedQty(),
                d.getTxdRejectedQty(),
                d.getTxdRequestedQty(),
                d.getTxdQty(),
                d.getTxdAvailableStock(),
                d.getTxdAmount(),
                d.getTxdRate(),
                d.getTxdMrp(),
                d.getTxdBatchLotNo(),
                d.getTxdMfgDate(),
                d.getTxdExpiryDate(),
                d.getTxdLocationIdLoc(),
                d.getTxdLocationBin(),
                d.getTxdItemCondition(),
                d.getTxdSerialNo(),
                d.getTxdIpAddress(),
                d.getTxdMacAddress(),
                d.getTxdHostname(),
                d.getTxdIssuedToEmpIdEmp(),
                d.getTxdRemark(),
                d.getTxdBlsIdIbm()
        );
    }
}
