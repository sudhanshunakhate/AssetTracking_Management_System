package com.caits.domain.repository;

import com.caits.domain.entity.InvBlsMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InvBlsMstRepository extends JpaRepository<InvBlsMst, Integer>, JpaSpecificationExecutor<InvBlsMst> {

    List<InvBlsMst> findByIbmIssuedToEmpIdEmpAndIbmIsDummyFalseAndIbmIsactiveTrue(Integer empId);

    List<InvBlsMst> findByIbmIsactiveTrueAndIbmIssuedToEmpIdEmpIsNotNull();

    List<InvBlsMst> findByIbmIsDummyFalseAndIbmIsactiveTrue();

    Optional<InvBlsMst> findFirstByIbmItemIdItmAndIbmIsDummyTrueAndIbmIsactiveTrue(Integer itemId);

    Optional<InvBlsMst> findFirstByIbmSerialNoIgnoreCaseAndIbmIsactiveTrue(String serialNo);

    Optional<InvBlsMst> findFirstByIbmItemIdItmAndIbmBatchNoIgnoreCaseAndIbmIsDummyFalseAndIbmIsactiveTrue(
            Integer itemId, String batchNo);

    /** In-store / non-issued serial units for an item (optionally at one location). */
    @Query("""
            SELECT b FROM InvBlsMst b
            WHERE b.ibmItemIdItm = :itemId
              AND COALESCE(b.ibmIsactive, true) = true
              AND COALESCE(b.ibmIsDummy, false) = false
              AND b.ibmIssuedToEmpIdEmp IS NULL
              AND b.ibmSerialNo IS NOT NULL AND TRIM(b.ibmSerialNo) <> ''
              AND (:locationId IS NULL OR b.ibmCurrentLocationIdLoc = :locationId)
            ORDER BY b.ibmSerialNo ASC
            """)
    List<InvBlsMst> findAvailableSerials(
            @Param("itemId") Integer itemId,
            @Param("locationId") Integer locationId);
}
