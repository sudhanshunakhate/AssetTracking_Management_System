package com.caits.modules.masters.service;

import com.caits.common.ApiException;
import com.caits.common.MessageResponse;
import com.caits.common.PageResponse;
import com.caits.common.spec.SpecUtils;
import com.caits.domain.entity.*;
import com.caits.domain.repository.*;
import com.caits.modules.masters.dto.MasterDtos.*;
import com.caits.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class ItemMastersService {

    private final InvItemMstRepository itemRepo;
    private final InvVendorMstRepository vendorRepo;
    private final InvStockMstRepository stockRepo;
    private final UnitMstRepository unitRepo;
    private final CategoryMstRepository categoryRepo;

    public ItemMastersService(InvItemMstRepository itemRepo, InvVendorMstRepository vendorRepo,
                              InvStockMstRepository stockRepo, UnitMstRepository unitRepo,
                              CategoryMstRepository categoryRepo) {
        this.itemRepo = itemRepo;
        this.vendorRepo = vendorRepo;
        this.stockRepo = stockRepo;
        this.unitRepo = unitRepo;
        this.categoryRepo = categoryRepo;
    }

    // ---- Items ----
    @Transactional(readOnly = true)
    public PageResponse<ItemDto> listItems(int page, int pageSize, String search, Boolean isActive) {
        Specification<InvItemMst> spec = SpecUtils.combine(
                SpecUtils.activeEquals("itmIsactive", isActive),
                SpecUtils.searchContains(search, "itmItemCode", "itmItemName"));
        Page<InvItemMst> result = itemRepo.findAll(spec, PageRequest.of(Math.max(page - 1, 0), pageSize));
        return PageResponse.of(page, pageSize, result.getTotalElements(),
                result.getContent().stream().map(e -> toItemDto(e, null)).toList());
    }

    @Transactional(readOnly = true)
    public ItemDto getItem(Integer id) {
        return toItemDto(findItem(id), null);
    }

    @Transactional
    public ItemDto createItem(ItemRequest req) {
        require(req.itemCode(), "itemCode");
        if (req.uomId() == null) throw ApiException.badRequest("uomId is required");
        if (req.itemType() == null || req.itemType().isBlank()) throw ApiException.badRequest("itemType is required");
        unitRepo.findById(req.uomId()).orElseThrow(() -> ApiException.badRequest("Invalid uomId"));
        if (req.categoryId() != null) {
            categoryRepo.findById(req.categoryId()).orElseThrow(() -> ApiException.badRequest("Invalid categoryId"));
        }
        if (itemRepo.existsByItmItemCodeIgnoreCase(req.itemCode())) {
            throw ApiException.conflict("Item code already exists");
        }
        InvItemMst e = new InvItemMst();
        applyItem(e, req);
        e.setItmCreatedBy(SecurityUtils.requireLoginId());
        e.setItmCreatedOn(LocalDateTime.now());
        return toItemDto(itemRepo.save(e), "Item created successfully");
    }

    @Transactional
    public ItemDto updateItem(Integer id, ItemRequest req) {
        InvItemMst e = findItem(id);
        if (req.itemCode() != null && !req.itemCode().equalsIgnoreCase(e.getItmItemCode())
                && itemRepo.existsByItmItemCodeIgnoreCase(req.itemCode())) {
            throw ApiException.conflict("Item code already exists");
        }
        if (req.uomId() != null) {
            unitRepo.findById(req.uomId()).orElseThrow(() -> ApiException.badRequest("Invalid uomId"));
        }
        applyItem(e, req);
        e.setItmModifiedBy(SecurityUtils.requireLoginId());
        e.setItmModifiedOn(LocalDateTime.now());
        return toItemDto(itemRepo.save(e), "Item updated successfully");
    }

    @Transactional
    public MessageResponse deleteItem(Integer id) {
        InvItemMst e = findItem(id);
        e.setItmIsactive(false);
        e.setItmModifiedBy(SecurityUtils.requireLoginId());
        e.setItmModifiedOn(LocalDateTime.now());
        itemRepo.save(e);
        return MessageResponse.of("Item deactivated successfully");
    }

    private InvItemMst findItem(Integer id) {
        return itemRepo.findById(id).orElseThrow(() -> ApiException.notFound("Item not found"));
    }

    private void applyItem(InvItemMst e, ItemRequest req) {
        e.setItmItemCode(req.itemCode());
        e.setItmItemName(req.itemName());
        if (req.itemType() != null) e.setItmItemType(req.itemType());
        e.setItmCategoryIdCat(req.categoryId());
        e.setItmSubcategoryIdScat(req.subcategoryId());
        if (req.uomId() != null) e.setItmUomIdUnt(req.uomId());
        e.setItmStandardCost(req.standardCost());
        e.setItmImageUrl(req.imageUrl());
        e.setItmDesc(req.desc());
        e.setItmRemarks(req.remarks());
        e.setItmAssetType(req.assetType());
        e.setItmMakeBrand(req.makeBrand());
        e.setItmModel(req.model());
        e.setItmSerialNo(req.serialNo());
        e.setItmPurchaseDate(req.purchaseDate());
        e.setItmPurchaseCost(req.purchaseCost());
        e.setItmUsefulLifeYears(req.usefulLifeYears());
        e.setItmWarrantyExpiry(req.warrantyExpiry());
        e.setItmDepreciationMethod(req.depreciationMethod());
        e.setItmDepreciationRate(req.depreciationRate());
        e.setItmAssignedToEmpIdEmp(req.assignedToEmpId());
        e.setItmCurrentLocationIdLoc(req.currentLocationId());
        e.setItmIsSerialized(Boolean.TRUE.equals(req.isSerialized()));
        e.setItmIsReturnable(Boolean.TRUE.equals(req.isReturnable()));
        e.setItmIsUnderAmc(Boolean.TRUE.equals(req.isUnderAmc()));
        e.setItmIsInsuranceRequired(Boolean.TRUE.equals(req.isInsuranceRequired()));
        e.setItmInspectionNeeded(Boolean.TRUE.equals(req.inspectionNeeded()));
        e.setItmConsumableType(req.consumableType());
        e.setItmShelfBin(req.shelfBin());
        e.setItmExpiryDate(req.expiryDate());
        e.setItmBatchLotNo(req.batchLotNo());
        e.setItmTrackBatchLot(Boolean.TRUE.equals(req.trackBatchLot()));
        e.setItmTrackExpiry(Boolean.TRUE.equals(req.trackExpiry()));
        e.setItmIsConsumable(Boolean.TRUE.equals(req.isConsumable()) || "consumable".equalsIgnoreCase(req.itemType()));
        e.setItmAllowNegativeStock(Boolean.TRUE.equals(req.allowNegativeStock()));
        e.setItmIsactive(req.isActive() == null || req.isActive());
    }

    private ItemDto toItemDto(InvItemMst e, String message) {
        return new ItemDto(e.getItmItemId(), e.getItmItemCode(), e.getItmItemName(), e.getItmItemType(),
                e.getItmCategoryIdCat(), e.getItmSubcategoryIdScat(), e.getItmUomIdUnt(), e.getItmStandardCost(),
                e.getItmImageUrl(), e.getItmDesc(), e.getItmRemarks(), e.getItmAssetType(), e.getItmMakeBrand(),
                e.getItmModel(), e.getItmSerialNo(), e.getItmPurchaseDate(), e.getItmPurchaseCost(),
                e.getItmUsefulLifeYears(), e.getItmWarrantyExpiry(), e.getItmDepreciationMethod(),
                e.getItmDepreciationRate(), e.getItmAssignedToEmpIdEmp(), e.getItmCurrentLocationIdLoc(),
                e.getItmIsSerialized(), e.getItmIsReturnable(), e.getItmIsUnderAmc(), e.getItmIsInsuranceRequired(),
                e.getItmInspectionNeeded(), e.getItmConsumableType(), e.getItmShelfBin(), e.getItmExpiryDate(),
                e.getItmBatchLotNo(), e.getItmTrackBatchLot(), e.getItmTrackExpiry(), e.getItmIsConsumable(),
                e.getItmAllowNegativeStock(), e.getItmIsactive(), e.getItmCreatedBy(), e.getItmCreatedOn(),
                e.getItmModifiedBy(), e.getItmModifiedOn(), message);
    }

    // ---- Vendors ----
    @Transactional(readOnly = true)
    public PageResponse<VendorDto> listVendors(int page, int pageSize, String search, Boolean isActive) {
        Specification<InvVendorMst> spec = SpecUtils.combine(
                SpecUtils.activeEquals("vndIsactive", isActive),
                SpecUtils.searchContains(search, "vndVendorCode", "vndVendorName"));
        Page<InvVendorMst> result = vendorRepo.findAll(spec, PageRequest.of(Math.max(page - 1, 0), pageSize));
        return PageResponse.of(page, pageSize, result.getTotalElements(),
                result.getContent().stream().map(e -> toVendorDto(e, null)).toList());
    }

    @Transactional(readOnly = true)
    public VendorDto getVendor(Integer id) {
        return toVendorDto(findVendor(id), null);
    }

    @Transactional
    public VendorDto createVendor(VendorRequest req) {
        require(req.vendorCode(), "vendorCode");
        if (req.partyType() == null || req.partyType().isBlank()) throw ApiException.badRequest("partyType is required");
        validateVendorContact(req);
        if (vendorRepo.existsByVndVendorCodeIgnoreCase(req.vendorCode())) {
            throw ApiException.conflict("Vendor code already exists");
        }
        InvVendorMst e = new InvVendorMst();
        applyVendor(e, req);
        e.setVndCreatedBy(SecurityUtils.requireLoginId());
        e.setVndCreatedOn(LocalDateTime.now());
        return toVendorDto(vendorRepo.save(e), "Vendor created successfully");
    }

    @Transactional
    public VendorDto updateVendor(Integer id, VendorRequest req) {
        InvVendorMst e = findVendor(id);
        if (req.vendorCode() != null && !req.vendorCode().equalsIgnoreCase(e.getVndVendorCode())
                && vendorRepo.existsByVndVendorCodeIgnoreCase(req.vendorCode())) {
            throw ApiException.conflict("Vendor code already exists");
        }
        validateVendorContact(req);
        applyVendor(e, req);
        e.setVndModifiedBy(SecurityUtils.requireLoginId());
        e.setVndModifiedOn(LocalDateTime.now());
        return toVendorDto(vendorRepo.save(e), "Vendor updated successfully");
    }

    @Transactional
    public MessageResponse deleteVendor(Integer id) {
        InvVendorMst e = findVendor(id);
        e.setVndIsactive(false);
        e.setVndModifiedBy(SecurityUtils.requireLoginId());
        e.setVndModifiedOn(LocalDateTime.now());
        vendorRepo.save(e);
        return MessageResponse.of("Vendor deactivated successfully");
    }

    private InvVendorMst findVendor(Integer id) {
        return vendorRepo.findById(id).orElseThrow(() -> ApiException.notFound("Vendor not found"));
    }

    private void applyVendor(InvVendorMst e, VendorRequest req) {
        e.setVndVendorCode(req.vendorCode());
        e.setVndVendorName(req.vendorName());
        if (req.partyType() != null) e.setVndPartyType(req.partyType());
        e.setVndGstin(req.gstin());
        e.setVndPanNo(req.panNo());
        e.setVndRating(req.rating());
        e.setVndAdd1(req.add1());
        e.setVndAdd2(req.add2());
        e.setVndCity(req.city());
        e.setVndState(req.state());
        e.setVndPin(req.pin());
        e.setVndCountry(req.country() == null || req.country().isBlank() ? "India" : req.country());
        e.setVndContactPerson(req.contactPerson());
        if (req.phone() != null) e.setVndPhone(req.phone());
        e.setVndAltPhone(req.altPhone());
        e.setVndEmail(req.email());
        e.setVndWebsite(req.website());
        e.setVndNotes(req.notes());
        e.setVndIsactive(req.isActive() == null || req.isActive());
    }

    private VendorDto toVendorDto(InvVendorMst e, String message) {
        return new VendorDto(e.getVndVendorId(), e.getVndVendorCode(), e.getVndVendorName(), e.getVndPartyType(),
                e.getVndGstin(), e.getVndPanNo(), e.getVndRating(), e.getVndAdd1(), e.getVndAdd2(), e.getVndCity(),
                e.getVndState(), e.getVndPin(), e.getVndCountry(), e.getVndContactPerson(), e.getVndPhone(),
                e.getVndAltPhone(), e.getVndEmail(), e.getVndWebsite(), e.getVndNotes(), e.getVndIsactive(),
                e.getVndCreatedBy(), e.getVndCreatedOn(), e.getVndModifiedBy(), e.getVndModifiedOn(), message);
    }

    // ---- Stock (read-only) ----
    @Transactional(readOnly = true)
    public PageResponse<StockDto> listStock(int page, int pageSize, String search, Boolean isActive, Integer itemId, Integer locationId) {
        Specification<InvStockMst> spec = SpecUtils.combine(
                SpecUtils.activeEquals("stkIsactive", isActive),
                SpecUtils.eq("stkItemIdItm", itemId),
                SpecUtils.eq("stkLocationIdLoc", locationId));
        Page<InvStockMst> result = stockRepo.findAll(spec, PageRequest.of(Math.max(page - 1, 0), pageSize));
        return PageResponse.of(page, pageSize, result.getTotalElements(),
                result.getContent().stream().map(this::toStockDto).toList());
    }

    @Transactional(readOnly = true)
    public StockDetailDto getStock(Integer itemId, Integer locationId) {
        InvStockMst e = stockRepo.findFirstByStkItemIdItmAndStkLocationIdLoc(itemId, locationId)
                .orElseThrow(() -> ApiException.notFound("Stock record not found"));
        return new StockDetailDto(e.getStkItemIdItm(), e.getStkLocationIdLoc(), e.getStkCurrentQty(),
                e.getStkReservedQty(), e.getStkAvailableQty(), e.getStkBatchLotNo());
    }

    private StockDto toStockDto(InvStockMst e) {
        return new StockDto(e.getStkStockId(), e.getStkItemIdItm(), e.getStkLocationIdLoc(), e.getStkCurrentQty(),
                e.getStkReservedQty(), e.getStkAvailableQty(), e.getStkBatchLotNo(), e.getStkIsactive());
    }

    private static void require(String v, String field) {
        if (v == null || v.isBlank()) throw ApiException.badRequest(field + " is required");
    }

    private static void validateVendorContact(VendorRequest req) {
        if (req.phone() == null || req.phone().isBlank()) throw ApiException.badRequest("phone is required");
        String phoneDigits = digitsOnly(req.phone());
        if (!isValidPhoneDigits(phoneDigits)) {
            throw ApiException.badRequest("Primary phone must be a valid 10-digit Indian mobile number");
        }
        String alt = req.altPhone();
        if (alt != null && !alt.isBlank()) {
            String altDigits = digitsOnly(alt);
            if (!isValidPhoneDigits(altDigits)) {
                throw ApiException.badRequest("Alternate phone must be a valid 10-digit Indian mobile number");
            }
            if (phoneDigits.equals(altDigits)) {
                throw ApiException.badRequest("Primary and alternate phone numbers cannot be the same");
            }
        }
        if (req.panNo() != null && !req.panNo().isBlank()) {
            String pan = req.panNo().trim().toUpperCase();
            if (!pan.matches("^[A-Z]{5}[0-9]{4}[A-Z]$")) {
                throw ApiException.badRequest("PAN must be in format AAAAA9999A");
            }
            char fourth = pan.charAt(3);
            if ("IP".indexOf(fourth) < 0 && "CHFATBLJG".indexOf(fourth) < 0) {
                throw ApiException.badRequest("PAN 4th character is invalid (I/P=Individual, C=Company, H=HUF, F=Firm, …)");
            }
        }
    }

    private static String digitsOnly(String v) {
        return v == null ? "" : v.replaceAll("\\D", "");
    }

    /** Accepts 10-digit mobile, or 12 digits starting with 91. */
    private static boolean isValidPhoneDigits(String digits) {
        if (digits == null) return false;
        if (digits.length() == 12 && digits.startsWith("91")) digits = digits.substring(2);
        return digits.matches("^[6-9]\\d{9}$");
    }
}
