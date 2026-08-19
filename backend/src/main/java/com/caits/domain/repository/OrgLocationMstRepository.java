package com.caits.domain.repository;

import com.caits.domain.entity.OrgLocationMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface OrgLocationMstRepository extends JpaRepository<OrgLocationMst, Integer>, JpaSpecificationExecutor<OrgLocationMst> {
    Optional<OrgLocationMst> findByLocLocationCodeIgnoreCase(String code);
    boolean existsByLocLocationCodeIgnoreCase(String code);
    boolean existsByLocBuIdBuAndLocSystemRole(Integer buId, String systemRole);
    Optional<OrgLocationMst> findByLocBuIdBuAndLocSystemRoleAndLocIsactiveTrue(Integer buId, String systemRole);
    boolean existsByLocEntityIdEntAndLocSystemRoleAndLocIsSystemLocationTrueAndLocBuIdBuIsNull(
            Integer entityId, String systemRole);
    Optional<OrgLocationMst> findByLocEntityIdEntAndLocSystemRoleAndLocIsSystemLocationTrueAndLocIsactiveTrue(
            Integer entityId, String systemRole);
}
