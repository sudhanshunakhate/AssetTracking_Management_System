package com.caits.domain.repository;

import com.caits.domain.entity.GenmasterMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface GenmasterMstRepository extends JpaRepository<GenmasterMst, Integer>, JpaSpecificationExecutor<GenmasterMst> {
    Optional<GenmasterMst> findByGmstValueCodeIgnoreCaseAndGmstGentypeIdGtyp(String code, Integer gentypeId);
    boolean existsByGmstValueCodeIgnoreCaseAndGmstGentypeIdGtyp(String code, Integer gentypeId);
    List<GenmasterMst> findByGmstGentypeIdGtypOrderByGmstSortOrderAsc(Integer gentypeId);
}
