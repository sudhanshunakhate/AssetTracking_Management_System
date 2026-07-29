package com.caits.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "category_mst", schema = "caits_local")
public class CategoryMst {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cat_category_id", nullable = false)
    private Integer catCategoryId;

    @Column(name = "cat_category_code", nullable = false)
    private String catCategoryCode;

    @Column(name = "cat_category_name", nullable = false)
    private String catCategoryName;

    @Column(name = "cat_desc")
    private String catDesc;

    @Column(name = "cat_isactive", nullable = false)
    private Boolean catIsactive;

    @Column(name = "cat_created_by")
    private String catCreatedBy;

    @Column(name = "cat_created_on", nullable = false)
    private LocalDateTime catCreatedOn;

    @Column(name = "cat_modified_by")
    private String catModifiedBy;

    @Column(name = "cat_modified_on")
    private LocalDateTime catModifiedOn;

    public Integer getCatCategoryId() { return catCategoryId; }
    public void setCatCategoryId(Integer catCategoryId) { this.catCategoryId = catCategoryId; }

    public String getCatCategoryCode() { return catCategoryCode; }
    public void setCatCategoryCode(String catCategoryCode) { this.catCategoryCode = catCategoryCode; }

    public String getCatCategoryName() { return catCategoryName; }
    public void setCatCategoryName(String catCategoryName) { this.catCategoryName = catCategoryName; }

    public String getCatDesc() { return catDesc; }
    public void setCatDesc(String catDesc) { this.catDesc = catDesc; }

    public Boolean getCatIsactive() { return catIsactive; }
    public void setCatIsactive(Boolean catIsactive) { this.catIsactive = catIsactive; }

    public String getCatCreatedBy() { return catCreatedBy; }
    public void setCatCreatedBy(String catCreatedBy) { this.catCreatedBy = catCreatedBy; }

    public LocalDateTime getCatCreatedOn() { return catCreatedOn; }
    public void setCatCreatedOn(LocalDateTime catCreatedOn) { this.catCreatedOn = catCreatedOn; }

    public String getCatModifiedBy() { return catModifiedBy; }
    public void setCatModifiedBy(String catModifiedBy) { this.catModifiedBy = catModifiedBy; }

    public LocalDateTime getCatModifiedOn() { return catModifiedOn; }
    public void setCatModifiedOn(LocalDateTime catModifiedOn) { this.catModifiedOn = catModifiedOn; }

}
