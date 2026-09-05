package com.caits.domain.repository;

import com.caits.domain.entity.InvBlsMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface InvBlsMstRepository extends JpaRepository<InvBlsMst, Integer>, JpaSpecificationExecutor<InvBlsMst> {

    List<InvBlsMst> findByIbmIssuedToEmpIdEmpAndIbmIsDummyFalseAndIbmIsactiveTrue(Integer empId);

    List<InvBlsMst> findByIbmIsactiveTrueAndIbmIssuedToEmpIdEmpIsNotNull();

    List<InvBlsMst> findByIbmIsDummyFalseAndIbmIsactiveTrue();

    /** Non-dummy active units currently at a location and not issued to an employee (department custody). */
    List<InvBlsMst> findByIbmCurrentLocationIdLocAndIbmIsDummyFalseAndIbmIsactiveTrueAndIbmIssuedToEmpIdEmpIsNull(
            Integer locationId);

    Optional<InvBlsMst> findFirstByIbmItemIdItmAndIbmIsDummyTrueAndIbmIsactiveTrue(Integer itemId);

    Optional<InvBlsMst> findFirstByIbmSerialNoIgnoreCaseAndIbmIsactiveTrue(String serialNo);

    Optional<InvBlsMst> findFirstByIbmItemIdItmAndIbmBatchNoIgnoreCaseAndIbmIsDummyFalseAndIbmIsactiveTrue(
            Integer itemId, String batchNo);

    /** In-store / non-issued serial units for an item (optionally at one location).
     * Callers that post stock (Issue/Transfer) must also require positive inv_stock at that location. */
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

    /** All non-issued serial units currently at one location. */
    @Query("""
            SELECT b FROM InvBlsMst b
            WHERE COALESCE(b.ibmIsactive, true) = true
              AND COALESCE(b.ibmIsDummy, false) = false
              AND b.ibmIssuedToEmpIdEmp IS NULL
              AND b.ibmSerialNo IS NOT NULL AND TRIM(b.ibmSerialNo) <> ''
              AND b.ibmCurrentLocationIdLoc = :locationId
            ORDER BY b.ibmItemIdItm ASC, b.ibmSerialNo ASC
            """)
    List<InvBlsMst> findAvailableSerialsAtLocation(@Param("locationId") Integer locationId);

    /** Active non-dummy units currently allotted/issued (serial keys for free-stock filtering). */
    @Query("""
            SELECT b.ibmItemIdItm, UPPER(TRIM(b.ibmSerialNo))
            FROM InvBlsMst b
            WHERE COALESCE(b.ibmIsactive, true) = true
              AND COALESCE(b.ibmIsDummy, false) = false
              AND b.ibmIssuedToEmpIdEmp IS NOT NULL
              AND b.ibmSerialNo IS NOT NULL AND TRIM(b.ibmSerialNo) <> ''
              AND b.ibmItemIdItm IN :itemIds
            """)
    List<Object[]> findIssuedSerialKeysByItemIds(@Param("itemIds") Collection<Integer> itemIds);
}
