package com.caits.domain.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "inv_item_mst", schema = "caits_local")
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

    @Column(name = "itm_serial_no")
    private String itmSerialNo;

    @Column(name = "itm_purchase_date")
    private LocalDate itmPurchaseDate;

    @Column(name = "itm_purchase_cost")
    private BigDecimal itmPurchaseCost;

    @Column(name = "itm_useful_life_years")
    private BigDecimal itmUsefulLifeYears;

    @Column(name = "itm_warranty_expiry")
    private LocalDate itmWarrantyExpiry;

    @Column(name = "itm_depreciation_method")
    private String itmDepreciationMethod;

    @Column(name = "itm_depreciation_rate")
    private BigDecimal itmDepreciationRate;

    @Column(name = "itm_assigned_to_emp_id_emp")
    private Integer itmAssignedToEmpIdEmp;

    @Column(name = "itm_current_location_id_loc")
    private Integer itmCurrentLocationIdLoc;

    @Column(name = "itm_is_serialized")
    private Boolean itmIsSerialized;

    @Column(name = "itm_is_returnable")
    private Boolean itmIsReturnable;

    @Column(name = "itm_is_under_amc")
    private Boolean itmIsUnderAmc;

    @Column(name = "itm_is_insurance_required")
    private Boolean itmIsInsuranceRequired;

    @Column(name = "itm_consumable_type")
    private String itmConsumableType;

    @Column(name = "itm_shelf_bin")
    private String itmShelfBin;

    @Column(name = "itm_expiry_date")
    private LocalDate itmExpiryDate;

    @Column(name = "itm_batch_lot_no")
    private String itmBatchLotNo;

    @Column(name = "itm_track_batch_lot")
    private Boolean itmTrackBatchLot;

    @Column(name = "itm_track_expiry")
    private Boolean itmTrackExpiry;

    @Column(name = "itm_is_consumable")
    private Boolean itmIsConsumable;

    @Column(name = "itm_allow_negative_stock")
    private Boolean itmAllowNegativeStock;

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

    public String getItmSerialNo() { return itmSerialNo; }
    public void setItmSerialNo(String itmSerialNo) { this.itmSerialNo = itmSerialNo; }

    public LocalDate getItmPurchaseDate() { return itmPurchaseDate; }
    public void setItmPurchaseDate(LocalDate itmPurchaseDate) { this.itmPurchaseDate = itmPurchaseDate; }

    public BigDecimal getItmPurchaseCost() { return itmPurchaseCost; }
    public void setItmPurchaseCost(BigDecimal itmPurchaseCost) { this.itmPurchaseCost = itmPurchaseCost; }

    public BigDecimal getItmUsefulLifeYears() { return itmUsefulLifeYears; }
    public void setItmUsefulLifeYears(BigDecimal itmUsefulLifeYears) { this.itmUsefulLifeYears = itmUsefulLifeYears; }

    public LocalDate getItmWarrantyExpiry() { return itmWarrantyExpiry; }
    public void setItmWarrantyExpiry(LocalDate itmWarrantyExpiry) { this.itmWarrantyExpiry = itmWarrantyExpiry; }

    public String getItmDepreciationMethod() { return itmDepreciationMethod; }
    public void setItmDepreciationMethod(String itmDepreciationMethod) { this.itmDepreciationMethod = itmDepreciationMethod; }

    public BigDecimal getItmDepreciationRate() { return itmDepreciationRate; }
    public void setItmDepreciationRate(BigDecimal itmDepreciationRate) { this.itmDepreciationRate = itmDepreciationRate; }

    public Integer getItmAssignedToEmpIdEmp() { return itmAssignedToEmpIdEmp; }
    public void setItmAssignedToEmpIdEmp(Integer itmAssignedToEmpIdEmp) { this.itmAssignedToEmpIdEmp = itmAssignedToEmpIdEmp; }

    public Integer getItmCurrentLocationIdLoc() { return itmCurrentLocationIdLoc; }
    public void setItmCurrentLocationIdLoc(Integer itmCurrentLocationIdLoc) { this.itmCurrentLocationIdLoc = itmCurrentLocationIdLoc; }

    public Boolean getItmIsSerialized() { return itmIsSerialized; }
    public void setItmIsSerialized(Boolean itmIsSerialized) { this.itmIsSerialized = itmIsSerialized; }

    public Boolean getItmIsReturnable() { return itmIsReturnable; }
    public void setItmIsReturnable(Boolean itmIsReturnable) { this.itmIsReturnable = itmIsReturnable; }

    public Boolean getItmIsUnderAmc() { return itmIsUnderAmc; }
    public void setItmIsUnderAmc(Boolean itmIsUnderAmc) { this.itmIsUnderAmc = itmIsUnderAmc; }

    public Boolean getItmIsInsuranceRequired() { return itmIsInsuranceRequired; }
    public void setItmIsInsuranceRequired(Boolean itmIsInsuranceRequired) { this.itmIsInsuranceRequired = itmIsInsuranceRequired; }

    public String getItmConsumableType() { return itmConsumableType; }
    public void setItmConsumableType(String itmConsumableType) { this.itmConsumableType = itmConsumableType; }

    public String getItmShelfBin() { return itmShelfBin; }
    public void setItmShelfBin(String itmShelfBin) { this.itmShelfBin = itmShelfBin; }

    public LocalDate getItmExpiryDate() { return itmExpiryDate; }
    public void setItmExpiryDate(LocalDate itmExpiryDate) { this.itmExpiryDate = itmExpiryDate; }

    public String getItmBatchLotNo() { return itmBatchLotNo; }
    public void setItmBatchLotNo(String itmBatchLotNo) { this.itmBatchLotNo = itmBatchLotNo; }

    public Boolean getItmTrackBatchLot() { return itmTrackBatchLot; }
    public void setItmTrackBatchLot(Boolean itmTrackBatchLot) { this.itmTrackBatchLot = itmTrackBatchLot; }

    public Boolean getItmTrackExpiry() { return itmTrackExpiry; }
    public void setItmTrackExpiry(Boolean itmTrackExpiry) { this.itmTrackExpiry = itmTrackExpiry; }

    public Boolean getItmIsConsumable() { return itmIsConsumable; }
    public void setItmIsConsumable(Boolean itmIsConsumable) { this.itmIsConsumable = itmIsConsumable; }

    public Boolean getItmAllowNegativeStock() { return itmAllowNegativeStock; }
    public void setItmAllowNegativeStock(Boolean itmAllowNegativeStock) { this.itmAllowNegativeStock = itmAllowNegativeStock; }

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
