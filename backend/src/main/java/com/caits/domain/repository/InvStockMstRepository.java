package com.caits.domain.repository;

import com.caits.domain.entity.InvStockMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Optional;

public interface InvStockMstRepository extends JpaRepository<InvStockMst, Integer>, JpaSpecificationExecutor<InvStockMst> {
    Optional<InvStockMst> findFirstByStkItemIdItmAndStkLocationIdLoc(Integer itemId, Integer locationId);

    @Query(value = """
            SELECT COUNT(*) FROM caits_local.inv_stock_mst s
            WHERE COALESCE(s.stk_isactive, true) = true
              AND s.stk_reorder_level IS NOT NULL AND s.stk_reorder_level > 0
              AND COALESCE(s.stk_current_qty, 0) <= s.stk_reorder_level
            """, nativeQuery = true)
    long countLowStockAll();

    @Query(value = """
            SELECT COUNT(*) FROM caits_local.inv_stock_mst s
            WHERE COALESCE(s.stk_isactive, true) = true
              AND s.stk_reorder_level IS NOT NULL AND s.stk_reorder_level > 0
              AND COALESCE(s.stk_current_qty, 0) <= s.stk_reorder_level
              AND s.stk_location_id_loc IN (:locationIds)
            """, nativeQuery = true)
    long countLowStockByLocations(@Param("locationIds") Collection<Integer> locationIds);

    @Query(value = """
            SELECT COUNT(*) FROM caits_local.inv_stock_mst s
            WHERE COALESCE(s.stk_isactive, true) = true
            """, nativeQuery = true)
    long countActiveStockRowsAll();

    @Query(value = """
            SELECT COUNT(*) FROM caits_local.inv_stock_mst s
            WHERE COALESCE(s.stk_isactive, true) = true
              AND s.stk_location_id_loc IN (:locationIds)
            """, nativeQuery = true)
    long countActiveStockRowsByLocations(@Param("locationIds") Collection<Integer> locationIds);
}
