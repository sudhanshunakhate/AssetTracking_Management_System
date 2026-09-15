package com.caits.domain.repository;

import com.caits.domain.entity.SysmUseraccessExceptionDtl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface SysmUseraccessExceptionDtlRepository extends JpaRepository<SysmUseraccessExceptionDtl, Integer>, JpaSpecificationExecutor<SysmUseraccessExceptionDtl> {

    List<SysmUseraccessExceptionDtl> findByUexcEmployeeIdEmp(Integer employeeId);

    /** Two live overrides on the same employee + menu + type would make the effective right ambiguous. */
    boolean existsByUexcEmployeeIdEmpAndUexcMenuCodeMtreeIgnoreCaseAndUexcExceptionTypeIgnoreCase(
            Integer employeeId, String menuCode, String exceptionType);

    boolean existsByUexcEmployeeIdEmpAndUexcMenuCodeMtreeIgnoreCaseAndUexcExceptionTypeIgnoreCaseAndUexcExceptionIdNot(
            Integer employeeId, String menuCode, String exceptionType, Integer exceptionId);
}
