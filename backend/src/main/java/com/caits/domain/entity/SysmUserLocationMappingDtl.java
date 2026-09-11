package com.caits.domain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "sysm_user_location_mapping_dtl")
public class SysmUserLocationMappingDtl {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "uloc_user_loc_access_id", nullable = false)
    private Integer ulocUserLocAccessId;

    @Column(name = "uloc_user_id_usr", nullable = false)
    private Integer ulocUserIdUsr;

    @Column(name = "uloc_location_id_loc", nullable = false)
    private Integer ulocLocationIdLoc;

    public Integer getUlocUserLocAccessId() { return ulocUserLocAccessId; }
    public void setUlocUserLocAccessId(Integer ulocUserLocAccessId) { this.ulocUserLocAccessId = ulocUserLocAccessId; }

    public Integer getUlocUserIdUsr() { return ulocUserIdUsr; }
    public void setUlocUserIdUsr(Integer ulocUserIdUsr) { this.ulocUserIdUsr = ulocUserIdUsr; }

    public Integer getUlocLocationIdLoc() { return ulocLocationIdLoc; }
    public void setUlocLocationIdLoc(Integer ulocLocationIdLoc) { this.ulocLocationIdLoc = ulocLocationIdLoc; }
}
