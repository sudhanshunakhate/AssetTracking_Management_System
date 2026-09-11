package com.caits.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sysm_roles_mst")
public class SysmRolesMst {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rol_role_id", nullable = false)
    private Integer rolRoleId;

    @Column(name = "rol_role_code", nullable = false)
    private String rolRoleCode;

    @Column(name = "rol_role_name", nullable = false)
    private String rolRoleName;

    @Column(name = "rol_desc")
    private String rolDesc;

    @Column(name = "rol_is_system_role")
    private Boolean rolIsSystemRole;

    @Column(name = "rol_isactive", nullable = false)
    private Boolean rolIsactive;

    @Column(name = "rol_created_by")
    private String rolCreatedBy;

    @Column(name = "rol_created_on", nullable = false)
    private LocalDateTime rolCreatedOn;

    @Column(name = "rol_modified_by")
    private String rolModifiedBy;

    @Column(name = "rol_modified_on")
    private LocalDateTime rolModifiedOn;

    public Integer getRolRoleId() { return rolRoleId; }
    public void setRolRoleId(Integer rolRoleId) { this.rolRoleId = rolRoleId; }

    public String getRolRoleCode() { return rolRoleCode; }
    public void setRolRoleCode(String rolRoleCode) { this.rolRoleCode = rolRoleCode; }

    public String getRolRoleName() { return rolRoleName; }
    public void setRolRoleName(String rolRoleName) { this.rolRoleName = rolRoleName; }

    public String getRolDesc() { return rolDesc; }
    public void setRolDesc(String rolDesc) { this.rolDesc = rolDesc; }

    public Boolean getRolIsSystemRole() { return rolIsSystemRole; }
    public void setRolIsSystemRole(Boolean rolIsSystemRole) { this.rolIsSystemRole = rolIsSystemRole; }

    public Boolean getRolIsactive() { return rolIsactive; }
    public void setRolIsactive(Boolean rolIsactive) { this.rolIsactive = rolIsactive; }

    public String getRolCreatedBy() { return rolCreatedBy; }
    public void setRolCreatedBy(String rolCreatedBy) { this.rolCreatedBy = rolCreatedBy; }

    public LocalDateTime getRolCreatedOn() { return rolCreatedOn; }
    public void setRolCreatedOn(LocalDateTime rolCreatedOn) { this.rolCreatedOn = rolCreatedOn; }

    public String getRolModifiedBy() { return rolModifiedBy; }
    public void setRolModifiedBy(String rolModifiedBy) { this.rolModifiedBy = rolModifiedBy; }

    public LocalDateTime getRolModifiedOn() { return rolModifiedOn; }
    public void setRolModifiedOn(LocalDateTime rolModifiedOn) { this.rolModifiedOn = rolModifiedOn; }

}
