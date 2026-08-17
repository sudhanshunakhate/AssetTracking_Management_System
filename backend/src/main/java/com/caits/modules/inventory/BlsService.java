package com.caits.modules.inventory;

import com.caits.common.ApiException;
import com.caits.domain.entity.InvBlsMst;
import com.caits.domain.entity.InvItemMst;
import com.caits.domain.repository.InvBlsMstRepository;
import com.caits.domain.repository.InvItemMstRepository;
import com.caits.domain.repository.TxnDetailDtlRepository;
import com.caits.modules.transactions.DocType;
import com.caits.modules.transactions.StockPostingRules;
import com.caits.modules.transactions.TxnDtos.LineRequest;
import com.caits.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Resolves or creates Batch/Lot/Serial (BLS) rows when a transaction line is saved.
 * <ul>
 *   <li>Serial present → one BLS per serial (asset unit)</li>
 *   <li>Batch present, no serial → one BLS per item+batch</li>
 *   <li>Otherwise → shared dummy BLS per item (non-tracked stock)</li>
 * </ul>
 */
@Service
public class BlsService {

    private final InvBlsMstRepository blsRepo;
    private final InvItemMstRepository itemRepo;
    private final TxnDetailDtlRepository detailRepo;

    public BlsService(InvBlsMstRepository blsRepo, InvItemMstRepository itemRepo, TxnDetailDtlRepository detailRepo) {
        this.blsRepo = blsRepo;
        this.itemRepo = itemRepo;
        this.detailRepo = detailRepo;
    }

    @Transactional
    public InvBlsMst resolveForLine(Integer entityId, Integer locationId, LineRequest line,
                                    Integer currentHeaderId, DocType docType) {
        if (line.itemId() == null) {
            throw ApiException.badRequest("line.itemId is required for BLS");
        }
        InvItemMst item = itemRepo.findById(line.itemId())
                .orElseThrow(() -> ApiException.badRequest("Item not found: " + line.itemId()));

        String serial = blankToNull(line.serialNo());
        String batch = blankToNull(line.batchLotNo());

        if (serial != null) {
            return upsertSerialUnit(entityId, locationId, item, line, serial, currentHeaderId, docType);
        }
        if (batch != null || Boolean.TRUE.equals(item.getItmTrackBatchLot())) {
            if (batch == null) {
                return findOrCreateDummy(entityId, locationId, item.getItmItemId());
            }
            return upsertBatch(entityId, locationId, item, line, batch);
        }
        return findOrCreateDummy(entityId, locationId, item.getItmItemId());
    }

    private InvBlsMst upsertSerialUnit(Integer entityId, Integer locationId, InvItemMst item,
                                       LineRequest line, String serial,
                                       Integer currentHeaderId, DocType docType) {
        InvBlsMst existing = blsRepo.findFirstByIbmSerialNoIgnoreCaseAndIbmIsactiveTrue(serial).orElse(null);
        if (existing != null) {
            if (!existing.getIbmItemIdItm().equals(item.getItmItemId())) {
                throw ApiException.conflict("Serial No. " + serial + " is already registered to another item");
            }
            if (StockPostingRules.isInboundStock(docType)
                    && currentHeaderId != null
                    && detailRepo.existsByTxdBlsIdIbmAndTxdTxnHeaderIdTxhNot(existing.getIbmBlsId(), currentHeaderId)) {
                throw ApiException.conflict("Serial No. " + serial + " is already registered");
            }
            applyInstanceFields(existing, entityId, locationId, line);
            existing.setIbmModifiedBy(SecurityUtils.loginIdOrSystem());
            existing.setIbmModifiedOn(LocalDateTime.now());
            return blsRepo.save(existing);
        }
        InvBlsMst bls = newBls(entityId, locationId, item.getItmItemId(), false);
        bls.setIbmSerialNo(serial);
        bls.setIbmBatchNo(blankToNull(line.batchLotNo()));
        applyInstanceFields(bls, entityId, locationId, line);
        return blsRepo.save(bls);
    }

    private InvBlsMst upsertBatch(Integer entityId, Integer locationId, InvItemMst item,
                                  LineRequest line, String batch) {
        InvBlsMst existing = blsRepo
                .findFirstByIbmItemIdItmAndIbmBatchNoIgnoreCaseAndIbmIsDummyFalseAndIbmIsactiveTrue(
                        item.getItmItemId(), batch)
                .orElse(null);
        if (existing != null) {
            applyInstanceFields(existing, entityId, locationId, line);
            existing.setIbmModifiedBy(SecurityUtils.loginIdOrSystem());
            existing.setIbmModifiedOn(LocalDateTime.now());
            return blsRepo.save(existing);
        }
        InvBlsMst bls = newBls(entityId, locationId, item.getItmItemId(), false);
        bls.setIbmBatchNo(batch);
        applyInstanceFields(bls, entityId, locationId, line);
        return blsRepo.save(bls);
    }

    private InvBlsMst findOrCreateDummy(Integer entityId, Integer locationId, Integer itemId) {
        return blsRepo.findFirstByIbmItemIdItmAndIbmIsDummyTrueAndIbmIsactiveTrue(itemId)
                .orElseGet(() -> {
                    InvBlsMst bls = newBls(entityId, locationId, itemId, true);
                    return blsRepo.save(bls);
                });
    }

    private InvBlsMst newBls(Integer entityId, Integer locationId, Integer itemId, boolean dummy) {
        InvBlsMst bls = new InvBlsMst();
        bls.setIbmEntityIdEnt(entityId);
        bls.setIbmItemIdItm(itemId);
        bls.setIbmCurrentLocationIdLoc(locationId);
        bls.setIbmIsDummy(dummy);
        bls.setIbmIsactive(true);
        bls.setIbmIslocked(false);
        bls.setIbmCreatedBy(SecurityUtils.loginIdOrSystem());
        bls.setIbmCreatedOn(LocalDateTime.now());
        return bls;
    }

    private void applyInstanceFields(InvBlsMst bls, Integer entityId, Integer locationId, LineRequest line) {
        if (entityId != null) bls.setIbmEntityIdEnt(entityId);
        if (locationId != null) bls.setIbmCurrentLocationIdLoc(locationId);
        if (line.mfgDate() != null) bls.setIbmMfgDate(line.mfgDate());
        if (line.expiryDate() != null) bls.setIbmExpiryDate(line.expiryDate());
        if (blankToNull(line.ipAddress()) != null) bls.setIbmIpAddress(line.ipAddress().trim());
        if (blankToNull(line.macAddress()) != null) bls.setIbmMacAddress(line.macAddress().trim());
        if (blankToNull(line.hostname()) != null) bls.setIbmHostname(line.hostname().trim());
        if (blankToNull(line.itemCondition()) != null) bls.setIbmItemCondition(line.itemCondition().trim());
        bls.setIbmIssuedToEmpIdEmp(line.issuedToEmpId());
    }

    private static String blankToNull(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }
}
