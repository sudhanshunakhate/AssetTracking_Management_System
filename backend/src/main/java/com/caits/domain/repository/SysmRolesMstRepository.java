package com.caits.domain.repository;

import com.caits.domain.entity.SysmRolesMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface SysmRolesMstRepository extends JpaRepository<SysmRolesMst, Integer>, JpaSpecificationExecutor<SysmRolesMst> {
    Optional<SysmRolesMst> findByRolRoleCodeIgnoreCase(String code);
    boolean existsByRolRoleCodeIgnoreCase(String code);
}
