package com.caits.domain.repository;

import com.caits.domain.entity.SysmRolepermissionDtl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface SysmRolepermissionDtlRepository extends JpaRepository<SysmRolepermissionDtl, Integer>, JpaSpecificationExecutor<SysmRolepermissionDtl> {
    List<SysmRolepermissionDtl> findByRlpmRoleIdRol(Integer roleId);
    void deleteByRlpmRoleIdRol(Integer roleId);
}
