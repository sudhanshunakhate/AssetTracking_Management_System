package com.caits.domain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "inv_item_bu_mapping_dtl", schema = "caits_local")
public class InvItemBuMappingDtl {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "iibm_item_bu_access_id", nullable = false)
    private Integer iibmItemBuAccessId;

    @Column(name = "iibm_item_id_itm", nullable = false)
    private Integer iibmItemIdItm;

    @Column(name = "iibm_bu_id_bu", nullable = false)
    private Integer iibmBuIdBu;

    public Integer getIibmItemBuAccessId() { return iibmItemBuAccessId; }
    public void setIibmItemBuAccessId(Integer iibmItemBuAccessId) { this.iibmItemBuAccessId = iibmItemBuAccessId; }

    public Integer getIibmItemIdItm() { return iibmItemIdItm; }
    public void setIibmItemIdItm(Integer iibmItemIdItm) { this.iibmItemIdItm = iibmItemIdItm; }

    public Integer getIibmBuIdBu() { return iibmBuIdBu; }
    public void setIibmBuIdBu(Integer iibmBuIdBu) { this.iibmBuIdBu = iibmBuIdBu; }
}
