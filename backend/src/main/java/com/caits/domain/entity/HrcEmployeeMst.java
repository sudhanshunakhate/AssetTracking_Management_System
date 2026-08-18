package com.caits.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "hrc_employee_mst", schema = "caits_local")
public class HrcEmployeeMst {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "emp_employee_id", nullable = false)
    private Integer empEmployeeId;

    @Column(name = "emp_employee_code", nullable = false)
    private String empEmployeeCode;

    @Column(name = "emp_first_name", nullable = false)
    private String empFirstName;

    @Column(name = "emp_last_name")
    private String empLastName;

    @Column(name = "emp_gender")
    private String empGender;

    @Column(name = "emp_dob")
    private LocalDate empDob;

    @Column(name = "emp_joining_date")
    private LocalDate empJoiningDate;

    @Column(name = "emp_employment_type")
    private String empEmploymentType;

    @Column(name = "emp_designation")
    private String empDesignation;

    @Column(name = "emp_department_id_dept")
    private Integer empDepartmentIdDept;

    @Column(name = "emp_email", nullable = false)
    private String empEmail;

    @Column(name = "emp_phone")
    private String empPhone;

    @Column(name = "emp_alt_phone")
    private String empAltPhone;

    @Column(name = "emp_role_id_rol")
    private Integer empRoleIdRol;

    @Column(name = "emp_base_location_id_loc")
    private Integer empBaseLocationIdLoc;

    @Column(name = "emp_reporting_to_emp_id_emp")
    private Integer empReportingToEmpIdEmp;

    @Column(name = "emp_isactive", nullable = false)
    private Boolean empIsactive;

    @Column(name = "emp_created_by")
    private String empCreatedBy;

    @Column(name = "emp_created_on", nullable = false)
    private LocalDateTime empCreatedOn;

    @Column(name = "emp_modified_by")
    private String empModifiedBy;

    @Column(name = "emp_modified_on")
    private LocalDateTime empModifiedOn;

    public Integer getEmpEmployeeId() { return empEmployeeId; }
    public void setEmpEmployeeId(Integer empEmployeeId) { this.empEmployeeId = empEmployeeId; }

    public String getEmpEmployeeCode() { return empEmployeeCode; }
    public void setEmpEmployeeCode(String empEmployeeCode) { this.empEmployeeCode = empEmployeeCode; }

    public String getEmpFirstName() { return empFirstName; }
    public void setEmpFirstName(String empFirstName) { this.empFirstName = empFirstName; }

    public String getEmpLastName() { return empLastName; }
    public void setEmpLastName(String empLastName) { this.empLastName = empLastName; }

    public String getEmpGender() { return empGender; }
    public void setEmpGender(String empGender) { this.empGender = empGender; }

    public LocalDate getEmpDob() { return empDob; }
    public void setEmpDob(LocalDate empDob) { this.empDob = empDob; }

    public LocalDate getEmpJoiningDate() { return empJoiningDate; }
    public void setEmpJoiningDate(LocalDate empJoiningDate) { this.empJoiningDate = empJoiningDate; }

    public String getEmpEmploymentType() { return empEmploymentType; }
    public void setEmpEmploymentType(String empEmploymentType) { this.empEmploymentType = empEmploymentType; }

    public String getEmpDesignation() { return empDesignation; }
    public void setEmpDesignation(String empDesignation) { this.empDesignation = empDesignation; }

    public Integer getEmpDepartmentIdDept() { return empDepartmentIdDept; }
    public void setEmpDepartmentIdDept(Integer empDepartmentIdDept) { this.empDepartmentIdDept = empDepartmentIdDept; }

    public String getEmpEmail() { return empEmail; }
    public void setEmpEmail(String empEmail) { this.empEmail = empEmail; }

    public String getEmpPhone() { return empPhone; }
    public void setEmpPhone(String empPhone) { this.empPhone = empPhone; }

    public String getEmpAltPhone() { return empAltPhone; }
    public void setEmpAltPhone(String empAltPhone) { this.empAltPhone = empAltPhone; }

    public Integer getEmpRoleIdRol() { return empRoleIdRol; }
    public void setEmpRoleIdRol(Integer empRoleIdRol) { this.empRoleIdRol = empRoleIdRol; }

    public Integer getEmpBaseLocationIdLoc() { return empBaseLocationIdLoc; }
    public void setEmpBaseLocationIdLoc(Integer empBaseLocationIdLoc) { this.empBaseLocationIdLoc = empBaseLocationIdLoc; }

    public Integer getEmpReportingToEmpIdEmp() { return empReportingToEmpIdEmp; }
    public void setEmpReportingToEmpIdEmp(Integer empReportingToEmpIdEmp) { this.empReportingToEmpIdEmp = empReportingToEmpIdEmp; }

    public Boolean getEmpIsactive() { return empIsactive; }
    public void setEmpIsactive(Boolean empIsactive) { this.empIsactive = empIsactive; }

    public String getEmpCreatedBy() { return empCreatedBy; }
    public void setEmpCreatedBy(String empCreatedBy) { this.empCreatedBy = empCreatedBy; }

    public LocalDateTime getEmpCreatedOn() { return empCreatedOn; }
    public void setEmpCreatedOn(LocalDateTime empCreatedOn) { this.empCreatedOn = empCreatedOn; }

    public String getEmpModifiedBy() { return empModifiedBy; }
    public void setEmpModifiedBy(String empModifiedBy) { this.empModifiedBy = empModifiedBy; }

    public LocalDateTime getEmpModifiedOn() { return empModifiedOn; }
    public void setEmpModifiedOn(LocalDateTime empModifiedOn) { this.empModifiedOn = empModifiedOn; }

}
