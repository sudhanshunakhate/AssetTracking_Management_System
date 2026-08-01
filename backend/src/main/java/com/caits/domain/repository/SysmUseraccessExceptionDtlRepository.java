package com.caits.domain.repository;

import com.caits.domain.entity.SysmUseraccessExceptionDtl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface SysmUseraccessExceptionDtlRepository extends JpaRepository<SysmUseraccessExceptionDtl, Integer>, JpaSpecificationExecutor<SysmUseraccessExceptionDtl> {

    /** Two live overrides on the same employee + menu + type would make the effective right ambiguous. */
    boolean existsByUexcEmployeeIdEmpAndUexcMenuCodeMtreeIgnoreCaseAndUexcExceptionTypeIgnoreCase(
            Integer employeeId, String menuCode, String exceptionType);

    boolean existsByUexcEmployeeIdEmpAndUexcMenuCodeMtreeIgnoreCaseAndUexcExceptionTypeIgnoreCaseAndUexcExceptionIdNot(
            Integer employeeId, String menuCode, String exceptionType, Integer exceptionId);
}
