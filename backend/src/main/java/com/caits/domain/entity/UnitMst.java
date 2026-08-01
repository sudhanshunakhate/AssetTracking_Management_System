package com.caits.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "unit_mst", schema = "caits_local")
public class UnitMst {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "unt_unit_id", nullable = false)
    private Integer untUnitId;

    @Column(name = "unt_unit_code", nullable = false)
    private String untUnitCode;

    @Column(name = "unt_unit_name", nullable = false)
    private String untUnitName;

    @Column(name = "unt_desc")
    private String untDesc;

    @Column(name = "unt_isactive", nullable = false)
    private Boolean untIsactive;

    @Column(name = "unt_created_by")
    private String untCreatedBy;

    @Column(name = "unt_created_on", nullable = false)
    private LocalDateTime untCreatedOn;

    @Column(name = "unt_modified_by")
    private String untModifiedBy;

    @Column(name = "unt_modified_on")
    private LocalDateTime untModifiedOn;

    public Integer getUntUnitId() { return untUnitId; }
    public void setUntUnitId(Integer untUnitId) { this.untUnitId = untUnitId; }

    public String getUntUnitCode() { return untUnitCode; }
    public void setUntUnitCode(String untUnitCode) { this.untUnitCode = untUnitCode; }

    public String getUntUnitName() { return untUnitName; }
    public void setUntUnitName(String untUnitName) { this.untUnitName = untUnitName; }

    public String getUntDesc() { return untDesc; }
    public void setUntDesc(String untDesc) { this.untDesc = untDesc; }

    public Boolean getUntIsactive() { return untIsactive; }
    public void setUntIsactive(Boolean untIsactive) { this.untIsactive = untIsactive; }

    public String getUntCreatedBy() { return untCreatedBy; }
    public void setUntCreatedBy(String untCreatedBy) { this.untCreatedBy = untCreatedBy; }

    public LocalDateTime getUntCreatedOn() { return untCreatedOn; }
    public void setUntCreatedOn(LocalDateTime untCreatedOn) { this.untCreatedOn = untCreatedOn; }

    public String getUntModifiedBy() { return untModifiedBy; }
    public void setUntModifiedBy(String untModifiedBy) { this.untModifiedBy = untModifiedBy; }

    public LocalDateTime getUntModifiedOn() { return untModifiedOn; }
    public void setUntModifiedOn(LocalDateTime untModifiedOn) { this.untModifiedOn = untModifiedOn; }

}
