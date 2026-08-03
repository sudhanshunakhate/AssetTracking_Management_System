package com.caits.modules.transactions;

import com.caits.common.ApiException;
import com.caits.common.MessageResponse;
import com.caits.common.PageResponse;
import com.caits.domain.entity.InvBlsMst;
import com.caits.domain.entity.InvItemMst;
import com.caits.domain.entity.InvStockMst;
import com.caits.domain.entity.TxnDetailDtl;
import com.caits.domain.entity.TxnHeaderMst;
import com.caits.domain.entity.UnitMst;
import com.caits.domain.repository.InvItemMstRepository;
import com.caits.domain.repository.InvStockMstRepository;
import com.caits.domain.repository.TxnDetailDtlRepository;
import com.caits.domain.repository.TxnHeaderMstRepository;
import com.caits.domain.repository.UnitMstRepository;
import com.caits.modules.inventory.BlsService;
import com.caits.modules.transactions.TxnDtos.*;
import com.caits.security.AccessScopeService;
import com.caits.security.SecurityUtils;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TxnDocumentService {

    private final TxnHeaderMstRepository headerRepo;
    private final TxnDetailDtlRepository detailRepo;
    private final InvStockMstRepository stockRepo;
    private final InvItemMstRepository itemRepo;
    private final UnitMstRepository unitRepo;
    private final AccessScopeService accessScope;
    private final BlsService blsService;

    public TxnDocumentService(
            TxnHeaderMstRepository headerRepo,
            TxnDetailDtlRepository detailRepo,
            InvStockMstRepository stockRepo,
            InvItemMstRepository itemRepo,
            UnitMstRepository unitRepo,
            AccessScopeService accessScope,
            BlsService blsService
    ) {
        this.headerRepo = headerRepo;
        this.detailRepo = detailRepo;
        this.stockRepo = stockRepo;
        this.itemRepo = itemRepo;
        this.unitRepo = unitRepo;
        this.accessScope = accessScope;
        this.blsService = blsService;
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
                    // A document is visible if ANY of its location columns is in the allow-list
                    // (covers transfers that only fill from/to).
                    preds.add(cb.or(
                            root.get("txhLocationIdLoc").in(locFilter),
                            root.get("txhFromLocationIdLoc").in(locFilter),
                            root.get("txhToLocationIdLoc").in(locFilter)
                    ));
                }
            }
            if (fromLocationId != null) {
                preds.add(cb.equal(root.get("txhFromLocationIdLoc"), fromLocationId));
            }
            if (toLocationId != null) {
                preds.add(cb.equal(root.get("txhToLocationIdLoc"), toLocationId));
            }
            if (departmentId != null) {
                preds.add(cb.equal(root.get("txhDepartmentIdGmst"), departmentId));
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
            return cb.and(preds.toArray(Predicate[]::new));
        };

        Page<TxnHeaderMst> result = headerRepo.findAll(spec, PageRequest.of(p - 1, size));
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

    @Transactional
    public DocumentResponse create(DocType docType, DocumentRequest req) {
        validateLines(req.lines());
        accessScope.requireLocationAllowed(req.locationId());
        accessScope.requireLocationAllowed(req.fromLocationId());
        accessScope.requireLocationAllowed(req.toLocationId());
        String action = normalizeAction(req.docSubmitAction());
        String status = "SAVE_DRAFT".equals(action) ? "Draft" : initialSubmitStatus(docType);

        TxnHeaderMst header = new TxnHeaderMst();
        applyHeader(header, docType, req);
        header.setTxhDocNo(nextDocNo(docType));
        header.setTxhStatus(status);
        header.setTxhCreatedBy(SecurityUtils.loginIdOrSystem());
        header.setTxhCreatedOn(LocalDateTime.now());
        header = headerRepo.save(header);

        List<TxnDetailDtl> savedLines = saveLines(header, docType, req.lines());
        if ("SUBMIT".equals(action) && postsStockOnSubmit(docType)) {
            postStock(header, savedLines, true);
            header.setTxhStatus("Completed");
            header.setTxhPostingDate(header.getTxhPostingDate() != null ? header.getTxhPostingDate() : LocalDate.now());
            header = headerRepo.save(header);
        }
        return toDocument(header, savedLines, docType.name().replace('_', ' ') + " created successfully");
    }

    @Transactional
    public DocumentResponse update(DocType docType, Integer docId, DocumentRequest req) {
        TxnHeaderMst header = requireHeader(docType, docId);
        if (!isEditable(header.getTxhStatus())) {
            throw ApiException.conflict("Only Draft / Rejected documents can be updated");
        }
        validateLines(req.lines());
        accessScope.requireLocationAllowed(req.locationId());
        accessScope.requireLocationAllowed(req.fromLocationId());
        accessScope.requireLocationAllowed(req.toLocationId());

        applyHeader(header, docType, req);
        String action = normalizeAction(req.docSubmitAction());
        if ("SUBMIT".equals(action)) {
            header.setTxhStatus(initialSubmitStatus(docType));
        }
        header.setTxhModifiedBy(SecurityUtils.loginIdOrSystem());
        header.setTxhModifiedOn(LocalDateTime.now());
        header = headerRepo.save(header);

        detailRepo.deleteByTxdTxnHeaderIdTxh(header.getTxhTxnHeaderId());
        List<TxnDetailDtl> savedLines = saveLines(header, docType, req.lines());

        if ("SUBMIT".equals(action) && postsStockOnSubmit(docType)) {
            postStock(header, savedLines, true);
            header.setTxhStatus("Completed");
            header.setTxhPostingDate(LocalDate.now());
            header = headerRepo.save(header);
        }
        return toDocument(header, savedLines, "Document updated successfully");
    }

    @Transactional
    public MessageResponse delete(DocType docType, Integer docId) {
        TxnHeaderMst header = requireHeader(docType, docId);
        if (!"Draft".equalsIgnoreCase(header.getTxhStatus()) && !"Rejected".equalsIgnoreCase(header.getTxhStatus())) {
            throw ApiException.conflict("Only Draft / Rejected documents can be deleted");
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
        return MessageResponse.of("Document rejected successfully");
    }

    public DocumentResponse printView(DocType docType, Integer docId) {
        return get(docType, docId);
    }

    public PageResponse<ListItem> pendingRequisitions(Integer locationId) {
        return list(
                DocType.MATERIAL_REQUISITION,
                "Approved",
                null, null, locationId, null, null, null, null, null, null, null,
                1, 100
        );
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

    /** A document is visible when at least one of its location columns is in the allow-list. */
    private void requireDocumentVisible(TxnHeaderMst header) {
        AccessScopeService.Scope scope = accessScope.current();
        if (!scope.locationRestricted()) return;
        List<Integer> allowed = scope.allowedLocationIds();
        boolean ok = (header.getTxhLocationIdLoc() != null && allowed.contains(header.getTxhLocationIdLoc()))
                || (header.getTxhFromLocationIdLoc() != null && allowed.contains(header.getTxhFromLocationIdLoc()))
                || (header.getTxhToLocationIdLoc() != null && allowed.contains(header.getTxhToLocationIdLoc()));
        if (!ok) throw ApiException.forbidden("You do not have access to this document");
    }

    private void validateLines(List<LineRequest> lines) {
        if (lines == null || lines.isEmpty()) {
            throw ApiException.badRequest("At least one line item is required");
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
        return "SUBMIT";
    }

    private String initialSubmitStatus(DocType docType) {
        return StockPostingRules.initialSubmitStatus(docType);
    }

    private boolean postsStockOnSubmit(DocType docType) {
        return StockPostingRules.postsStockOnSubmit(docType);
    }

    private boolean isEditable(String status) {
        return "Draft".equalsIgnoreCase(status) || "Rejected".equalsIgnoreCase(status);
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

    private void applyHeader(TxnHeaderMst h, DocType docType, DocumentRequest req) {
        h.setTxhDocType(docType.code());
        h.setTxhDocDate(req.docDate() != null ? req.docDate() : LocalDate.now());
        h.setTxhPostingDate(req.postingDate());
        h.setTxhRequiredByDate(req.requiredByDate());
        h.setTxhEntityIdEnt(req.entityId());
        h.setTxhLocationIdLoc(req.locationId());
        h.setTxhFromLocationIdLoc(req.fromLocationId());
        h.setTxhToLocationIdLoc(req.toLocationId());
        h.setTxhPartyIdVnd(req.partyId());
        h.setTxhPartyAdd(req.partyAdd());
        h.setTxhPartyContactPerson(req.partyContactPerson());
        h.setTxhPartyPhone(req.partyPhone());
        h.setTxhPartyGstin(req.partyGstin());
        h.setTxhShipTo(req.shipTo());
        h.setTxhDepartmentIdGmst(req.departmentId());
        h.setTxhInitiatedByEmpIdEmp(req.initiatedByEmpId());
        h.setTxhEmployeeRefCode(req.employeeRefCode());
        h.setTxhDesignation(req.designation());
        h.setTxhDocSubtype(req.docSubtype());
        h.setTxhReturnFlag(req.returnFlag());
        h.setTxhRefTxnHeaderIdTxh(req.refTxnHeaderId());
        h.setTxhReferenceNo(req.referenceNo());
        h.setTxhInvoiceNo(req.invoiceNo());
        h.setTxhInvoiceDate(req.invoiceDate());
        h.setTxhPoNo(req.poNo());
        h.setTxhPoDate(req.poDate());
        h.setTxhPurpose(req.purpose());
        h.setTxhAttachmentUrl(req.attachmentUrl());
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
        h.setTxhApprovedByEmpIdEmp(req.approvedByEmpId());
        h.setTxhApprovedDate(req.approvedDate());
        h.setTxhTotalOrderedQty(req.totalOrderedQty());
        h.setTxhTotalReceivedQty(req.totalReceivedQty());
        h.setTxhTotalAcceptedQty(req.totalAcceptedQty());
        h.setTxhTotalRejectedQty(req.totalRejectedQty());
        h.setTxhTotalPendingQty(req.totalPendingQty());
        h.setTxhTotalAmount(req.totalAmount());
        h.setTxhFooterRemark(req.footerRemark());
        h.setTxhRemarks(req.remarks());
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
            d.setTxdLocationIdLoc(line.locationId() != null ? line.locationId() : header.getTxhLocationIdLoc());
            d.setTxdLocationBin(line.locationBin());
            d.setTxdItemCondition(line.itemCondition());
            d.setTxdSerialNo(line.serialNo());
            d.setTxdIpAddress(line.ipAddress());
            d.setTxdMacAddress(line.macAddress());
            d.setTxdHostname(line.hostname());
            d.setTxdRemark(line.remark());
            // Standing register: create / reuse BLS and point the line at it.
            InvBlsMst bls = blsService.resolveForLine(
                    header.getTxhEntityIdEnt(),
                    d.getTxdLocationIdLoc(),
                    line,
                    header.getTxhTxnHeaderId(),
                    docType);
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

            // Transfer: move qty from source → destination (preserve batch buckets; FIFO when omitted).
            if (docType == DocType.MATERIAL_TRANSFER && apply && sign < 0) {
                Integer toLoc = header.getTxhToLocationIdLoc();
                if (toLoc == null) {
                    throw ApiException.badRequest("To location is required for stock transfer");
                }
                if (batch == null || batch.isBlank()) {
                    for (var taken : consumeFifo(itemId, locationId, uomId, qty, headerId)) {
                        upsertStock(itemId, toLoc, uomId, taken.batch(), taken.qty(), headerId);
                    }
                } else {
                    upsertStock(itemId, locationId, uomId, batch, qty.negate(), headerId);
                    upsertStock(itemId, toLoc, uomId, batch, qty, headerId);
                }
                continue;
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

    private BigDecimal resolveQty(DocType docType, TxnDetailDtl line) {
        return switch (docType) {
            case GRN -> firstNonNull(line.getTxdAcceptedQty(), line.getTxdReceivedQty(), line.getTxdQty());
            case MATERIAL_REQUISITION -> line.getTxdRequestedQty();
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

    private ListItem toListItem(TxnHeaderMst h, int totalItems) {
        return new ListItem(
                h.getTxhTxnHeaderId(),
                h.getTxhDocNo(),
                h.getTxhDocType(),
                h.getTxhDocDate(),
                h.getTxhPostingDate(),
                h.getTxhRequiredByDate(),
                h.getTxhEntityIdEnt(),
                h.getTxhLocationIdLoc(),
                h.getTxhFromLocationIdLoc(),
                h.getTxhToLocationIdLoc(),
                h.getTxhPartyIdVnd(),
                h.getTxhDepartmentIdGmst(),
                h.getTxhInitiatedByEmpIdEmp(),
                h.getTxhRefTxnHeaderIdTxh(),
                h.getTxhInvoiceNo(),
                totalItems,
                h.getTxhTotalAmount(),
                h.getTxhStatus(),
                h.getTxhDocSubtype(),
                h.getTxhReturnFlag()
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
                h.getTxhLocationIdLoc(),
                h.getTxhFromLocationIdLoc(),
                h.getTxhToLocationIdLoc(),
                h.getTxhPartyIdVnd(),
                h.getTxhPartyAdd(),
                h.getTxhPartyContactPerson(),
                h.getTxhPartyPhone(),
                h.getTxhPartyGstin(),
                h.getTxhShipTo(),
                h.getTxhDepartmentIdGmst(),
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
                h.getTxhAttachmentUrl(),
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
                d.getTxdRemark(),
                d.getTxdBlsIdIbm()
        );
    }
}
