package com.caits.domain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "inv_item_location_mapping_dtl", schema = "caits_local")
public class InvItemLocationMappingDtl {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ilim_item_loc_access_id", nullable = false)
    private Integer ilimItemLocAccessId;

    @Column(name = "ilim_item_id_itm", nullable = false)
    private Integer ilimItemIdItm;

    @Column(name = "ilim_location_id_loc", nullable = false)
    private Integer ilimLocationIdLoc;

    public Integer getIlimItemLocAccessId() { return ilimItemLocAccessId; }
    public void setIlimItemLocAccessId(Integer ilimItemLocAccessId) { this.ilimItemLocAccessId = ilimItemLocAccessId; }

    public Integer getIlimItemIdItm() { return ilimItemIdItm; }
    public void setIlimItemIdItm(Integer ilimItemIdItm) { this.ilimItemIdItm = ilimItemIdItm; }

    public Integer getIlimLocationIdLoc() { return ilimLocationIdLoc; }
    public void setIlimLocationIdLoc(Integer ilimLocationIdLoc) { this.ilimLocationIdLoc = ilimLocationIdLoc; }
}
