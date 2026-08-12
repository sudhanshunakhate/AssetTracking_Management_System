package com.caits.domain.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "txn_header_mst", schema = "caits_local")
public class TxnHeaderMst {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "txh_txn_header_id", nullable = false)
    private Integer txhTxnHeaderId;

    @Column(name = "txh_doc_type", nullable = false)
    private String txhDocType;

    @Column(name = "txh_doc_no", nullable = false)
    private String txhDocNo;

    @Column(name = "txh_doc_date", nullable = false)
    private LocalDate txhDocDate;

    @Column(name = "txh_posting_date")
    private LocalDate txhPostingDate;

    @Column(name = "txh_required_by_date")
    private LocalDate txhRequiredByDate;

    @Column(name = "txh_entity_id_ent")
    private Integer txhEntityIdEnt;

    @Column(name = "txh_location_id_loc")
    private Integer txhLocationIdLoc;

    @Column(name = "txh_from_location_id_loc")
    private Integer txhFromLocationIdLoc;

    @Column(name = "txh_to_location_id_loc")
    private Integer txhToLocationIdLoc;

    @Column(name = "txh_party_id_vnd")
    private Integer txhPartyIdVnd;

    @Column(name = "txh_party_add")
    private String txhPartyAdd;

    @Column(name = "txh_party_contact_person")
    private String txhPartyContactPerson;

    @Column(name = "txh_party_phone")
    private String txhPartyPhone;

    @Column(name = "txh_party_gstin")
    private String txhPartyGstin;

    @Column(name = "txh_ship_to")
    private String txhShipTo;

    @Column(name = "txh_department_id_dept")
    private Integer txhDepartmentIdDept;

    @Column(name = "txh_initiated_by_emp_id_emp")
    private Integer txhInitiatedByEmpIdEmp;

    @Column(name = "txh_employee_ref_code")
    private String txhEmployeeRefCode;

    @Column(name = "txh_designation")
    private String txhDesignation;

    @Column(name = "txh_doc_subtype")
    private String txhDocSubtype;

    @Column(name = "txh_return_flag")
    private String txhReturnFlag;

    @Column(name = "txh_ref_txn_header_id_txh")
    private Integer txhRefTxnHeaderIdTxh;

    @Column(name = "txh_reference_no")
    private String txhReferenceNo;

    @Column(name = "txh_invoice_no")
    private String txhInvoiceNo;

    @Column(name = "txh_invoice_date")
    private LocalDate txhInvoiceDate;

    @Column(name = "txh_po_no")
    private String txhPoNo;

    @Column(name = "txh_po_date")
    private LocalDate txhPoDate;

    @Column(name = "txh_purpose")
    private String txhPurpose;

    @Column(name = "txh_attachment_url")
    private String txhAttachmentUrl;

    @Column(name = "txh_inspected_by_emp_id_emp")
    private Integer txhInspectedByEmpIdEmp;

    @Column(name = "txh_inspection_date")
    private LocalDate txhInspectionDate;

    @Column(name = "txh_handed_over_to_emp_id_emp")
    private Integer txhHandedOverToEmpIdEmp;

    @Column(name = "txh_handover_designation")
    private String txhHandoverDesignation;

    @Column(name = "txh_handover_date")
    private LocalDate txhHandoverDate;

    @Column(name = "txh_received_by_emp_id_emp")
    private Integer txhReceivedByEmpIdEmp;

    @Column(name = "txh_received_by_name")
    private String txhReceivedByName;

    @Column(name = "txh_received_designation")
    private String txhReceivedDesignation;

    @Column(name = "txh_received_date")
    private LocalDate txhReceivedDate;

    @Column(name = "txh_condition_on_return")
    private String txhConditionOnReturn;

    @Column(name = "txh_total_ordered_qty")
    private BigDecimal txhTotalOrderedQty;

    @Column(name = "txh_total_received_qty")
    private BigDecimal txhTotalReceivedQty;

    @Column(name = "txh_total_accepted_qty")
    private BigDecimal txhTotalAcceptedQty;

    @Column(name = "txh_total_rejected_qty")
    private BigDecimal txhTotalRejectedQty;

    @Column(name = "txh_total_pending_qty")
    private BigDecimal txhTotalPendingQty;

    @Column(name = "txh_total_amount")
    private BigDecimal txhTotalAmount;

    @Column(name = "txh_prepared_by_emp_id_emp")
    private Integer txhPreparedByEmpIdEmp;

    @Column(name = "txh_prepared_date")
    private LocalDate txhPreparedDate;

    @Column(name = "txh_approved_by_emp_id_emp")
    private Integer txhApprovedByEmpIdEmp;

    @Column(name = "txh_approved_date")
    private LocalDate txhApprovedDate;

    @Column(name = "txh_footer_remark")
    private String txhFooterRemark;

    @Column(name = "txh_remarks")
    private String txhRemarks;

    @Column(name = "txh_status", nullable = false)
    private String txhStatus;

    @Column(name = "txh_created_by")
    private String txhCreatedBy;

    @Column(name = "txh_created_on", nullable = false)
    private LocalDateTime txhCreatedOn;

    @Column(name = "txh_modified_by")
    private String txhModifiedBy;

    @Column(name = "txh_modified_on")
    private LocalDateTime txhModifiedOn;

    public Integer getTxhTxnHeaderId() { return txhTxnHeaderId; }
    public void setTxhTxnHeaderId(Integer txhTxnHeaderId) { this.txhTxnHeaderId = txhTxnHeaderId; }

    public String getTxhDocType() { return txhDocType; }
    public void setTxhDocType(String txhDocType) { this.txhDocType = txhDocType; }

    public String getTxhDocNo() { return txhDocNo; }
    public void setTxhDocNo(String txhDocNo) { this.txhDocNo = txhDocNo; }

    public LocalDate getTxhDocDate() { return txhDocDate; }
    public void setTxhDocDate(LocalDate txhDocDate) { this.txhDocDate = txhDocDate; }

    public LocalDate getTxhPostingDate() { return txhPostingDate; }
    public void setTxhPostingDate(LocalDate txhPostingDate) { this.txhPostingDate = txhPostingDate; }

    public LocalDate getTxhRequiredByDate() { return txhRequiredByDate; }
    public void setTxhRequiredByDate(LocalDate txhRequiredByDate) { this.txhRequiredByDate = txhRequiredByDate; }

    public Integer getTxhEntityIdEnt() { return txhEntityIdEnt; }
    public void setTxhEntityIdEnt(Integer txhEntityIdEnt) { this.txhEntityIdEnt = txhEntityIdEnt; }

    public Integer getTxhLocationIdLoc() { return txhLocationIdLoc; }
    public void setTxhLocationIdLoc(Integer txhLocationIdLoc) { this.txhLocationIdLoc = txhLocationIdLoc; }

    public Integer getTxhFromLocationIdLoc() { return txhFromLocationIdLoc; }
    public void setTxhFromLocationIdLoc(Integer txhFromLocationIdLoc) { this.txhFromLocationIdLoc = txhFromLocationIdLoc; }

    public Integer getTxhToLocationIdLoc() { return txhToLocationIdLoc; }
    public void setTxhToLocationIdLoc(Integer txhToLocationIdLoc) { this.txhToLocationIdLoc = txhToLocationIdLoc; }

    public Integer getTxhPartyIdVnd() { return txhPartyIdVnd; }
    public void setTxhPartyIdVnd(Integer txhPartyIdVnd) { this.txhPartyIdVnd = txhPartyIdVnd; }

    public String getTxhPartyAdd() { return txhPartyAdd; }
    public void setTxhPartyAdd(String txhPartyAdd) { this.txhPartyAdd = txhPartyAdd; }

    public String getTxhPartyContactPerson() { return txhPartyContactPerson; }
    public void setTxhPartyContactPerson(String txhPartyContactPerson) { this.txhPartyContactPerson = txhPartyContactPerson; }

    public String getTxhPartyPhone() { return txhPartyPhone; }
    public void setTxhPartyPhone(String txhPartyPhone) { this.txhPartyPhone = txhPartyPhone; }

    public String getTxhPartyGstin() { return txhPartyGstin; }
    public void setTxhPartyGstin(String txhPartyGstin) { this.txhPartyGstin = txhPartyGstin; }

    public String getTxhShipTo() { return txhShipTo; }
    public void setTxhShipTo(String txhShipTo) { this.txhShipTo = txhShipTo; }

    public Integer getTxhDepartmentIdDept() { return txhDepartmentIdDept; }
    public void setTxhDepartmentIdDept(Integer txhDepartmentIdDept) { this.txhDepartmentIdDept = txhDepartmentIdDept; }

    public Integer getTxhInitiatedByEmpIdEmp() { return txhInitiatedByEmpIdEmp; }
    public void setTxhInitiatedByEmpIdEmp(Integer txhInitiatedByEmpIdEmp) { this.txhInitiatedByEmpIdEmp = txhInitiatedByEmpIdEmp; }

    public String getTxhEmployeeRefCode() { return txhEmployeeRefCode; }
    public void setTxhEmployeeRefCode(String txhEmployeeRefCode) { this.txhEmployeeRefCode = txhEmployeeRefCode; }

    public String getTxhDesignation() { return txhDesignation; }
    public void setTxhDesignation(String txhDesignation) { this.txhDesignation = txhDesignation; }

    public String getTxhDocSubtype() { return txhDocSubtype; }
    public void setTxhDocSubtype(String txhDocSubtype) { this.txhDocSubtype = txhDocSubtype; }

    public String getTxhReturnFlag() { return txhReturnFlag; }
    public void setTxhReturnFlag(String txhReturnFlag) { this.txhReturnFlag = txhReturnFlag; }

    public Integer getTxhRefTxnHeaderIdTxh() { return txhRefTxnHeaderIdTxh; }
    public void setTxhRefTxnHeaderIdTxh(Integer txhRefTxnHeaderIdTxh) { this.txhRefTxnHeaderIdTxh = txhRefTxnHeaderIdTxh; }

    public String getTxhReferenceNo() { return txhReferenceNo; }
    public void setTxhReferenceNo(String txhReferenceNo) { this.txhReferenceNo = txhReferenceNo; }

    public String getTxhInvoiceNo() { return txhInvoiceNo; }
    public void setTxhInvoiceNo(String txhInvoiceNo) { this.txhInvoiceNo = txhInvoiceNo; }

    public LocalDate getTxhInvoiceDate() { return txhInvoiceDate; }
    public void setTxhInvoiceDate(LocalDate txhInvoiceDate) { this.txhInvoiceDate = txhInvoiceDate; }

    public String getTxhPoNo() { return txhPoNo; }
    public void setTxhPoNo(String txhPoNo) { this.txhPoNo = txhPoNo; }

    public LocalDate getTxhPoDate() { return txhPoDate; }
    public void setTxhPoDate(LocalDate txhPoDate) { this.txhPoDate = txhPoDate; }

    public String getTxhPurpose() { return txhPurpose; }
    public void setTxhPurpose(String txhPurpose) { this.txhPurpose = txhPurpose; }

    public String getTxhAttachmentUrl() { return txhAttachmentUrl; }
    public void setTxhAttachmentUrl(String txhAttachmentUrl) { this.txhAttachmentUrl = txhAttachmentUrl; }

    public Integer getTxhInspectedByEmpIdEmp() { return txhInspectedByEmpIdEmp; }
    public void setTxhInspectedByEmpIdEmp(Integer txhInspectedByEmpIdEmp) { this.txhInspectedByEmpIdEmp = txhInspectedByEmpIdEmp; }

    public LocalDate getTxhInspectionDate() { return txhInspectionDate; }
    public void setTxhInspectionDate(LocalDate txhInspectionDate) { this.txhInspectionDate = txhInspectionDate; }

    public Integer getTxhHandedOverToEmpIdEmp() { return txhHandedOverToEmpIdEmp; }
    public void setTxhHandedOverToEmpIdEmp(Integer txhHandedOverToEmpIdEmp) { this.txhHandedOverToEmpIdEmp = txhHandedOverToEmpIdEmp; }

    public String getTxhHandoverDesignation() { return txhHandoverDesignation; }
    public void setTxhHandoverDesignation(String txhHandoverDesignation) { this.txhHandoverDesignation = txhHandoverDesignation; }

    public LocalDate getTxhHandoverDate() { return txhHandoverDate; }
    public void setTxhHandoverDate(LocalDate txhHandoverDate) { this.txhHandoverDate = txhHandoverDate; }

    public Integer getTxhReceivedByEmpIdEmp() { return txhReceivedByEmpIdEmp; }
    public void setTxhReceivedByEmpIdEmp(Integer txhReceivedByEmpIdEmp) { this.txhReceivedByEmpIdEmp = txhReceivedByEmpIdEmp; }

    public String getTxhReceivedByName() { return txhReceivedByName; }
    public void setTxhReceivedByName(String txhReceivedByName) { this.txhReceivedByName = txhReceivedByName; }

    public String getTxhReceivedDesignation() { return txhReceivedDesignation; }
    public void setTxhReceivedDesignation(String txhReceivedDesignation) { this.txhReceivedDesignation = txhReceivedDesignation; }

    public LocalDate getTxhReceivedDate() { return txhReceivedDate; }
    public void setTxhReceivedDate(LocalDate txhReceivedDate) { this.txhReceivedDate = txhReceivedDate; }

    public String getTxhConditionOnReturn() { return txhConditionOnReturn; }
    public void setTxhConditionOnReturn(String txhConditionOnReturn) { this.txhConditionOnReturn = txhConditionOnReturn; }

    public BigDecimal getTxhTotalOrderedQty() { return txhTotalOrderedQty; }
    public void setTxhTotalOrderedQty(BigDecimal txhTotalOrderedQty) { this.txhTotalOrderedQty = txhTotalOrderedQty; }

    public BigDecimal getTxhTotalReceivedQty() { return txhTotalReceivedQty; }
    public void setTxhTotalReceivedQty(BigDecimal txhTotalReceivedQty) { this.txhTotalReceivedQty = txhTotalReceivedQty; }

    public BigDecimal getTxhTotalAcceptedQty() { return txhTotalAcceptedQty; }
    public void setTxhTotalAcceptedQty(BigDecimal txhTotalAcceptedQty) { this.txhTotalAcceptedQty = txhTotalAcceptedQty; }

    public BigDecimal getTxhTotalRejectedQty() { return txhTotalRejectedQty; }
    public void setTxhTotalRejectedQty(BigDecimal txhTotalRejectedQty) { this.txhTotalRejectedQty = txhTotalRejectedQty; }

    public BigDecimal getTxhTotalPendingQty() { return txhTotalPendingQty; }
    public void setTxhTotalPendingQty(BigDecimal txhTotalPendingQty) { this.txhTotalPendingQty = txhTotalPendingQty; }

    public BigDecimal getTxhTotalAmount() { return txhTotalAmount; }
    public void setTxhTotalAmount(BigDecimal txhTotalAmount) { this.txhTotalAmount = txhTotalAmount; }

    public Integer getTxhPreparedByEmpIdEmp() { return txhPreparedByEmpIdEmp; }
    public void setTxhPreparedByEmpIdEmp(Integer txhPreparedByEmpIdEmp) { this.txhPreparedByEmpIdEmp = txhPreparedByEmpIdEmp; }

    public LocalDate getTxhPreparedDate() { return txhPreparedDate; }
    public void setTxhPreparedDate(LocalDate txhPreparedDate) { this.txhPreparedDate = txhPreparedDate; }

    public Integer getTxhApprovedByEmpIdEmp() { return txhApprovedByEmpIdEmp; }
    public void setTxhApprovedByEmpIdEmp(Integer txhApprovedByEmpIdEmp) { this.txhApprovedByEmpIdEmp = txhApprovedByEmpIdEmp; }

    public LocalDate getTxhApprovedDate() { return txhApprovedDate; }
    public void setTxhApprovedDate(LocalDate txhApprovedDate) { this.txhApprovedDate = txhApprovedDate; }

    public String getTxhFooterRemark() { return txhFooterRemark; }
    public void setTxhFooterRemark(String txhFooterRemark) { this.txhFooterRemark = txhFooterRemark; }

    public String getTxhRemarks() { return txhRemarks; }
    public void setTxhRemarks(String txhRemarks) { this.txhRemarks = txhRemarks; }

    public String getTxhStatus() { return txhStatus; }
    public void setTxhStatus(String txhStatus) { this.txhStatus = txhStatus; }

    public String getTxhCreatedBy() { return txhCreatedBy; }
    public void setTxhCreatedBy(String txhCreatedBy) { this.txhCreatedBy = txhCreatedBy; }

    public LocalDateTime getTxhCreatedOn() { return txhCreatedOn; }
    public void setTxhCreatedOn(LocalDateTime txhCreatedOn) { this.txhCreatedOn = txhCreatedOn; }

    public String getTxhModifiedBy() { return txhModifiedBy; }
    public void setTxhModifiedBy(String txhModifiedBy) { this.txhModifiedBy = txhModifiedBy; }

    public LocalDateTime getTxhModifiedOn() { return txhModifiedOn; }
    public void setTxhModifiedOn(LocalDateTime txhModifiedOn) { this.txhModifiedOn = txhModifiedOn; }

}
