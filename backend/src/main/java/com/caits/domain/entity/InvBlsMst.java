package com.caits.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Batch / Lot / Serial register. Catalog items live in inv_item_mst;
 * each physical unit or tracked batch is a row here. Non-tracked items
 * share one dummy BLS (ibm_is_dummy = true) per item.
 */
@Entity
@Table(name = "inv_bls_mst", schema = "caits_local")
public class InvBlsMst {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ibm_bls_id", nullable = false)
    private Integer ibmBlsId;

    @Column(name = "ibm_entity_id_ent")
    private Integer ibmEntityIdEnt;

    @Column(name = "ibm_item_id_itm", nullable = false)
    private Integer ibmItemIdItm;

    @Column(name = "ibm_batch_no")
    private String ibmBatchNo;

    @Column(name = "ibm_lot_no")
    private String ibmLotNo;

    @Column(name = "ibm_serial_no")
    private String ibmSerialNo;

    @Column(name = "ibm_mfg_date")
    private LocalDate ibmMfgDate;

    @Column(name = "ibm_expiry_date")
    private LocalDate ibmExpiryDate;

    @Column(name = "ibm_best_before_date")
    private LocalDate ibmBestBeforeDate;

    @Column(name = "ibm_ip_address")
    private String ibmIpAddress;

    @Column(name = "ibm_mac_address")
    private String ibmMacAddress;

    @Column(name = "ibm_hostname")
    private String ibmHostname;

    @Column(name = "ibm_item_condition")
    private String ibmItemCondition;

    @Column(name = "ibm_issued_to_emp_id_emp")
    private Integer ibmIssuedToEmpIdEmp;

    @Column(name = "ibm_current_location_id_loc")
    private Integer ibmCurrentLocationIdLoc;

    @Column(name = "ibm_is_dummy", nullable = false)
    private Boolean ibmIsDummy = false;

    @Column(name = "ibm_isactive", nullable = false)
    private Boolean ibmIsactive = true;

    @Column(name = "ibm_islocked", nullable = false)
    private Boolean ibmIslocked = false;

    @Column(name = "ibm_locked_reason")
    private String ibmLockedReason;

    @Column(name = "ibm_locked_on")
    private LocalDateTime ibmLockedOn;

    @Column(name = "ibm_created_by")
    private String ibmCreatedBy;

    @Column(name = "ibm_created_on", nullable = false)
    private LocalDateTime ibmCreatedOn;

    @Column(name = "ibm_modified_by")
    private String ibmModifiedBy;

    @Column(name = "ibm_modified_on")
    private LocalDateTime ibmModifiedOn;

    public Integer getIbmBlsId() { return ibmBlsId; }
    public void setIbmBlsId(Integer ibmBlsId) { this.ibmBlsId = ibmBlsId; }

    public Integer getIbmEntityIdEnt() { return ibmEntityIdEnt; }
    public void setIbmEntityIdEnt(Integer ibmEntityIdEnt) { this.ibmEntityIdEnt = ibmEntityIdEnt; }

    public Integer getIbmItemIdItm() { return ibmItemIdItm; }
    public void setIbmItemIdItm(Integer ibmItemIdItm) { this.ibmItemIdItm = ibmItemIdItm; }

    public String getIbmBatchNo() { return ibmBatchNo; }
    public void setIbmBatchNo(String ibmBatchNo) { this.ibmBatchNo = ibmBatchNo; }

    public String getIbmLotNo() { return ibmLotNo; }
    public void setIbmLotNo(String ibmLotNo) { this.ibmLotNo = ibmLotNo; }

    public String getIbmSerialNo() { return ibmSerialNo; }
    public void setIbmSerialNo(String ibmSerialNo) { this.ibmSerialNo = ibmSerialNo; }

    public LocalDate getIbmMfgDate() { return ibmMfgDate; }
    public void setIbmMfgDate(LocalDate ibmMfgDate) { this.ibmMfgDate = ibmMfgDate; }

    public LocalDate getIbmExpiryDate() { return ibmExpiryDate; }
    public void setIbmExpiryDate(LocalDate ibmExpiryDate) { this.ibmExpiryDate = ibmExpiryDate; }

    public LocalDate getIbmBestBeforeDate() { return ibmBestBeforeDate; }
    public void setIbmBestBeforeDate(LocalDate ibmBestBeforeDate) { this.ibmBestBeforeDate = ibmBestBeforeDate; }

    public String getIbmIpAddress() { return ibmIpAddress; }
    public void setIbmIpAddress(String ibmIpAddress) { this.ibmIpAddress = ibmIpAddress; }

    public String getIbmMacAddress() { return ibmMacAddress; }
    public void setIbmMacAddress(String ibmMacAddress) { this.ibmMacAddress = ibmMacAddress; }

    public String getIbmHostname() { return ibmHostname; }
    public void setIbmHostname(String ibmHostname) { this.ibmHostname = ibmHostname; }

    public String getIbmItemCondition() { return ibmItemCondition; }
    public void setIbmItemCondition(String ibmItemCondition) { this.ibmItemCondition = ibmItemCondition; }

    public Integer getIbmIssuedToEmpIdEmp() { return ibmIssuedToEmpIdEmp; }
    public void setIbmIssuedToEmpIdEmp(Integer ibmIssuedToEmpIdEmp) { this.ibmIssuedToEmpIdEmp = ibmIssuedToEmpIdEmp; }

    public Integer getIbmCurrentLocationIdLoc() { return ibmCurrentLocationIdLoc; }
    public void setIbmCurrentLocationIdLoc(Integer ibmCurrentLocationIdLoc) { this.ibmCurrentLocationIdLoc = ibmCurrentLocationIdLoc; }

    public Boolean getIbmIsDummy() { return ibmIsDummy; }
    public void setIbmIsDummy(Boolean ibmIsDummy) { this.ibmIsDummy = ibmIsDummy; }

    public Boolean getIbmIsactive() { return ibmIsactive; }
    public void setIbmIsactive(Boolean ibmIsactive) { this.ibmIsactive = ibmIsactive; }

    public Boolean getIbmIslocked() { return ibmIslocked; }
    public void setIbmIslocked(Boolean ibmIslocked) { this.ibmIslocked = ibmIslocked; }

    public String getIbmLockedReason() { return ibmLockedReason; }
    public void setIbmLockedReason(String ibmLockedReason) { this.ibmLockedReason = ibmLockedReason; }

    public LocalDateTime getIbmLockedOn() { return ibmLockedOn; }
    public void setIbmLockedOn(LocalDateTime ibmLockedOn) { this.ibmLockedOn = ibmLockedOn; }

    public String getIbmCreatedBy() { return ibmCreatedBy; }
    public void setIbmCreatedBy(String ibmCreatedBy) { this.ibmCreatedBy = ibmCreatedBy; }

    public LocalDateTime getIbmCreatedOn() { return ibmCreatedOn; }
    public void setIbmCreatedOn(LocalDateTime ibmCreatedOn) { this.ibmCreatedOn = ibmCreatedOn; }

    public String getIbmModifiedBy() { return ibmModifiedBy; }
    public void setIbmModifiedBy(String ibmModifiedBy) { this.ibmModifiedBy = ibmModifiedBy; }

    public LocalDateTime getIbmModifiedOn() { return ibmModifiedOn; }
    public void setIbmModifiedOn(LocalDateTime ibmModifiedOn) { this.ibmModifiedOn = ibmModifiedOn; }
}
