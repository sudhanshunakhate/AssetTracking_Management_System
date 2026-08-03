package com.caits.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sysm_menutree_mst", schema = "caits_local")
public class SysmMenutreeMst {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mtree_menu_id", nullable = false)
    private Integer mtreeMenuId;

    @Column(name = "mtree_menu_code", nullable = false)
    private String mtreeMenuCode;

    @Column(name = "mtree_menu_label", nullable = false)
    private String mtreeMenuLabel;

    @Column(name = "mtree_menu_group", nullable = false)
    private String mtreeMenuGroup;

    @Column(name = "mtree_sort_order", nullable = false)
    private Integer mtreeSortOrder;

    @Column(name = "mtree_group_sort_order", nullable = false)
    private Integer mtreeGroupSortOrder;

    @Column(name = "mtree_icon")
    private String mtreeIcon;

    @Column(name = "mtree_doc_type")
    private String mtreeDocType;

    @Column(name = "mtree_supports_view", nullable = false)
    private Boolean mtreeSupportsView;

    @Column(name = "mtree_supports_create", nullable = false)
    private Boolean mtreeSupportsCreate;

    @Column(name = "mtree_supports_edit", nullable = false)
    private Boolean mtreeSupportsEdit;

    @Column(name = "mtree_supports_delete", nullable = false)
    private Boolean mtreeSupportsDelete;

    @Column(name = "mtree_supports_approve", nullable = false)
    private Boolean mtreeSupportsApprove;

    @Column(name = "mtree_supports_reject", nullable = false)
    private Boolean mtreeSupportsReject;

    @Column(name = "mtree_supports_print", nullable = false)
    private Boolean mtreeSupportsPrint;

    @Column(name = "mtree_supports_export", nullable = false)
    private Boolean mtreeSupportsExport;

    @Column(name = "mtree_is_system_menu")
    private Boolean mtreeIsSystemMenu;

    @Column(name = "mtree_isactive", nullable = false)
    private Boolean mtreeIsactive;

    @Column(name = "mtree_created_by")
    private String mtreeCreatedBy;

    @Column(name = "mtree_created_on", nullable = false)
    private LocalDateTime mtreeCreatedOn;

    @Column(name = "mtree_modified_by")
    private String mtreeModifiedBy;

    @Column(name = "mtree_modified_on")
    private LocalDateTime mtreeModifiedOn;

    public Integer getMtreeMenuId() { return mtreeMenuId; }
    public void setMtreeMenuId(Integer mtreeMenuId) { this.mtreeMenuId = mtreeMenuId; }

    public String getMtreeMenuCode() { return mtreeMenuCode; }
    public void setMtreeMenuCode(String mtreeMenuCode) { this.mtreeMenuCode = mtreeMenuCode; }

    public String getMtreeMenuLabel() { return mtreeMenuLabel; }
    public void setMtreeMenuLabel(String mtreeMenuLabel) { this.mtreeMenuLabel = mtreeMenuLabel; }

    public String getMtreeMenuGroup() { return mtreeMenuGroup; }
    public void setMtreeMenuGroup(String mtreeMenuGroup) { this.mtreeMenuGroup = mtreeMenuGroup; }

    public Integer getMtreeSortOrder() { return mtreeSortOrder; }
    public void setMtreeSortOrder(Integer mtreeSortOrder) { this.mtreeSortOrder = mtreeSortOrder; }

    public Integer getMtreeGroupSortOrder() { return mtreeGroupSortOrder; }
    public void setMtreeGroupSortOrder(Integer mtreeGroupSortOrder) { this.mtreeGroupSortOrder = mtreeGroupSortOrder; }

    public String getMtreeIcon() { return mtreeIcon; }
    public void setMtreeIcon(String mtreeIcon) { this.mtreeIcon = mtreeIcon; }

    public String getMtreeDocType() { return mtreeDocType; }
    public void setMtreeDocType(String mtreeDocType) { this.mtreeDocType = mtreeDocType; }

    public Boolean getMtreeSupportsView() { return mtreeSupportsView; }
    public void setMtreeSupportsView(Boolean mtreeSupportsView) { this.mtreeSupportsView = mtreeSupportsView; }

    public Boolean getMtreeSupportsCreate() { return mtreeSupportsCreate; }
    public void setMtreeSupportsCreate(Boolean mtreeSupportsCreate) { this.mtreeSupportsCreate = mtreeSupportsCreate; }

    public Boolean getMtreeSupportsEdit() { return mtreeSupportsEdit; }
    public void setMtreeSupportsEdit(Boolean mtreeSupportsEdit) { this.mtreeSupportsEdit = mtreeSupportsEdit; }

    public Boolean getMtreeSupportsDelete() { return mtreeSupportsDelete; }
    public void setMtreeSupportsDelete(Boolean mtreeSupportsDelete) { this.mtreeSupportsDelete = mtreeSupportsDelete; }

    public Boolean getMtreeSupportsApprove() { return mtreeSupportsApprove; }
    public void setMtreeSupportsApprove(Boolean mtreeSupportsApprove) { this.mtreeSupportsApprove = mtreeSupportsApprove; }

    public Boolean getMtreeSupportsReject() { return mtreeSupportsReject; }
    public void setMtreeSupportsReject(Boolean mtreeSupportsReject) { this.mtreeSupportsReject = mtreeSupportsReject; }

    public Boolean getMtreeSupportsPrint() { return mtreeSupportsPrint; }
    public void setMtreeSupportsPrint(Boolean mtreeSupportsPrint) { this.mtreeSupportsPrint = mtreeSupportsPrint; }

    public Boolean getMtreeSupportsExport() { return mtreeSupportsExport; }
    public void setMtreeSupportsExport(Boolean mtreeSupportsExport) { this.mtreeSupportsExport = mtreeSupportsExport; }

    public Boolean getMtreeIsSystemMenu() { return mtreeIsSystemMenu; }
    public void setMtreeIsSystemMenu(Boolean mtreeIsSystemMenu) { this.mtreeIsSystemMenu = mtreeIsSystemMenu; }

    public Boolean getMtreeIsactive() { return mtreeIsactive; }
    public void setMtreeIsactive(Boolean mtreeIsactive) { this.mtreeIsactive = mtreeIsactive; }

    public String getMtreeCreatedBy() { return mtreeCreatedBy; }
    public void setMtreeCreatedBy(String mtreeCreatedBy) { this.mtreeCreatedBy = mtreeCreatedBy; }

    public LocalDateTime getMtreeCreatedOn() { return mtreeCreatedOn; }
    public void setMtreeCreatedOn(LocalDateTime mtreeCreatedOn) { this.mtreeCreatedOn = mtreeCreatedOn; }

    public String getMtreeModifiedBy() { return mtreeModifiedBy; }
    public void setMtreeModifiedBy(String mtreeModifiedBy) { this.mtreeModifiedBy = mtreeModifiedBy; }

    public LocalDateTime getMtreeModifiedOn() { return mtreeModifiedOn; }
    public void setMtreeModifiedOn(LocalDateTime mtreeModifiedOn) { this.mtreeModifiedOn = mtreeModifiedOn; }

}
