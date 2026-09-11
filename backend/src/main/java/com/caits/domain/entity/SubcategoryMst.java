package com.caits.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "subcategory_mst")
public class SubcategoryMst {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "scat_subcategory_id", nullable = false)
    private Integer scatSubcategoryId;

    @Column(name = "scat_subcategory_code", nullable = false)
    private String scatSubcategoryCode;

    @Column(name = "scat_subcategory_name", nullable = false)
    private String scatSubcategoryName;

    @Column(name = "scat_category_id_cat", nullable = false)
    private Integer scatCategoryIdCat;

    @Column(name = "scat_desc")
    private String scatDesc;

    @Column(name = "scat_isactive", nullable = false)
    private Boolean scatIsactive;

    @Column(name = "scat_created_by")
    private String scatCreatedBy;

    @Column(name = "scat_created_on", nullable = false)
    private LocalDateTime scatCreatedOn;

    @Column(name = "scat_modified_by")
    private String scatModifiedBy;

    @Column(name = "scat_modified_on")
    private LocalDateTime scatModifiedOn;

    public Integer getScatSubcategoryId() { return scatSubcategoryId; }
    public void setScatSubcategoryId(Integer scatSubcategoryId) { this.scatSubcategoryId = scatSubcategoryId; }

    public String getScatSubcategoryCode() { return scatSubcategoryCode; }
    public void setScatSubcategoryCode(String scatSubcategoryCode) { this.scatSubcategoryCode = scatSubcategoryCode; }

    public String getScatSubcategoryName() { return scatSubcategoryName; }
    public void setScatSubcategoryName(String scatSubcategoryName) { this.scatSubcategoryName = scatSubcategoryName; }

    public Integer getScatCategoryIdCat() { return scatCategoryIdCat; }
    public void setScatCategoryIdCat(Integer scatCategoryIdCat) { this.scatCategoryIdCat = scatCategoryIdCat; }

    public String getScatDesc() { return scatDesc; }
    public void setScatDesc(String scatDesc) { this.scatDesc = scatDesc; }

    public Boolean getScatIsactive() { return scatIsactive; }
    public void setScatIsactive(Boolean scatIsactive) { this.scatIsactive = scatIsactive; }

    public String getScatCreatedBy() { return scatCreatedBy; }
    public void setScatCreatedBy(String scatCreatedBy) { this.scatCreatedBy = scatCreatedBy; }

    public LocalDateTime getScatCreatedOn() { return scatCreatedOn; }
    public void setScatCreatedOn(LocalDateTime scatCreatedOn) { this.scatCreatedOn = scatCreatedOn; }

    public String getScatModifiedBy() { return scatModifiedBy; }
    public void setScatModifiedBy(String scatModifiedBy) { this.scatModifiedBy = scatModifiedBy; }

    public LocalDateTime getScatModifiedOn() { return scatModifiedOn; }
    public void setScatModifiedOn(LocalDateTime scatModifiedOn) { this.scatModifiedOn = scatModifiedOn; }

}
