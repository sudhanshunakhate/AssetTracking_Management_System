package com.caits.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "org_businessunit_mst", schema = "caits_local")
public class OrgBusinessunitMst {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bu_bu_id", nullable = false)
    private Integer buBuId;

    @Column(name = "bu_bu_code", nullable = false)
    private String buBuCode;

    @Column(name = "bu_bu_name", nullable = false)
    private String buBuName;

    @Column(name = "bu_entity_id_ent", nullable = false)
    private Integer buEntityIdEnt;

    @Column(name = "bu_bu_type")
    private String buBuType;

    @Column(name = "bu_manager_emp_id_emp")
    private Integer buManagerEmpIdEmp;

    @Column(name = "bu_add1")
    private String buAdd1;

    @Column(name = "bu_add2")
    private String buAdd2;

    @Column(name = "bu_city")
    private String buCity;

    @Column(name = "bu_state")
    private String buState;

    @Column(name = "bu_pin")
    private String buPin;

    @Column(name = "bu_isactive", nullable = false)
    private Boolean buIsactive;

    @Column(name = "bu_created_by")
    private String buCreatedBy;

    @Column(name = "bu_created_on", nullable = false)
    private LocalDateTime buCreatedOn;

    @Column(name = "bu_modified_by")
    private String buModifiedBy;

    @Column(name = "bu_modified_on")
    private LocalDateTime buModifiedOn;

    public Integer getBuBuId() { return buBuId; }
    public void setBuBuId(Integer buBuId) { this.buBuId = buBuId; }

    public String getBuBuCode() { return buBuCode; }
    public void setBuBuCode(String buBuCode) { this.buBuCode = buBuCode; }

    public String getBuBuName() { return buBuName; }
    public void setBuBuName(String buBuName) { this.buBuName = buBuName; }

    public Integer getBuEntityIdEnt() { return buEntityIdEnt; }
    public void setBuEntityIdEnt(Integer buEntityIdEnt) { this.buEntityIdEnt = buEntityIdEnt; }

    public String getBuBuType() { return buBuType; }
    public void setBuBuType(String buBuType) { this.buBuType = buBuType; }

    public Integer getBuManagerEmpIdEmp() { return buManagerEmpIdEmp; }
    public void setBuManagerEmpIdEmp(Integer buManagerEmpIdEmp) { this.buManagerEmpIdEmp = buManagerEmpIdEmp; }

    public String getBuAdd1() { return buAdd1; }
    public void setBuAdd1(String buAdd1) { this.buAdd1 = buAdd1; }

    public String getBuAdd2() { return buAdd2; }
    public void setBuAdd2(String buAdd2) { this.buAdd2 = buAdd2; }

    public String getBuCity() { return buCity; }
    public void setBuCity(String buCity) { this.buCity = buCity; }

    public String getBuState() { return buState; }
    public void setBuState(String buState) { this.buState = buState; }

    public String getBuPin() { return buPin; }
    public void setBuPin(String buPin) { this.buPin = buPin; }

    public Boolean getBuIsactive() { return buIsactive; }
    public void setBuIsactive(Boolean buIsactive) { this.buIsactive = buIsactive; }

    public String getBuCreatedBy() { return buCreatedBy; }
    public void setBuCreatedBy(String buCreatedBy) { this.buCreatedBy = buCreatedBy; }

    public LocalDateTime getBuCreatedOn() { return buCreatedOn; }
    public void setBuCreatedOn(LocalDateTime buCreatedOn) { this.buCreatedOn = buCreatedOn; }

    public String getBuModifiedBy() { return buModifiedBy; }
    public void setBuModifiedBy(String buModifiedBy) { this.buModifiedBy = buModifiedBy; }

    public LocalDateTime getBuModifiedOn() { return buModifiedOn; }
    public void setBuModifiedOn(LocalDateTime buModifiedOn) { this.buModifiedOn = buModifiedOn; }

}
