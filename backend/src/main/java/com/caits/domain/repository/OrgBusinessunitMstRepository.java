package com.caits.domain.repository;

import com.caits.domain.entity.OrgBusinessunitMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface OrgBusinessunitMstRepository extends JpaRepository<OrgBusinessunitMst, Integer>, JpaSpecificationExecutor<OrgBusinessunitMst> {
    Optional<OrgBusinessunitMst> findByBuBuCodeIgnoreCase(String code);
    boolean existsByBuBuCodeIgnoreCase(String code);
}
