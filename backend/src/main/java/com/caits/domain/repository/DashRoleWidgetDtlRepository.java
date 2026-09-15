package com.caits.domain.repository;

import com.caits.domain.entity.DashRoleWidgetDtl;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DashRoleWidgetDtlRepository extends JpaRepository<DashRoleWidgetDtl, Integer> {
    List<DashRoleWidgetDtl> findByDshrRoleIdRolAndDshrIsVisibleTrueOrderByDshrSortOrderAsc(Integer roleId);
    long countByDshrRoleIdRolAndDshrIsVisibleTrue(Integer roleId);
}
