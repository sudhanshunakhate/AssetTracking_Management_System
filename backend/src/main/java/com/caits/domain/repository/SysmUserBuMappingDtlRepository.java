package com.caits.domain.repository;

import com.caits.domain.entity.SysmUserBuMappingDtl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface SysmUserBuMappingDtlRepository extends JpaRepository<SysmUserBuMappingDtl, Integer>, JpaSpecificationExecutor<SysmUserBuMappingDtl> {
    List<SysmUserBuMappingDtl> findByUboaUserIdUsr(Integer userId);
    void deleteByUboaUserIdUsr(Integer userId);
}
