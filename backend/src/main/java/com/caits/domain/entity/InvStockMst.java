package com.caits.domain.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "inv_stock_mst", schema = "caits_local")
public class InvStockMst {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "stk_stock_id", nullable = false)
    private Integer stkStockId;

    @Column(name = "stk_item_id_itm", nullable = false)
    private Integer stkItemIdItm;

    @Column(name = "stk_location_id_loc", nullable = false)
    private Integer stkLocationIdLoc;

    @Column(name = "stk_location_bin")
    private String stkLocationBin;

    @Column(name = "stk_batch_lot_no")
    private String stkBatchLotNo;

    @Column(name = "stk_uom_id_unt", nullable = false)
    private Integer stkUomIdUnt;

    @Column(name = "stk_opening_qty")
    private BigDecimal stkOpeningQty;

    @Column(name = "stk_inward_qty")
    private BigDecimal stkInwardQty;

    @Column(name = "stk_issued_qty")
    private BigDecimal stkIssuedQty;

    @Column(name = "stk_transferred_in_qty")
    private BigDecimal stkTransferredInQty;

    @Column(name = "stk_transferred_out_qty")
    private BigDecimal stkTransferredOutQty;

    @Column(name = "stk_returned_qty")
    private BigDecimal stkReturnedQty;

    @Column(name = "stk_adjusted_qty")
    private BigDecimal stkAdjustedQty;

    @Column(name = "stk_current_qty", nullable = false)
    private BigDecimal stkCurrentQty;

    @Column(name = "stk_reserved_qty")
    private BigDecimal stkReservedQty;

    @Column(name = "stk_available_qty")
    private BigDecimal stkAvailableQty;

    @Column(name = "stk_reorder_level")
    private BigDecimal stkReorderLevel;

    @Column(name = "stk_min_stock_level")
    private BigDecimal stkMinStockLevel;

    @Column(name = "stk_max_stock_level")
    private BigDecimal stkMaxStockLevel;

    @Column(name = "stk_avg_rate")
    private BigDecimal stkAvgRate;

    @Column(name = "stk_stock_value")
    private BigDecimal stkStockValue;

    @Column(name = "stk_expiry_date")
    private LocalDate stkExpiryDate;

    @Column(name = "stk_last_txn_header_id_txh")
    private Integer stkLastTxnHeaderIdTxh;

    @Column(name = "stk_last_transaction_date")
    private LocalDate stkLastTransactionDate;

    @Column(name = "stk_isactive", nullable = false)
    private Boolean stkIsactive;

    @Column(name = "stk_created_by")
    private String stkCreatedBy;

    @Column(name = "stk_created_on", nullable = false)
    private LocalDateTime stkCreatedOn;

    @Column(name = "stk_modified_by")
    private String stkModifiedBy;

    @Column(name = "stk_modified_on")
    private LocalDateTime stkModifiedOn;

    public Integer getStkStockId() { return stkStockId; }
    public void setStkStockId(Integer stkStockId) { this.stkStockId = stkStockId; }

    public Integer getStkItemIdItm() { return stkItemIdItm; }
    public void setStkItemIdItm(Integer stkItemIdItm) { this.stkItemIdItm = stkItemIdItm; }

    public Integer getStkLocationIdLoc() { return stkLocationIdLoc; }
    public void setStkLocationIdLoc(Integer stkLocationIdLoc) { this.stkLocationIdLoc = stkLocationIdLoc; }

    public String getStkLocationBin() { return stkLocationBin; }
    public void setStkLocationBin(String stkLocationBin) { this.stkLocationBin = stkLocationBin; }

    public String getStkBatchLotNo() { return stkBatchLotNo; }
    public void setStkBatchLotNo(String stkBatchLotNo) { this.stkBatchLotNo = stkBatchLotNo; }

    public Integer getStkUomIdUnt() { return stkUomIdUnt; }
    public void setStkUomIdUnt(Integer stkUomIdUnt) { this.stkUomIdUnt = stkUomIdUnt; }

    public BigDecimal getStkOpeningQty() { return stkOpeningQty; }
    public void setStkOpeningQty(BigDecimal stkOpeningQty) { this.stkOpeningQty = stkOpeningQty; }

    public BigDecimal getStkInwardQty() { return stkInwardQty; }
    public void setStkInwardQty(BigDecimal stkInwardQty) { this.stkInwardQty = stkInwardQty; }

    public BigDecimal getStkIssuedQty() { return stkIssuedQty; }
    public void setStkIssuedQty(BigDecimal stkIssuedQty) { this.stkIssuedQty = stkIssuedQty; }

    public BigDecimal getStkTransferredInQty() { return stkTransferredInQty; }
    public void setStkTransferredInQty(BigDecimal stkTransferredInQty) { this.stkTransferredInQty = stkTransferredInQty; }

    public BigDecimal getStkTransferredOutQty() { return stkTransferredOutQty; }
    public void setStkTransferredOutQty(BigDecimal stkTransferredOutQty) { this.stkTransferredOutQty = stkTransferredOutQty; }

    public BigDecimal getStkReturnedQty() { return stkReturnedQty; }
    public void setStkReturnedQty(BigDecimal stkReturnedQty) { this.stkReturnedQty = stkReturnedQty; }

    public BigDecimal getStkAdjustedQty() { return stkAdjustedQty; }
    public void setStkAdjustedQty(BigDecimal stkAdjustedQty) { this.stkAdjustedQty = stkAdjustedQty; }

    public BigDecimal getStkCurrentQty() { return stkCurrentQty; }
    public void setStkCurrentQty(BigDecimal stkCurrentQty) { this.stkCurrentQty = stkCurrentQty; }

    public BigDecimal getStkReservedQty() { return stkReservedQty; }
    public void setStkReservedQty(BigDecimal stkReservedQty) { this.stkReservedQty = stkReservedQty; }

    public BigDecimal getStkAvailableQty() { return stkAvailableQty; }
    public void setStkAvailableQty(BigDecimal stkAvailableQty) { this.stkAvailableQty = stkAvailableQty; }

    public BigDecimal getStkReorderLevel() { return stkReorderLevel; }
    public void setStkReorderLevel(BigDecimal stkReorderLevel) { this.stkReorderLevel = stkReorderLevel; }

    public BigDecimal getStkMinStockLevel() { return stkMinStockLevel; }
    public void setStkMinStockLevel(BigDecimal stkMinStockLevel) { this.stkMinStockLevel = stkMinStockLevel; }

    public BigDecimal getStkMaxStockLevel() { return stkMaxStockLevel; }
    public void setStkMaxStockLevel(BigDecimal stkMaxStockLevel) { this.stkMaxStockLevel = stkMaxStockLevel; }

    public BigDecimal getStkAvgRate() { return stkAvgRate; }
    public void setStkAvgRate(BigDecimal stkAvgRate) { this.stkAvgRate = stkAvgRate; }

    public BigDecimal getStkStockValue() { return stkStockValue; }
    public void setStkStockValue(BigDecimal stkStockValue) { this.stkStockValue = stkStockValue; }

    public LocalDate getStkExpiryDate() { return stkExpiryDate; }
    public void setStkExpiryDate(LocalDate stkExpiryDate) { this.stkExpiryDate = stkExpiryDate; }

    public Integer getStkLastTxnHeaderIdTxh() { return stkLastTxnHeaderIdTxh; }
    public void setStkLastTxnHeaderIdTxh(Integer stkLastTxnHeaderIdTxh) { this.stkLastTxnHeaderIdTxh = stkLastTxnHeaderIdTxh; }

    public LocalDate getStkLastTransactionDate() { return stkLastTransactionDate; }
    public void setStkLastTransactionDate(LocalDate stkLastTransactionDate) { this.stkLastTransactionDate = stkLastTransactionDate; }

    public Boolean getStkIsactive() { return stkIsactive; }
    public void setStkIsactive(Boolean stkIsactive) { this.stkIsactive = stkIsactive; }

    public String getStkCreatedBy() { return stkCreatedBy; }
    public void setStkCreatedBy(String stkCreatedBy) { this.stkCreatedBy = stkCreatedBy; }

    public LocalDateTime getStkCreatedOn() { return stkCreatedOn; }
    public void setStkCreatedOn(LocalDateTime stkCreatedOn) { this.stkCreatedOn = stkCreatedOn; }

    public String getStkModifiedBy() { return stkModifiedBy; }
    public void setStkModifiedBy(String stkModifiedBy) { this.stkModifiedBy = stkModifiedBy; }

    public LocalDateTime getStkModifiedOn() { return stkModifiedOn; }
    public void setStkModifiedOn(LocalDateTime stkModifiedOn) { this.stkModifiedOn = stkModifiedOn; }

}
