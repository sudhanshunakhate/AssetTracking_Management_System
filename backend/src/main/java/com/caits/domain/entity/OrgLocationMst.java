package com.caits.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "org_location_mst", schema = "caits_local")
public class OrgLocationMst {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "loc_location_id", nullable = false)
    private Integer locLocationId;

    @Column(name = "loc_location_code", nullable = false)
    private String locLocationCode;

    @Column(name = "loc_location_name", nullable = false)
    private String locLocationName;

    @Column(name = "loc_location_type")
    private String locLocationType;

    @Column(name = "loc_entity_id_ent", nullable = false)
    private Integer locEntityIdEnt;

    @Column(name = "loc_bu_id_bu", nullable = false)
    private Integer locBuIdBu;

    @Column(name = "loc_manager_emp_id_emp")
    private Integer locManagerEmpIdEmp;

    @Column(name = "loc_add1")
    private String locAdd1;

    @Column(name = "loc_add2")
    private String locAdd2;

    @Column(name = "loc_city")
    private String locCity;

    @Column(name = "loc_pin")
    private String locPin;

    @Column(name = "loc_isactive", nullable = false)
    private Boolean locIsactive;

    @Column(name = "loc_is_system_location", nullable = false)
    private Boolean locIsSystemLocation = false;

    @Column(name = "loc_system_role")
    private String locSystemRole;

    @Column(name = "loc_print_location_name")
    private String locPrintLocationName;

    @Column(name = "loc_created_by")
    private String locCreatedBy;

    @Column(name = "loc_created_on", nullable = false)
    private LocalDateTime locCreatedOn;

    @Column(name = "loc_modified_by")
    private String locModifiedBy;

    @Column(name = "loc_modified_on")
    private LocalDateTime locModifiedOn;

    public Integer getLocLocationId() { return locLocationId; }
    public void setLocLocationId(Integer locLocationId) { this.locLocationId = locLocationId; }

    public String getLocLocationCode() { return locLocationCode; }
    public void setLocLocationCode(String locLocationCode) { this.locLocationCode = locLocationCode; }

    public String getLocLocationName() { return locLocationName; }
    public void setLocLocationName(String locLocationName) { this.locLocationName = locLocationName; }

    public String getLocLocationType() { return locLocationType; }
    public void setLocLocationType(String locLocationType) { this.locLocationType = locLocationType; }

    public Integer getLocEntityIdEnt() { return locEntityIdEnt; }
    public void setLocEntityIdEnt(Integer locEntityIdEnt) { this.locEntityIdEnt = locEntityIdEnt; }

    public Integer getLocBuIdBu() { return locBuIdBu; }
    public void setLocBuIdBu(Integer locBuIdBu) { this.locBuIdBu = locBuIdBu; }

    public Integer getLocManagerEmpIdEmp() { return locManagerEmpIdEmp; }
    public void setLocManagerEmpIdEmp(Integer locManagerEmpIdEmp) { this.locManagerEmpIdEmp = locManagerEmpIdEmp; }

    public String getLocAdd1() { return locAdd1; }
    public void setLocAdd1(String locAdd1) { this.locAdd1 = locAdd1; }

    public String getLocAdd2() { return locAdd2; }
    public void setLocAdd2(String locAdd2) { this.locAdd2 = locAdd2; }

    public String getLocCity() { return locCity; }
    public void setLocCity(String locCity) { this.locCity = locCity; }

    public String getLocPin() { return locPin; }
    public void setLocPin(String locPin) { this.locPin = locPin; }

    public Boolean getLocIsactive() { return locIsactive; }
    public void setLocIsactive(Boolean locIsactive) { this.locIsactive = locIsactive; }

    public Boolean getLocIsSystemLocation() { return locIsSystemLocation; }
    public void setLocIsSystemLocation(Boolean locIsSystemLocation) { this.locIsSystemLocation = locIsSystemLocation; }

    public String getLocSystemRole() { return locSystemRole; }
    public void setLocSystemRole(String locSystemRole) { this.locSystemRole = locSystemRole; }

    public String getLocPrintLocationName() { return locPrintLocationName; }
    public void setLocPrintLocationName(String locPrintLocationName) { this.locPrintLocationName = locPrintLocationName; }

    public String getLocCreatedBy() { return locCreatedBy; }
    public void setLocCreatedBy(String locCreatedBy) { this.locCreatedBy = locCreatedBy; }

    public LocalDateTime getLocCreatedOn() { return locCreatedOn; }
    public void setLocCreatedOn(LocalDateTime locCreatedOn) { this.locCreatedOn = locCreatedOn; }

    public String getLocModifiedBy() { return locModifiedBy; }
    public void setLocModifiedBy(String locModifiedBy) { this.locModifiedBy = locModifiedBy; }

    public LocalDateTime getLocModifiedOn() { return locModifiedOn; }
    public void setLocModifiedOn(LocalDateTime locModifiedOn) { this.locModifiedOn = locModifiedOn; }

}
