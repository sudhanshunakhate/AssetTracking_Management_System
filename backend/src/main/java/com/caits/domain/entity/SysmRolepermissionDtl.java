package com.caits.domain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "sysm_rolepermission_dtl")
public class SysmRolepermissionDtl {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rlpm_role_permission_id", nullable = false)
    private Integer rlpmRolePermissionId;

    @Column(name = "rlpm_role_id_rol", nullable = false)
    private Integer rlpmRoleIdRol;

    @Column(name = "rlpm_menu_id_mtree", nullable = false)
    private Integer rlpmMenuIdMtree;

    @Column(name = "rlpm_can_view")
    private Boolean rlpmCanView;

    @Column(name = "rlpm_can_create")
    private Boolean rlpmCanCreate;

    @Column(name = "rlpm_can_edit")
    private Boolean rlpmCanEdit;

    @Column(name = "rlpm_can_delete")
    private Boolean rlpmCanDelete;

    @Column(name = "rlpm_can_approve")
    private Boolean rlpmCanApprove;

    @Column(name = "rlpm_can_reject")
    private Boolean rlpmCanReject;

    @Column(name = "rlpm_can_print")
    private Boolean rlpmCanPrint;

    @Column(name = "rlpm_can_export")
    private Boolean rlpmCanExport;

    public Integer getRlpmRolePermissionId() { return rlpmRolePermissionId; }
    public void setRlpmRolePermissionId(Integer rlpmRolePermissionId) { this.rlpmRolePermissionId = rlpmRolePermissionId; }

    public Integer getRlpmRoleIdRol() { return rlpmRoleIdRol; }
    public void setRlpmRoleIdRol(Integer rlpmRoleIdRol) { this.rlpmRoleIdRol = rlpmRoleIdRol; }

    public Integer getRlpmMenuIdMtree() { return rlpmMenuIdMtree; }
    public void setRlpmMenuIdMtree(Integer rlpmMenuIdMtree) { this.rlpmMenuIdMtree = rlpmMenuIdMtree; }

    public Boolean getRlpmCanView() { return rlpmCanView; }
    public void setRlpmCanView(Boolean rlpmCanView) { this.rlpmCanView = rlpmCanView; }

    public Boolean getRlpmCanCreate() { return rlpmCanCreate; }
    public void setRlpmCanCreate(Boolean rlpmCanCreate) { this.rlpmCanCreate = rlpmCanCreate; }

    public Boolean getRlpmCanEdit() { return rlpmCanEdit; }
    public void setRlpmCanEdit(Boolean rlpmCanEdit) { this.rlpmCanEdit = rlpmCanEdit; }

    public Boolean getRlpmCanDelete() { return rlpmCanDelete; }
    public void setRlpmCanDelete(Boolean rlpmCanDelete) { this.rlpmCanDelete = rlpmCanDelete; }

    public Boolean getRlpmCanApprove() { return rlpmCanApprove; }
    public void setRlpmCanApprove(Boolean rlpmCanApprove) { this.rlpmCanApprove = rlpmCanApprove; }

    public Boolean getRlpmCanReject() { return rlpmCanReject; }
    public void setRlpmCanReject(Boolean rlpmCanReject) { this.rlpmCanReject = rlpmCanReject; }

    public Boolean getRlpmCanPrint() { return rlpmCanPrint; }
    public void setRlpmCanPrint(Boolean rlpmCanPrint) { this.rlpmCanPrint = rlpmCanPrint; }

    public Boolean getRlpmCanExport() { return rlpmCanExport; }
    public void setRlpmCanExport(Boolean rlpmCanExport) { this.rlpmCanExport = rlpmCanExport; }
}
