package com.caits.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "sysm_useraccess_exception_dtl")
public class SysmUseraccessExceptionDtl {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "uexc_exception_id", nullable = false)
    private Integer uexcExceptionId;

    @Column(name = "uexc_employee_id_emp", nullable = false)
    private Integer uexcEmployeeIdEmp;

    @Column(name = "uexc_exception_type", nullable = false)
    private String uexcExceptionType;

    @Column(name = "uexc_menu_code_mtree", nullable = false)
    private String uexcMenuCodeMtree;

    @Column(name = "uexc_reason", nullable = false)
    private String uexcReason;

    @Column(name = "uexc_valid_from")
    private LocalDate uexcValidFrom;

    @Column(name = "uexc_valid_until")
    private LocalDate uexcValidUntil;

    @Column(name = "uexc_isactive", nullable = false)
    private Boolean uexcIsactive;

    @Column(name = "uexc_created_by")
    private String uexcCreatedBy;

    @Column(name = "uexc_created_on", nullable = false)
    private LocalDateTime uexcCreatedOn;

    @Column(name = "uexc_modified_by")
    private String uexcModifiedBy;

    @Column(name = "uexc_modified_on")
    private LocalDateTime uexcModifiedOn;

    public Integer getUexcExceptionId() { return uexcExceptionId; }
    public void setUexcExceptionId(Integer uexcExceptionId) { this.uexcExceptionId = uexcExceptionId; }

    public Integer getUexcEmployeeIdEmp() { return uexcEmployeeIdEmp; }
    public void setUexcEmployeeIdEmp(Integer uexcEmployeeIdEmp) { this.uexcEmployeeIdEmp = uexcEmployeeIdEmp; }

    public String getUexcExceptionType() { return uexcExceptionType; }
    public void setUexcExceptionType(String uexcExceptionType) { this.uexcExceptionType = uexcExceptionType; }

    public String getUexcMenuCodeMtree() { return uexcMenuCodeMtree; }
    public void setUexcMenuCodeMtree(String uexcMenuCodeMtree) { this.uexcMenuCodeMtree = uexcMenuCodeMtree; }

    public String getUexcReason() { return uexcReason; }
    public void setUexcReason(String uexcReason) { this.uexcReason = uexcReason; }

    public LocalDate getUexcValidFrom() { return uexcValidFrom; }
    public void setUexcValidFrom(LocalDate uexcValidFrom) { this.uexcValidFrom = uexcValidFrom; }

    public LocalDate getUexcValidUntil() { return uexcValidUntil; }
    public void setUexcValidUntil(LocalDate uexcValidUntil) { this.uexcValidUntil = uexcValidUntil; }

    public Boolean getUexcIsactive() { return uexcIsactive; }
    public void setUexcIsactive(Boolean uexcIsactive) { this.uexcIsactive = uexcIsactive; }

    public String getUexcCreatedBy() { return uexcCreatedBy; }
    public void setUexcCreatedBy(String uexcCreatedBy) { this.uexcCreatedBy = uexcCreatedBy; }

    public LocalDateTime getUexcCreatedOn() { return uexcCreatedOn; }
    public void setUexcCreatedOn(LocalDateTime uexcCreatedOn) { this.uexcCreatedOn = uexcCreatedOn; }

    public String getUexcModifiedBy() { return uexcModifiedBy; }
    public void setUexcModifiedBy(String uexcModifiedBy) { this.uexcModifiedBy = uexcModifiedBy; }

    public LocalDateTime getUexcModifiedOn() { return uexcModifiedOn; }
    public void setUexcModifiedOn(LocalDateTime uexcModifiedOn) { this.uexcModifiedOn = uexcModifiedOn; }

}
