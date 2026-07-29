package com.caits.domain.repository;

import com.caits.domain.entity.SysmUserloginMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface SysmUserloginMstRepository extends JpaRepository<SysmUserloginMst, Integer>, JpaSpecificationExecutor<SysmUserloginMst> {
    Optional<SysmUserloginMst> findByUsrLoginIdIgnoreCase(String loginId);
    boolean existsByUsrLoginIdIgnoreCase(String loginId);
}
