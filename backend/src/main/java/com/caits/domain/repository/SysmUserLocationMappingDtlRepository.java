package com.caits.domain.repository;

import com.caits.domain.entity.SysmUserLocationMappingDtl;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SysmUserLocationMappingDtlRepository extends JpaRepository<SysmUserLocationMappingDtl, Integer> {
    List<SysmUserLocationMappingDtl> findByUlocUserIdUsr(Integer userId);
    void deleteByUlocUserIdUsr(Integer userId);
}
