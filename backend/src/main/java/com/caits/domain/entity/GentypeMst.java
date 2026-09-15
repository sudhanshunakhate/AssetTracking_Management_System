package com.caits.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "gentype_mst")
public class GentypeMst {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "gtyp_gentype_id", nullable = false)
    private Integer gtypGentypeId;

    @Column(name = "gtyp_type_code", nullable = false)
    private String gtypTypeCode;

    @Column(name = "gtyp_type_name", nullable = false)
    private String gtypTypeName;

    @Column(name = "gtyp_desc")
    private String gtypDesc;

    @Column(name = "gtyp_isactive", nullable = false)
    private Boolean gtypIsactive;

    @Column(name = "gtyp_created_by")
    private String gtypCreatedBy;

    @Column(name = "gtyp_created_on", nullable = false)
    private LocalDateTime gtypCreatedOn;

    @Column(name = "gtyp_modified_by")
    private String gtypModifiedBy;

    @Column(name = "gtyp_modified_on")
    private LocalDateTime gtypModifiedOn;

    public Integer getGtypGentypeId() { return gtypGentypeId; }
    public void setGtypGentypeId(Integer gtypGentypeId) { this.gtypGentypeId = gtypGentypeId; }

    public String getGtypTypeCode() { return gtypTypeCode; }
    public void setGtypTypeCode(String gtypTypeCode) { this.gtypTypeCode = gtypTypeCode; }

    public String getGtypTypeName() { return gtypTypeName; }
    public void setGtypTypeName(String gtypTypeName) { this.gtypTypeName = gtypTypeName; }

    public String getGtypDesc() { return gtypDesc; }
    public void setGtypDesc(String gtypDesc) { this.gtypDesc = gtypDesc; }

    public Boolean getGtypIsactive() { return gtypIsactive; }
    public void setGtypIsactive(Boolean gtypIsactive) { this.gtypIsactive = gtypIsactive; }

    public String getGtypCreatedBy() { return gtypCreatedBy; }
    public void setGtypCreatedBy(String gtypCreatedBy) { this.gtypCreatedBy = gtypCreatedBy; }

    public LocalDateTime getGtypCreatedOn() { return gtypCreatedOn; }
    public void setGtypCreatedOn(LocalDateTime gtypCreatedOn) { this.gtypCreatedOn = gtypCreatedOn; }

    public String getGtypModifiedBy() { return gtypModifiedBy; }
    public void setGtypModifiedBy(String gtypModifiedBy) { this.gtypModifiedBy = gtypModifiedBy; }

    public LocalDateTime getGtypModifiedOn() { return gtypModifiedOn; }
    public void setGtypModifiedOn(LocalDateTime gtypModifiedOn) { this.gtypModifiedOn = gtypModifiedOn; }

}
