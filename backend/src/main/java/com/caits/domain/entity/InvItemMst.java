package com.caits.domain.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Item catalog. Physical unit / batch identity lives on {@link InvBlsMst}.
 * {@code itm_current_location_id_loc} is the item's home store for filtering.
 */
@Entity
@Table(name = "inv_item_mst")
public class InvItemMst {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "itm_item_id", nullable = false)
    private Integer itmItemId;

    @Column(name = "itm_item_code", nullable = false)
    private String itmItemCode;

    @Column(name = "itm_item_name", nullable = false)
    private String itmItemName;

    @Column(name = "itm_item_type", nullable = false)
    private String itmItemType;

    @Column(name = "itm_category_id_cat")
    private Integer itmCategoryIdCat;

    @Column(name = "itm_subcategory_id_scat")
    private Integer itmSubcategoryIdScat;

    @Column(name = "itm_uom_id_unt", nullable = false)
    private Integer itmUomIdUnt;

    @Column(name = "itm_standard_cost")
    private BigDecimal itmStandardCost;

    @Column(name = "itm_image_url")
    private String itmImageUrl;

    @Column(name = "itm_desc")
    private String itmDesc;

    @Column(name = "itm_remarks")
    private String itmRemarks;

    @Column(name = "itm_asset_type")
    private String itmAssetType;

    @Column(name = "itm_make_brand")
    private String itmMakeBrand;

    @Column(name = "itm_model")
    private String itmModel;

    @Column(name = "itm_useful_life_years")
    private BigDecimal itmUsefulLifeYears;

    @Column(name = "itm_depreciation_method")
    private String itmDepreciationMethod;

    @Column(name = "itm_depreciation_rate")
    private BigDecimal itmDepreciationRate;

    @Column(name = "itm_current_location_id_loc")
    private Integer itmCurrentLocationIdLoc;

    @Column(name = "itm_entity_id_ent")
    private Integer itmEntityIdEnt;

    @Column(name = "itm_bu_access_scope")
    private String itmBuAccessScope;

    @Column(name = "itm_location_access_scope")
    private String itmLocationAccessScope;

    @Column(name = "itm_is_serialized")
    private Boolean itmIsSerialized;

    @Column(name = "itm_is_returnable")
    private Boolean itmIsReturnable;

    @Column(name = "itm_is_under_amc")
    private Boolean itmIsUnderAmc;

    @Column(name = "itm_is_insurance_required")
    private Boolean itmIsInsuranceRequired;

    @Column(name = "itm_inspection_needed")
    private Boolean itmInspectionNeeded;

    @Column(name = "itm_consumable_type")
    private String itmConsumableType;

    @Column(name = "itm_track_batch_lot")
    private Boolean itmTrackBatchLot;

    @Column(name = "itm_track_expiry")
    private Boolean itmTrackExpiry;

    @Column(name = "itm_is_consumable")
    private Boolean itmIsConsumable;

    @Column(name = "itm_allow_negative_stock")
    private Boolean itmAllowNegativeStock;

    @Column(name = "itm_ram")
    private String itmRam;

    @Column(name = "itm_storage")
    private String itmStorage;

    @Column(name = "itm_processor")
    private String itmProcessor;

    @Column(name = "itm_product_no")
    private String itmProductNo;

    @Column(name = "itm_parent_item_id_itm")
    private Integer itmParentItemIdItm;

    @Column(name = "itm_isactive", nullable = false)
    private Boolean itmIsactive;

    @Column(name = "itm_created_by")
    private String itmCreatedBy;

    @Column(name = "itm_created_on", nullable = false)
    private LocalDateTime itmCreatedOn;

    @Column(name = "itm_modified_by")
    private String itmModifiedBy;

    @Column(name = "itm_modified_on")
    private LocalDateTime itmModifiedOn;

    public Integer getItmItemId() { return itmItemId; }
    public void setItmItemId(Integer itmItemId) { this.itmItemId = itmItemId; }

    public String getItmItemCode() { return itmItemCode; }
    public void setItmItemCode(String itmItemCode) { this.itmItemCode = itmItemCode; }

    public String getItmItemName() { return itmItemName; }
    public void setItmItemName(String itmItemName) { this.itmItemName = itmItemName; }

    public String getItmItemType() { return itmItemType; }
    public void setItmItemType(String itmItemType) { this.itmItemType = itmItemType; }

    public Integer getItmCategoryIdCat() { return itmCategoryIdCat; }
    public void setItmCategoryIdCat(Integer itmCategoryIdCat) { this.itmCategoryIdCat = itmCategoryIdCat; }

    public Integer getItmSubcategoryIdScat() { return itmSubcategoryIdScat; }
    public void setItmSubcategoryIdScat(Integer itmSubcategoryIdScat) { this.itmSubcategoryIdScat = itmSubcategoryIdScat; }

    public Integer getItmUomIdUnt() { return itmUomIdUnt; }
    public void setItmUomIdUnt(Integer itmUomIdUnt) { this.itmUomIdUnt = itmUomIdUnt; }

    public BigDecimal getItmStandardCost() { return itmStandardCost; }
    public void setItmStandardCost(BigDecimal itmStandardCost) { this.itmStandardCost = itmStandardCost; }

    public String getItmImageUrl() { return itmImageUrl; }
    public void setItmImageUrl(String itmImageUrl) { this.itmImageUrl = itmImageUrl; }

    public String getItmDesc() { return itmDesc; }
    public void setItmDesc(String itmDesc) { this.itmDesc = itmDesc; }

    public String getItmRemarks() { return itmRemarks; }
    public void setItmRemarks(String itmRemarks) { this.itmRemarks = itmRemarks; }

    public String getItmAssetType() { return itmAssetType; }
    public void setItmAssetType(String itmAssetType) { this.itmAssetType = itmAssetType; }

    public String getItmMakeBrand() { return itmMakeBrand; }
    public void setItmMakeBrand(String itmMakeBrand) { this.itmMakeBrand = itmMakeBrand; }

    public String getItmModel() { return itmModel; }
    public void setItmModel(String itmModel) { this.itmModel = itmModel; }

    public BigDecimal getItmUsefulLifeYears() { return itmUsefulLifeYears; }
    public void setItmUsefulLifeYears(BigDecimal itmUsefulLifeYears) { this.itmUsefulLifeYears = itmUsefulLifeYears; }

    public String getItmDepreciationMethod() { return itmDepreciationMethod; }
    public void setItmDepreciationMethod(String itmDepreciationMethod) { this.itmDepreciationMethod = itmDepreciationMethod; }

    public BigDecimal getItmDepreciationRate() { return itmDepreciationRate; }
    public void setItmDepreciationRate(BigDecimal itmDepreciationRate) { this.itmDepreciationRate = itmDepreciationRate; }

    public Integer getItmCurrentLocationIdLoc() { return itmCurrentLocationIdLoc; }
    public void setItmCurrentLocationIdLoc(Integer itmCurrentLocationIdLoc) { this.itmCurrentLocationIdLoc = itmCurrentLocationIdLoc; }

    public Integer getItmEntityIdEnt() { return itmEntityIdEnt; }
    public void setItmEntityIdEnt(Integer itmEntityIdEnt) { this.itmEntityIdEnt = itmEntityIdEnt; }

    public String getItmBuAccessScope() { return itmBuAccessScope; }
    public void setItmBuAccessScope(String itmBuAccessScope) { this.itmBuAccessScope = itmBuAccessScope; }

    public String getItmLocationAccessScope() { return itmLocationAccessScope; }
    public void setItmLocationAccessScope(String itmLocationAccessScope) { this.itmLocationAccessScope = itmLocationAccessScope; }

    public Boolean getItmIsSerialized() { return itmIsSerialized; }
    public void setItmIsSerialized(Boolean itmIsSerialized) { this.itmIsSerialized = itmIsSerialized; }

    public Boolean getItmIsReturnable() { return itmIsReturnable; }
    public void setItmIsReturnable(Boolean itmIsReturnable) { this.itmIsReturnable = itmIsReturnable; }

    public Boolean getItmIsUnderAmc() { return itmIsUnderAmc; }
    public void setItmIsUnderAmc(Boolean itmIsUnderAmc) { this.itmIsUnderAmc = itmIsUnderAmc; }

    public Boolean getItmIsInsuranceRequired() { return itmIsInsuranceRequired; }
    public void setItmIsInsuranceRequired(Boolean itmIsInsuranceRequired) { this.itmIsInsuranceRequired = itmIsInsuranceRequired; }

    public Boolean getItmInspectionNeeded() { return itmInspectionNeeded; }
    public void setItmInspectionNeeded(Boolean itmInspectionNeeded) { this.itmInspectionNeeded = itmInspectionNeeded; }

    public String getItmConsumableType() { return itmConsumableType; }
    public void setItmConsumableType(String itmConsumableType) { this.itmConsumableType = itmConsumableType; }

    public Boolean getItmTrackBatchLot() { return itmTrackBatchLot; }
    public void setItmTrackBatchLot(Boolean itmTrackBatchLot) { this.itmTrackBatchLot = itmTrackBatchLot; }

    public Boolean getItmTrackExpiry() { return itmTrackExpiry; }
    public void setItmTrackExpiry(Boolean itmTrackExpiry) { this.itmTrackExpiry = itmTrackExpiry; }

    public Boolean getItmIsConsumable() { return itmIsConsumable; }
    public void setItmIsConsumable(Boolean itmIsConsumable) { this.itmIsConsumable = itmIsConsumable; }

    public Boolean getItmAllowNegativeStock() { return itmAllowNegativeStock; }
    public void setItmAllowNegativeStock(Boolean itmAllowNegativeStock) { this.itmAllowNegativeStock = itmAllowNegativeStock; }

    public String getItmRam() { return itmRam; }
    public void setItmRam(String itmRam) { this.itmRam = itmRam; }

    public String getItmStorage() { return itmStorage; }
    public void setItmStorage(String itmStorage) { this.itmStorage = itmStorage; }

    public String getItmProcessor() { return itmProcessor; }
    public void setItmProcessor(String itmProcessor) { this.itmProcessor = itmProcessor; }

    public String getItmProductNo() { return itmProductNo; }
    public void setItmProductNo(String itmProductNo) { this.itmProductNo = itmProductNo; }

    public Integer getItmParentItemIdItm() { return itmParentItemIdItm; }
    public void setItmParentItemIdItm(Integer itmParentItemIdItm) { this.itmParentItemIdItm = itmParentItemIdItm; }

    public Boolean getItmIsactive() { return itmIsactive; }
    public void setItmIsactive(Boolean itmIsactive) { this.itmIsactive = itmIsactive; }

    public String getItmCreatedBy() { return itmCreatedBy; }
    public void setItmCreatedBy(String itmCreatedBy) { this.itmCreatedBy = itmCreatedBy; }

    public LocalDateTime getItmCreatedOn() { return itmCreatedOn; }
    public void setItmCreatedOn(LocalDateTime itmCreatedOn) { this.itmCreatedOn = itmCreatedOn; }

    public String getItmModifiedBy() { return itmModifiedBy; }
    public void setItmModifiedBy(String itmModifiedBy) { this.itmModifiedBy = itmModifiedBy; }

    public LocalDateTime getItmModifiedOn() { return itmModifiedOn; }
    public void setItmModifiedOn(LocalDateTime itmModifiedOn) { this.itmModifiedOn = itmModifiedOn; }
}
