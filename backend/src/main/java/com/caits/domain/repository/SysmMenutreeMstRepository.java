package com.caits.domain.repository;

import com.caits.domain.entity.SysmMenutreeMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface SysmMenutreeMstRepository extends JpaRepository<SysmMenutreeMst, Integer>, JpaSpecificationExecutor<SysmMenutreeMst> {
    List<SysmMenutreeMst> findByMtreeIsactiveTrueOrderByMtreeSortOrderAsc();
    Optional<SysmMenutreeMst> findByMtreeMenuCodeIgnoreCase(String menuCode);
}
