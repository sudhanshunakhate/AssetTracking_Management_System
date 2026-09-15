package com.caits.domain.repository;

import com.caits.domain.entity.InvVendorMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface InvVendorMstRepository extends JpaRepository<InvVendorMst, Integer>, JpaSpecificationExecutor<InvVendorMst> {
    Optional<InvVendorMst> findByVndVendorCodeIgnoreCase(String code);
    boolean existsByVndVendorCodeIgnoreCase(String code);
}
