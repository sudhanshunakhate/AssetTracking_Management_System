package com.caits.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sysm_userlogin_mst", schema = "caits_local")
public class SysmUserloginMst {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "usr_user_id", nullable = false)
    private Integer usrUserId;

    @Column(name = "usr_employee_id_emp", nullable = false)
    private Integer usrEmployeeIdEmp;

    @Column(name = "usr_login_id", nullable = false)
    private String usrLoginId;

    @Column(name = "usr_password_hash", nullable = false)
    private String usrPasswordHash;

    @Column(name = "usr_role_id_rol", nullable = false)
    private Integer usrRoleIdRol;

    @Column(name = "usr_account_status", nullable = false)
    private String usrAccountStatus;

    @Column(name = "usr_entity_id_ent", nullable = false)
    private Integer usrEntityIdEnt;

    @Column(name = "usr_bu_access_scope", nullable = false)
    private String usrBuAccessScope;

    @Column(name = "usr_location_id_loc")
    private Integer usrLocationIdLoc;

    @Column(name = "usr_force_password_reset")
    private Boolean usrForcePasswordReset;

    @Column(name = "usr_isactive", nullable = false)
    private Boolean usrIsactive;

    @Column(name = "usr_last_login_on")
    private LocalDateTime usrLastLoginOn;

    @Column(name = "usr_last_login_ip")
    private String usrLastLoginIp;

    @Column(name = "usr_failed_attempts")
    private Integer usrFailedAttempts;

    @Column(name = "usr_created_by")
    private String usrCreatedBy;

    @Column(name = "usr_created_on", nullable = false)
    private LocalDateTime usrCreatedOn;

    @Column(name = "usr_modified_by")
    private String usrModifiedBy;

    @Column(name = "usr_modified_on")
    private LocalDateTime usrModifiedOn;

    public Integer getUsrUserId() { return usrUserId; }
    public void setUsrUserId(Integer usrUserId) { this.usrUserId = usrUserId; }

    public Integer getUsrEmployeeIdEmp() { return usrEmployeeIdEmp; }
    public void setUsrEmployeeIdEmp(Integer usrEmployeeIdEmp) { this.usrEmployeeIdEmp = usrEmployeeIdEmp; }

    public String getUsrLoginId() { return usrLoginId; }
    public void setUsrLoginId(String usrLoginId) { this.usrLoginId = usrLoginId; }

    public String getUsrPasswordHash() { return usrPasswordHash; }
    public void setUsrPasswordHash(String usrPasswordHash) { this.usrPasswordHash = usrPasswordHash; }

    public Integer getUsrRoleIdRol() { return usrRoleIdRol; }
    public void setUsrRoleIdRol(Integer usrRoleIdRol) { this.usrRoleIdRol = usrRoleIdRol; }

    public String getUsrAccountStatus() { return usrAccountStatus; }
    public void setUsrAccountStatus(String usrAccountStatus) { this.usrAccountStatus = usrAccountStatus; }

    public Integer getUsrEntityIdEnt() { return usrEntityIdEnt; }
    public void setUsrEntityIdEnt(Integer usrEntityIdEnt) { this.usrEntityIdEnt = usrEntityIdEnt; }

    public String getUsrBuAccessScope() { return usrBuAccessScope; }
    public void setUsrBuAccessScope(String usrBuAccessScope) { this.usrBuAccessScope = usrBuAccessScope; }

    public Integer getUsrLocationIdLoc() { return usrLocationIdLoc; }
    public void setUsrLocationIdLoc(Integer usrLocationIdLoc) { this.usrLocationIdLoc = usrLocationIdLoc; }

    public Boolean getUsrForcePasswordReset() { return usrForcePasswordReset; }
    public void setUsrForcePasswordReset(Boolean usrForcePasswordReset) { this.usrForcePasswordReset = usrForcePasswordReset; }

    public Boolean getUsrIsactive() { return usrIsactive; }
    public void setUsrIsactive(Boolean usrIsactive) { this.usrIsactive = usrIsactive; }

    public LocalDateTime getUsrLastLoginOn() { return usrLastLoginOn; }
    public void setUsrLastLoginOn(LocalDateTime usrLastLoginOn) { this.usrLastLoginOn = usrLastLoginOn; }

    public String getUsrLastLoginIp() { return usrLastLoginIp; }
    public void setUsrLastLoginIp(String usrLastLoginIp) { this.usrLastLoginIp = usrLastLoginIp; }

    public Integer getUsrFailedAttempts() { return usrFailedAttempts; }
    public void setUsrFailedAttempts(Integer usrFailedAttempts) { this.usrFailedAttempts = usrFailedAttempts; }

    public String getUsrCreatedBy() { return usrCreatedBy; }
    public void setUsrCreatedBy(String usrCreatedBy) { this.usrCreatedBy = usrCreatedBy; }

    public LocalDateTime getUsrCreatedOn() { return usrCreatedOn; }
    public void setUsrCreatedOn(LocalDateTime usrCreatedOn) { this.usrCreatedOn = usrCreatedOn; }

    public String getUsrModifiedBy() { return usrModifiedBy; }
    public void setUsrModifiedBy(String usrModifiedBy) { this.usrModifiedBy = usrModifiedBy; }

    public LocalDateTime getUsrModifiedOn() { return usrModifiedOn; }
    public void setUsrModifiedOn(LocalDateTime usrModifiedOn) { this.usrModifiedOn = usrModifiedOn; }

}
