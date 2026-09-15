package com.caits.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sysm_user_bu_mapping_dtl")
public class SysmUserBuMappingDtl {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "uboa_user_bu_access_id", nullable = false)
    private Integer uboaUserBuAccessId;

    @Column(name = "uboa_user_id_usr", nullable = false)
    private Integer uboaUserIdUsr;

    @Column(name = "uboa_bu_id_bu", nullable = false)
    private Integer uboaBuIdBu;

    public Integer getUboaUserBuAccessId() { return uboaUserBuAccessId; }
    public void setUboaUserBuAccessId(Integer uboaUserBuAccessId) { this.uboaUserBuAccessId = uboaUserBuAccessId; }

    public Integer getUboaUserIdUsr() { return uboaUserIdUsr; }
    public void setUboaUserIdUsr(Integer uboaUserIdUsr) { this.uboaUserIdUsr = uboaUserIdUsr; }

    public Integer getUboaBuIdBu() { return uboaBuIdBu; }
    public void setUboaBuIdBu(Integer uboaBuIdBu) { this.uboaBuIdBu = uboaBuIdBu; }

}
