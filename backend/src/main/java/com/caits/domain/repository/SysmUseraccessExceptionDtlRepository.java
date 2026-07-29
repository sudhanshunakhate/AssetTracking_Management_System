package com.caits.domain.repository;

import com.caits.domain.entity.SysmUseraccessExceptionDtl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface SysmUseraccessExceptionDtlRepository extends JpaRepository<SysmUseraccessExceptionDtl, Integer>, JpaSpecificationExecutor<SysmUseraccessExceptionDtl> {
}
