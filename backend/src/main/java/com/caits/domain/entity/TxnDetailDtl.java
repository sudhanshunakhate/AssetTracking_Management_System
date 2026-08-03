package com.caits.domain.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "txn_detail_dtl", schema = "caits_local")
public class TxnDetailDtl {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "txd_txn_detail_id", nullable = false)
    private Integer txdTxnDetailId;

    @Column(name = "txd_txn_header_id_txh", nullable = false)
    private Integer txdTxnHeaderIdTxh;

    @Column(name = "txd_doc_type", nullable = false)
    private String txdDocType;

    @Column(name = "txd_sr_no", nullable = false)
    private Integer txdSrNo;

    @Column(name = "txd_item_id_itm", nullable = false)
    private Integer txdItemIdItm;

    @Column(name = "txd_uom_id_unt")
    private Integer txdUomIdUnt;

    @Column(name = "txd_unit")
    private String txdUnit;

    @Column(name = "txd_ordered_qty")
    private BigDecimal txdOrderedQty;

    @Column(name = "txd_received_qty")
    private BigDecimal txdReceivedQty;

    @Column(name = "txd_accepted_qty")
    private BigDecimal txdAcceptedQty;

    @Column(name = "txd_rejected_qty")
    private BigDecimal txdRejectedQty;

    @Column(name = "txd_requested_qty")
    private BigDecimal txdRequestedQty;

    @Column(name = "txd_qty")
    private BigDecimal txdQty;

    @Column(name = "txd_available_stock")
    private BigDecimal txdAvailableStock;

    @Column(name = "txd_amount")
    private BigDecimal txdAmount;

    @Column(name = "txd_rate")
    private BigDecimal txdRate;

    @Column(name = "txd_mrp")
    private BigDecimal txdMrp;

    @Column(name = "txd_batch_lot_no")
    private String txdBatchLotNo;

    @Column(name = "txd_mfg_date")
    private LocalDate txdMfgDate;

    @Column(name = "txd_expiry_date")
    private LocalDate txdExpiryDate;

    @Column(name = "txd_location_id_loc")
    private Integer txdLocationIdLoc;

    @Column(name = "txd_location_bin")
    private String txdLocationBin;

    @Column(name = "txd_item_condition")
    private String txdItemCondition;

    @Column(name = "txd_serial_no")
    private String txdSerialNo;

    @Column(name = "txd_ip_address")
    private String txdIpAddress;

    @Column(name = "txd_mac_address")
    private String txdMacAddress;

    @Column(name = "txd_hostname")
    private String txdHostname;

    @Column(name = "txd_bls_id_ibm")
    private Integer txdBlsIdIbm;

    @Column(name = "txd_remark")
    private String txdRemark;

    public Integer getTxdTxnDetailId() { return txdTxnDetailId; }
    public void setTxdTxnDetailId(Integer txdTxnDetailId) { this.txdTxnDetailId = txdTxnDetailId; }

    public Integer getTxdTxnHeaderIdTxh() { return txdTxnHeaderIdTxh; }
    public void setTxdTxnHeaderIdTxh(Integer txdTxnHeaderIdTxh) { this.txdTxnHeaderIdTxh = txdTxnHeaderIdTxh; }

    public String getTxdDocType() { return txdDocType; }
    public void setTxdDocType(String txdDocType) { this.txdDocType = txdDocType; }

    public Integer getTxdSrNo() { return txdSrNo; }
    public void setTxdSrNo(Integer txdSrNo) { this.txdSrNo = txdSrNo; }

    public Integer getTxdItemIdItm() { return txdItemIdItm; }
    public void setTxdItemIdItm(Integer txdItemIdItm) { this.txdItemIdItm = txdItemIdItm; }

    public Integer getTxdUomIdUnt() { return txdUomIdUnt; }
    public void setTxdUomIdUnt(Integer txdUomIdUnt) { this.txdUomIdUnt = txdUomIdUnt; }

    public String getTxdUnit() { return txdUnit; }
    public void setTxdUnit(String txdUnit) { this.txdUnit = txdUnit; }

    public BigDecimal getTxdOrderedQty() { return txdOrderedQty; }
    public void setTxdOrderedQty(BigDecimal txdOrderedQty) { this.txdOrderedQty = txdOrderedQty; }

    public BigDecimal getTxdReceivedQty() { return txdReceivedQty; }
    public void setTxdReceivedQty(BigDecimal txdReceivedQty) { this.txdReceivedQty = txdReceivedQty; }

    public BigDecimal getTxdAcceptedQty() { return txdAcceptedQty; }
    public void setTxdAcceptedQty(BigDecimal txdAcceptedQty) { this.txdAcceptedQty = txdAcceptedQty; }

    public BigDecimal getTxdRejectedQty() { return txdRejectedQty; }
    public void setTxdRejectedQty(BigDecimal txdRejectedQty) { this.txdRejectedQty = txdRejectedQty; }

    public BigDecimal getTxdRequestedQty() { return txdRequestedQty; }
    public void setTxdRequestedQty(BigDecimal txdRequestedQty) { this.txdRequestedQty = txdRequestedQty; }

    public BigDecimal getTxdQty() { return txdQty; }
    public void setTxdQty(BigDecimal txdQty) { this.txdQty = txdQty; }

    public BigDecimal getTxdAvailableStock() { return txdAvailableStock; }
    public void setTxdAvailableStock(BigDecimal txdAvailableStock) { this.txdAvailableStock = txdAvailableStock; }

    public BigDecimal getTxdAmount() { return txdAmount; }
    public void setTxdAmount(BigDecimal txdAmount) { this.txdAmount = txdAmount; }

    public BigDecimal getTxdRate() { return txdRate; }
    public void setTxdRate(BigDecimal txdRate) { this.txdRate = txdRate; }

    public BigDecimal getTxdMrp() { return txdMrp; }
    public void setTxdMrp(BigDecimal txdMrp) { this.txdMrp = txdMrp; }

    public String getTxdBatchLotNo() { return txdBatchLotNo; }
    public void setTxdBatchLotNo(String txdBatchLotNo) { this.txdBatchLotNo = txdBatchLotNo; }

    public LocalDate getTxdMfgDate() { return txdMfgDate; }
    public void setTxdMfgDate(LocalDate txdMfgDate) { this.txdMfgDate = txdMfgDate; }

    public LocalDate getTxdExpiryDate() { return txdExpiryDate; }
    public void setTxdExpiryDate(LocalDate txdExpiryDate) { this.txdExpiryDate = txdExpiryDate; }

    public Integer getTxdLocationIdLoc() { return txdLocationIdLoc; }
    public void setTxdLocationIdLoc(Integer txdLocationIdLoc) { this.txdLocationIdLoc = txdLocationIdLoc; }

    public String getTxdLocationBin() { return txdLocationBin; }
    public void setTxdLocationBin(String txdLocationBin) { this.txdLocationBin = txdLocationBin; }

    public String getTxdItemCondition() { return txdItemCondition; }
    public void setTxdItemCondition(String txdItemCondition) { this.txdItemCondition = txdItemCondition; }

    public String getTxdSerialNo() { return txdSerialNo; }
    public void setTxdSerialNo(String txdSerialNo) { this.txdSerialNo = txdSerialNo; }

    public String getTxdIpAddress() { return txdIpAddress; }
    public void setTxdIpAddress(String txdIpAddress) { this.txdIpAddress = txdIpAddress; }

    public String getTxdMacAddress() { return txdMacAddress; }
    public void setTxdMacAddress(String txdMacAddress) { this.txdMacAddress = txdMacAddress; }

    public String getTxdHostname() { return txdHostname; }
    public void setTxdHostname(String txdHostname) { this.txdHostname = txdHostname; }

    public Integer getTxdBlsIdIbm() { return txdBlsIdIbm; }
    public void setTxdBlsIdIbm(Integer txdBlsIdIbm) { this.txdBlsIdIbm = txdBlsIdIbm; }

    public String getTxdRemark() { return txdRemark; }
    public void setTxdRemark(String txdRemark) { this.txdRemark = txdRemark; }

}
