package com.caits.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "genmaster_mst")
public class GenmasterMst {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "gmst_genmaster_id", nullable = false)
    private Integer gmstGenmasterId;

    @Column(name = "gmst_value_code", nullable = false)
    private String gmstValueCode;

    @Column(name = "gmst_value_name", nullable = false)
    private String gmstValueName;

    @Column(name = "gmst_gentype_id_gtyp", nullable = false)
    private Integer gmstGentypeIdGtyp;

    @Column(name = "gmst_sort_order")
    private Integer gmstSortOrder;

    @Column(name = "gmst_desc")
    private String gmstDesc;

    @Column(name = "gmst_isactive", nullable = false)
    private Boolean gmstIsactive;

    @Column(name = "gmst_created_by")
    private String gmstCreatedBy;

    @Column(name = "gmst_created_on", nullable = false)
    private LocalDateTime gmstCreatedOn;

    @Column(name = "gmst_modified_by")
    private String gmstModifiedBy;

    @Column(name = "gmst_modified_on")
    private LocalDateTime gmstModifiedOn;

    public Integer getGmstGenmasterId() { return gmstGenmasterId; }
    public void setGmstGenmasterId(Integer gmstGenmasterId) { this.gmstGenmasterId = gmstGenmasterId; }

    public String getGmstValueCode() { return gmstValueCode; }
    public void setGmstValueCode(String gmstValueCode) { this.gmstValueCode = gmstValueCode; }

    public String getGmstValueName() { return gmstValueName; }
    public void setGmstValueName(String gmstValueName) { this.gmstValueName = gmstValueName; }

    public Integer getGmstGentypeIdGtyp() { return gmstGentypeIdGtyp; }
    public void setGmstGentypeIdGtyp(Integer gmstGentypeIdGtyp) { this.gmstGentypeIdGtyp = gmstGentypeIdGtyp; }

    public Integer getGmstSortOrder() { return gmstSortOrder; }
    public void setGmstSortOrder(Integer gmstSortOrder) { this.gmstSortOrder = gmstSortOrder; }

    public String getGmstDesc() { return gmstDesc; }
    public void setGmstDesc(String gmstDesc) { this.gmstDesc = gmstDesc; }

    public Boolean getGmstIsactive() { return gmstIsactive; }
    public void setGmstIsactive(Boolean gmstIsactive) { this.gmstIsactive = gmstIsactive; }

    public String getGmstCreatedBy() { return gmstCreatedBy; }
    public void setGmstCreatedBy(String gmstCreatedBy) { this.gmstCreatedBy = gmstCreatedBy; }

    public LocalDateTime getGmstCreatedOn() { return gmstCreatedOn; }
    public void setGmstCreatedOn(LocalDateTime gmstCreatedOn) { this.gmstCreatedOn = gmstCreatedOn; }

    public String getGmstModifiedBy() { return gmstModifiedBy; }
    public void setGmstModifiedBy(String gmstModifiedBy) { this.gmstModifiedBy = gmstModifiedBy; }

    public LocalDateTime getGmstModifiedOn() { return gmstModifiedOn; }
    public void setGmstModifiedOn(LocalDateTime gmstModifiedOn) { this.gmstModifiedOn = gmstModifiedOn; }

}
