package com.caits.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "hrc_department_mst", schema = "caits_local")
public class HrcDepartmentMst {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dept_department_id", nullable = false)
    private Integer deptDepartmentId;

    @Column(name = "dept_department_code", nullable = false)
    private String deptDepartmentCode;

    @Column(name = "dept_department_name", nullable = false)
    private String deptDepartmentName;

    @Column(name = "dept_entity_id_ent", nullable = false)
    private Integer deptEntityIdEnt;

    @Column(name = "dept_head_emp_id_emp")
    private Integer deptHeadEmpIdEmp;

    @Column(name = "dept_desc")
    private String deptDesc;

    @Column(name = "dept_isactive", nullable = false)
    private Boolean deptIsactive;

    @Column(name = "dept_created_by")
    private String deptCreatedBy;

    @Column(name = "dept_created_on", nullable = false)
    private LocalDateTime deptCreatedOn;

    @Column(name = "dept_modified_by")
    private String deptModifiedBy;

    @Column(name = "dept_modified_on")
    private LocalDateTime deptModifiedOn;

    public Integer getDeptDepartmentId() { return deptDepartmentId; }
    public void setDeptDepartmentId(Integer deptDepartmentId) { this.deptDepartmentId = deptDepartmentId; }

    public String getDeptDepartmentCode() { return deptDepartmentCode; }
    public void setDeptDepartmentCode(String deptDepartmentCode) { this.deptDepartmentCode = deptDepartmentCode; }

    public String getDeptDepartmentName() { return deptDepartmentName; }
    public void setDeptDepartmentName(String deptDepartmentName) { this.deptDepartmentName = deptDepartmentName; }

    public Integer getDeptEntityIdEnt() { return deptEntityIdEnt; }
    public void setDeptEntityIdEnt(Integer deptEntityIdEnt) { this.deptEntityIdEnt = deptEntityIdEnt; }

    public Integer getDeptHeadEmpIdEmp() { return deptHeadEmpIdEmp; }
    public void setDeptHeadEmpIdEmp(Integer deptHeadEmpIdEmp) { this.deptHeadEmpIdEmp = deptHeadEmpIdEmp; }

    public String getDeptDesc() { return deptDesc; }
    public void setDeptDesc(String deptDesc) { this.deptDesc = deptDesc; }

    public Boolean getDeptIsactive() { return deptIsactive; }
    public void setDeptIsactive(Boolean deptIsactive) { this.deptIsactive = deptIsactive; }

    public String getDeptCreatedBy() { return deptCreatedBy; }
    public void setDeptCreatedBy(String deptCreatedBy) { this.deptCreatedBy = deptCreatedBy; }

    public LocalDateTime getDeptCreatedOn() { return deptCreatedOn; }
    public void setDeptCreatedOn(LocalDateTime deptCreatedOn) { this.deptCreatedOn = deptCreatedOn; }

    public String getDeptModifiedBy() { return deptModifiedBy; }
    public void setDeptModifiedBy(String deptModifiedBy) { this.deptModifiedBy = deptModifiedBy; }

    public LocalDateTime getDeptModifiedOn() { return deptModifiedOn; }
    public void setDeptModifiedOn(LocalDateTime deptModifiedOn) { this.deptModifiedOn = deptModifiedOn; }
}
