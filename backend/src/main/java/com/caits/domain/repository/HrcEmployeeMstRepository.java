package com.caits.domain.repository;

import com.caits.domain.entity.HrcEmployeeMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface HrcEmployeeMstRepository extends JpaRepository<HrcEmployeeMst, Integer>, JpaSpecificationExecutor<HrcEmployeeMst> {
    Optional<HrcEmployeeMst> findByEmpEmployeeCodeIgnoreCase(String code);
    boolean existsByEmpEmployeeCodeIgnoreCase(String code);
    List<HrcEmployeeMst> findByEmpReportingToEmpIdEmp(Integer managerId);
}
