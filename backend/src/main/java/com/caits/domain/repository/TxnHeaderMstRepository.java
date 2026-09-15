package com.caits.domain.repository;

import com.caits.domain.entity.TxnHeaderMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface TxnHeaderMstRepository extends JpaRepository<TxnHeaderMst, Integer>, JpaSpecificationExecutor<TxnHeaderMst> {

    List<TxnHeaderMst> findByTxhAttachmentUrlContaining(String fragment);

    /** [0]=docType, [1]=count — full header population. */
    @Query(value = """
            SELECT COALESCE(h.txh_doc_type, 'OTHER'), COUNT(*)
            FROM txn_header_mst h
            GROUP BY h.txh_doc_type
            ORDER BY COUNT(*) DESC
            """, nativeQuery = true)
    List<Object[]> countByDocTypeAll();

    @Query(value = """
            SELECT COALESCE(h.txh_doc_type, 'OTHER'), COUNT(*)
            FROM txn_header_mst h
            WHERE h.txh_location_id_loc IN (:locationIds)
               OR h.txh_from_location_id_loc IN (:locationIds)
               OR h.txh_to_location_id_loc IN (:locationIds)
            GROUP BY h.txh_doc_type
            ORDER BY COUNT(*) DESC
            """, nativeQuery = true)
    List<Object[]> countByDocTypeByLocations(@Param("locationIds") Collection<Integer> locationIds);
}
