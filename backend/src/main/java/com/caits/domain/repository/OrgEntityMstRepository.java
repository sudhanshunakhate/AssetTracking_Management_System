package com.caits.domain.repository;

import com.caits.domain.entity.OrgEntityMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface OrgEntityMstRepository extends JpaRepository<OrgEntityMst, Integer>, JpaSpecificationExecutor<OrgEntityMst> {
    Optional<OrgEntityMst> findByEntEntityCodeIgnoreCase(String code);
    boolean existsByEntEntityCodeIgnoreCase(String code);
}
