package com.caits.domain.repository;

import com.caits.domain.entity.InvStockMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
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

    /** Row: [0]=out, [1]=low, [2]=inStock — full population, not a page sample. */
    @Query(value = """
            SELECT
              COUNT(*) FILTER (WHERE COALESCE(s.stk_current_qty, 0) <= 0),
              COUNT(*) FILTER (
                WHERE COALESCE(s.stk_current_qty, 0) > 0
                  AND s.stk_reorder_level IS NOT NULL AND s.stk_reorder_level > 0
                  AND COALESCE(s.stk_current_qty, 0) <= s.stk_reorder_level
              ),
              COUNT(*) FILTER (
                WHERE COALESCE(s.stk_current_qty, 0) > 0
                  AND (s.stk_reorder_level IS NULL OR s.stk_reorder_level <= 0
                       OR COALESCE(s.stk_current_qty, 0) > s.stk_reorder_level)
              )
            FROM caits_local.inv_stock_mst s
            WHERE COALESCE(s.stk_isactive, true) = true
            """, nativeQuery = true)
    List<Object[]> stockHealthAll();

    @Query(value = """
            SELECT
              COUNT(*) FILTER (WHERE COALESCE(s.stk_current_qty, 0) <= 0),
              COUNT(*) FILTER (
                WHERE COALESCE(s.stk_current_qty, 0) > 0
                  AND s.stk_reorder_level IS NOT NULL AND s.stk_reorder_level > 0
                  AND COALESCE(s.stk_current_qty, 0) <= s.stk_reorder_level
              ),
              COUNT(*) FILTER (
                WHERE COALESCE(s.stk_current_qty, 0) > 0
                  AND (s.stk_reorder_level IS NULL OR s.stk_reorder_level <= 0
                       OR COALESCE(s.stk_current_qty, 0) > s.stk_reorder_level)
              )
            FROM caits_local.inv_stock_mst s
            WHERE COALESCE(s.stk_isactive, true) = true
              AND s.stk_location_id_loc IN (:locationIds)
            """, nativeQuery = true)
    List<Object[]> stockHealthByLocations(@Param("locationIds") Collection<Integer> locationIds);

    /** [0]=store label, [1]=sum qty */
    @Query(value = """
            SELECT COALESCE(l.loc_location_name, l.loc_location_code, CAST(s.stk_location_id_loc AS text)),
                   COALESCE(SUM(s.stk_current_qty), 0)
            FROM caits_local.inv_stock_mst s
            LEFT JOIN caits_local.org_location_mst l ON l.loc_location_id = s.stk_location_id_loc
            WHERE COALESCE(s.stk_isactive, true) = true
            GROUP BY s.stk_location_id_loc, l.loc_location_code, l.loc_location_name
            ORDER BY 2 DESC
            """, nativeQuery = true)
    List<Object[]> stockQtyByStoreAll();

    @Query(value = """
            SELECT COALESCE(l.loc_location_name, l.loc_location_code, CAST(s.stk_location_id_loc AS text)),
                   COALESCE(SUM(s.stk_current_qty), 0)
            FROM caits_local.inv_stock_mst s
            LEFT JOIN caits_local.org_location_mst l ON l.loc_location_id = s.stk_location_id_loc
            WHERE COALESCE(s.stk_isactive, true) = true
              AND s.stk_location_id_loc IN (:locationIds)
            GROUP BY s.stk_location_id_loc, l.loc_location_code, l.loc_location_name
            ORDER BY 2 DESC
            """, nativeQuery = true)
    List<Object[]> stockQtyByStoreByLocations(@Param("locationIds") Collection<Integer> locationIds);

    /**
     * Alert rows (out / low). Columns:
     * stockId, itemId, itemCode, itemName, storeLabel, qty, reorder
     */
    @Query(value = """
            SELECT s.stk_stock_id, s.stk_item_id_itm,
                   COALESCE(i.itm_item_code, ''), COALESCE(i.itm_item_name, ''),
                   COALESCE(l.loc_location_name, l.loc_location_code, '—'),
                   COALESCE(s.stk_current_qty, 0), s.stk_reorder_level
            FROM caits_local.inv_stock_mst s
            LEFT JOIN caits_local.inv_item_mst i ON i.itm_item_id = s.stk_item_id_itm
            LEFT JOIN caits_local.org_location_mst l ON l.loc_location_id = s.stk_location_id_loc
            WHERE COALESCE(s.stk_isactive, true) = true
              AND (
                COALESCE(s.stk_current_qty, 0) <= 0
                OR (s.stk_reorder_level IS NOT NULL AND s.stk_reorder_level > 0
                    AND COALESCE(s.stk_current_qty, 0) <= s.stk_reorder_level)
              )
            ORDER BY COALESCE(s.stk_current_qty, 0) ASC, i.itm_item_name ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> stockAlertRowsAll(@Param("limit") int limit);

    @Query(value = """
            SELECT s.stk_stock_id, s.stk_item_id_itm,
                   COALESCE(i.itm_item_code, ''), COALESCE(i.itm_item_name, ''),
                   COALESCE(l.loc_location_name, l.loc_location_code, '—'),
                   COALESCE(s.stk_current_qty, 0), s.stk_reorder_level
            FROM caits_local.inv_stock_mst s
            LEFT JOIN caits_local.inv_item_mst i ON i.itm_item_id = s.stk_item_id_itm
            LEFT JOIN caits_local.org_location_mst l ON l.loc_location_id = s.stk_location_id_loc
            WHERE COALESCE(s.stk_isactive, true) = true
              AND s.stk_location_id_loc IN (:locationIds)
              AND (
                COALESCE(s.stk_current_qty, 0) <= 0
                OR (s.stk_reorder_level IS NOT NULL AND s.stk_reorder_level > 0
                    AND COALESCE(s.stk_current_qty, 0) <= s.stk_reorder_level)
              )
            ORDER BY COALESCE(s.stk_current_qty, 0) ASC, i.itm_item_name ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> stockAlertRowsByLocations(@Param("locationIds") Collection<Integer> locationIds,
                                             @Param("limit") int limit);

    /** Top on-hand rows when there are no alerts. Same column layout as alert rows. */
    @Query(value = """
            SELECT s.stk_stock_id, s.stk_item_id_itm,
                   COALESCE(i.itm_item_code, ''), COALESCE(i.itm_item_name, ''),
                   COALESCE(l.loc_location_name, l.loc_location_code, '—'),
                   COALESCE(s.stk_current_qty, 0), s.stk_reorder_level
            FROM caits_local.inv_stock_mst s
            LEFT JOIN caits_local.inv_item_mst i ON i.itm_item_id = s.stk_item_id_itm
            LEFT JOIN caits_local.org_location_mst l ON l.loc_location_id = s.stk_location_id_loc
            WHERE COALESCE(s.stk_isactive, true) = true
            ORDER BY COALESCE(s.stk_current_qty, 0) DESC, i.itm_item_name ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> stockTopRowsAll(@Param("limit") int limit);

    @Query(value = """
            SELECT s.stk_stock_id, s.stk_item_id_itm,
                   COALESCE(i.itm_item_code, ''), COALESCE(i.itm_item_name, ''),
                   COALESCE(l.loc_location_name, l.loc_location_code, '—'),
                   COALESCE(s.stk_current_qty, 0), s.stk_reorder_level
            FROM caits_local.inv_stock_mst s
            LEFT JOIN caits_local.inv_item_mst i ON i.itm_item_id = s.stk_item_id_itm
            LEFT JOIN caits_local.org_location_mst l ON l.loc_location_id = s.stk_location_id_loc
            WHERE COALESCE(s.stk_isactive, true) = true
              AND s.stk_location_id_loc IN (:locationIds)
            ORDER BY COALESCE(s.stk_current_qty, 0) DESC, i.itm_item_name ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> stockTopRowsByLocations(@Param("locationIds") Collection<Integer> locationIds,
                                           @Param("limit") int limit);
}
