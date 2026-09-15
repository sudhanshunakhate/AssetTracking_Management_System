package com.caits.domain.repository;

import com.caits.domain.entity.UnitMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface UnitMstRepository extends JpaRepository<UnitMst, Integer>, JpaSpecificationExecutor<UnitMst> {
    Optional<UnitMst> findByUntUnitCodeIgnoreCase(String code);
    boolean existsByUntUnitCodeIgnoreCase(String code);
}
