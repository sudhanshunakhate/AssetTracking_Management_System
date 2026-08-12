package com.caits.domain.repository;

import com.caits.domain.entity.HrcDepartmentMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface HrcDepartmentMstRepository extends JpaRepository<HrcDepartmentMst, Integer>, JpaSpecificationExecutor<HrcDepartmentMst> {
    boolean existsByDeptDepartmentCodeIgnoreCase(String code);
    Optional<HrcDepartmentMst> findByDeptDepartmentCodeIgnoreCase(String code);
}
