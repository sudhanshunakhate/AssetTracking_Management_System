package com.caits.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sysm_user_favourite_menu_dtl")
public class SysmUserFavouriteMenuDtl {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ufav_favourite_id", nullable = false)
    private Integer ufavFavouriteId;

    @Column(name = "ufav_user_id_usr", nullable = false)
    private Integer ufavUserIdUsr;

    @Column(name = "ufav_menu_code_mtree", nullable = false, length = 20)
    private String ufavMenuCodeMtree;

    @Column(name = "ufav_sort_order", nullable = false)
    private Integer ufavSortOrder;

    @Column(name = "ufav_created_on", nullable = false)
    private LocalDateTime ufavCreatedOn;

    public Integer getUfavFavouriteId() { return ufavFavouriteId; }
    public void setUfavFavouriteId(Integer ufavFavouriteId) { this.ufavFavouriteId = ufavFavouriteId; }

    public Integer getUfavUserIdUsr() { return ufavUserIdUsr; }
    public void setUfavUserIdUsr(Integer ufavUserIdUsr) { this.ufavUserIdUsr = ufavUserIdUsr; }

    public String getUfavMenuCodeMtree() { return ufavMenuCodeMtree; }
    public void setUfavMenuCodeMtree(String ufavMenuCodeMtree) { this.ufavMenuCodeMtree = ufavMenuCodeMtree; }

    public Integer getUfavSortOrder() { return ufavSortOrder; }
    public void setUfavSortOrder(Integer ufavSortOrder) { this.ufavSortOrder = ufavSortOrder; }

    public LocalDateTime getUfavCreatedOn() { return ufavCreatedOn; }
    public void setUfavCreatedOn(LocalDateTime ufavCreatedOn) { this.ufavCreatedOn = ufavCreatedOn; }
}
