package com.caits.domain.repository;

import com.caits.domain.entity.GentypeMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface GentypeMstRepository extends JpaRepository<GentypeMst, Integer>, JpaSpecificationExecutor<GentypeMst> {
    Optional<GentypeMst> findByGtypTypeCodeIgnoreCase(String code);
    boolean existsByGtypTypeCodeIgnoreCase(String code);
}
