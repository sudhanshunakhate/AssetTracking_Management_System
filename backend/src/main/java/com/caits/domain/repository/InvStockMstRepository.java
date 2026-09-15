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
            SELECT COUNT(*) FROM inv_stock_mst s
            WHERE COALESCE(s.stk_isactive, true) = true
              AND s.stk_reorder_level IS NOT NULL AND s.stk_reorder_level > 0
              AND COALESCE(s.stk_current_qty, 0) <= s.stk_reorder_level
            """, nativeQuery = true)
    long countLowStockAll();

    @Query(value = """
            SELECT COUNT(*) FROM inv_stock_mst s
            WHERE COALESCE(s.stk_isactive, true) = true
              AND s.stk_reorder_level IS NOT NULL AND s.stk_reorder_level > 0
              AND COALESCE(s.stk_current_qty, 0) <= s.stk_reorder_level
              AND s.stk_location_id_loc IN (:locationIds)
            """, nativeQuery = true)
    long countLowStockByLocations(@Param("locationIds") Collection<Integer> locationIds);

    @Query(value = """
            SELECT COUNT(*) FROM inv_stock_mst s
            WHERE COALESCE(s.stk_isactive, true) = true
            """, nativeQuery = true)
    long countActiveStockRowsAll();

    @Query(value = """
            SELECT COUNT(*) FROM inv_stock_mst s
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
            FROM inv_stock_mst s
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
            FROM inv_stock_mst s
            WHERE COALESCE(s.stk_isactive, true) = true
              AND s.stk_location_id_loc IN (:locationIds)
            """, nativeQuery = true)
    List<Object[]> stockHealthByLocations(@Param("locationIds") Collection<Integer> locationIds);

    /** [0]=store label, [1]=sum qty */
    @Query(value = """
            SELECT COALESCE(l.loc_location_name, l.loc_location_code, CAST(s.stk_location_id_loc AS text)),
                   COALESCE(SUM(s.stk_current_qty), 0)
            FROM inv_stock_mst s
            LEFT JOIN org_location_mst l ON l.loc_location_id = s.stk_location_id_loc
            WHERE COALESCE(s.stk_isactive, true) = true
            GROUP BY s.stk_location_id_loc, l.loc_location_code, l.loc_location_name
            ORDER BY 2 DESC
            """, nativeQuery = true)
    List<Object[]> stockQtyByStoreAll();

    @Query(value = """
            SELECT COALESCE(l.loc_location_name, l.loc_location_code, CAST(s.stk_location_id_loc AS text)),
                   COALESCE(SUM(s.stk_current_qty), 0)
            FROM inv_stock_mst s
            LEFT JOIN org_location_mst l ON l.loc_location_id = s.stk_location_id_loc
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
            FROM inv_stock_mst s
            LEFT JOIN inv_item_mst i ON i.itm_item_id = s.stk_item_id_itm
            LEFT JOIN org_location_mst l ON l.loc_location_id = s.stk_location_id_loc
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
            FROM inv_stock_mst s
            LEFT JOIN inv_item_mst i ON i.itm_item_id = s.stk_item_id_itm
            LEFT JOIN org_location_mst l ON l.loc_location_id = s.stk_location_id_loc
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
            FROM inv_stock_mst s
            LEFT JOIN inv_item_mst i ON i.itm_item_id = s.stk_item_id_itm
            LEFT JOIN org_location_mst l ON l.loc_location_id = s.stk_location_id_loc
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
            FROM inv_stock_mst s
            LEFT JOIN inv_item_mst i ON i.itm_item_id = s.stk_item_id_itm
            LEFT JOIN org_location_mst l ON l.loc_location_id = s.stk_location_id_loc
            WHERE COALESCE(s.stk_isactive, true) = true
              AND s.stk_location_id_loc IN (:locationIds)
            ORDER BY COALESCE(s.stk_current_qty, 0) DESC, i.itm_item_name ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> stockTopRowsByLocations(@Param("locationIds") Collection<Integer> locationIds,
                                           @Param("limit") int limit);

    /**
     * Free (transferable) qty per item+location.
     * Excludes batches whose serial is currently allotted/issued, and asset batches
     * whose BLS custody is at a different location than the stock row.
     * Columns: itemId, locationId, qty
     */
    @Query(value = """
            SELECT s.stk_item_id_itm,
                   s.stk_location_id_loc,
                   COALESCE(SUM(
                     CASE
                       WHEN COALESCE(s.stk_available_qty, s.stk_current_qty, 0) <= 0 THEN 0
                       WHEN s.stk_batch_lot_no IS NULL OR TRIM(s.stk_batch_lot_no) = '' THEN
                         COALESCE(s.stk_available_qty, s.stk_current_qty, 0)
                       WHEN EXISTS (
                         SELECT 1 FROM inv_bls_mst b
                         WHERE b.ibm_item_id_itm = s.stk_item_id_itm
                           AND UPPER(TRIM(b.ibm_serial_no)) = UPPER(TRIM(s.stk_batch_lot_no))
                           AND COALESCE(b.ibm_isactive, true) = true
                           AND COALESCE(b.ibm_is_dummy, false) = false
                           AND b.ibm_issued_to_emp_id_emp IS NOT NULL
                       ) THEN 0
                       WHEN EXISTS (
                         SELECT 1 FROM inv_bls_mst b
                         WHERE b.ibm_item_id_itm = s.stk_item_id_itm
                           AND UPPER(TRIM(b.ibm_serial_no)) = UPPER(TRIM(s.stk_batch_lot_no))
                           AND COALESCE(b.ibm_isactive, true) = true
                           AND COALESCE(b.ibm_is_dummy, false) = false
                           AND b.ibm_current_location_id_loc IS DISTINCT FROM s.stk_location_id_loc
                       ) THEN 0
                       ELSE COALESCE(s.stk_available_qty, s.stk_current_qty, 0)
                     END
                   ), 0)
            FROM inv_stock_mst s
            WHERE COALESCE(s.stk_isactive, true) = true
              AND s.stk_location_id_loc IN (:locationIds)
            GROUP BY s.stk_item_id_itm, s.stk_location_id_loc
            HAVING COALESCE(SUM(
                     CASE
                       WHEN COALESCE(s.stk_available_qty, s.stk_current_qty, 0) <= 0 THEN 0
                       WHEN s.stk_batch_lot_no IS NULL OR TRIM(s.stk_batch_lot_no) = '' THEN
                         COALESCE(s.stk_available_qty, s.stk_current_qty, 0)
                       WHEN EXISTS (
                         SELECT 1 FROM inv_bls_mst b
                         WHERE b.ibm_item_id_itm = s.stk_item_id_itm
                           AND UPPER(TRIM(b.ibm_serial_no)) = UPPER(TRIM(s.stk_batch_lot_no))
                           AND COALESCE(b.ibm_isactive, true) = true
                           AND COALESCE(b.ibm_is_dummy, false) = false
                           AND b.ibm_issued_to_emp_id_emp IS NOT NULL
                       ) THEN 0
                       WHEN EXISTS (
                         SELECT 1 FROM inv_bls_mst b
                         WHERE b.ibm_item_id_itm = s.stk_item_id_itm
                           AND UPPER(TRIM(b.ibm_serial_no)) = UPPER(TRIM(s.stk_batch_lot_no))
                           AND COALESCE(b.ibm_isactive, true) = true
                           AND COALESCE(b.ibm_is_dummy, false) = false
                           AND b.ibm_current_location_id_loc IS DISTINCT FROM s.stk_location_id_loc
                       ) THEN 0
                       ELSE COALESCE(s.stk_available_qty, s.stk_current_qty, 0)
                     END
                   ), 0) > 0
            """, nativeQuery = true)
    List<Object[]> freeStockByLocations(@Param("locationIds") Collection<Integer> locationIds);
}
