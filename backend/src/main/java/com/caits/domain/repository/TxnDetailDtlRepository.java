package com.caits.domain.repository;

import com.caits.domain.entity.TxnDetailDtl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface TxnDetailDtlRepository extends JpaRepository<TxnDetailDtl, Integer>, JpaSpecificationExecutor<TxnDetailDtl> {
    List<TxnDetailDtl> findByTxdTxnHeaderIdTxhOrderByTxdSrNoAsc(Integer headerId);

    List<TxnDetailDtl> findByTxdTxnHeaderIdTxhInOrderByTxdTxnHeaderIdTxhAscTxdSrNoAsc(Collection<Integer> headerIds);

    List<TxnDetailDtl> findByTxdIssuedToEmpIdEmp(Integer empId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    void deleteByTxdTxnHeaderIdTxh(Integer headerId);

    /** True when another document still points at this BLS (blocks inbound re-receipt of the same serial). */
    boolean existsByTxdBlsIdIbmAndTxdTxnHeaderIdTxhNot(Integer blsId, Integer headerId);

    /** Line counts for a page of headers, so the list grid avoids an N+1 lookup. */
    @Query("""
            select d.txdTxnHeaderIdTxh, count(d)
            from TxnDetailDtl d
            where d.txdTxnHeaderIdTxh in :headerIds
            group by d.txdTxnHeaderIdTxh
            """)
    List<Object[]> countLinesByHeaderIds(@Param("headerIds") Collection<Integer> headerIds);

    /**
     * Inbound GRN / Opening Stock party for physical units (BLS ids).
     * Rows: blsId, partyId, docDate, headerId.
     */
    @Query("""
            select d.txdBlsIdIbm, h.txhPartyIdVnd, h.txhDocDate, h.txhTxnHeaderId
            from TxnDetailDtl d, TxnHeaderMst h
            where d.txdTxnHeaderIdTxh = h.txhTxnHeaderId
              and d.txdBlsIdIbm in :blsIds
              and h.txhDocType in ('GRN', 'OPENING_STOCK')
              and h.txhPartyIdVnd is not null
            """)
    List<Object[]> findInboundPartiesByBlsIds(@Param("blsIds") Collection<Integer> blsIds);

    /**
     * Latest inbound GRN / Opening Stock party for an item at a store (consumables / fallback).
     * Rows: partyId, docDate, headerId.
     */
    @Query("""
            select h.txhPartyIdVnd, h.txhDocDate, h.txhTxnHeaderId
            from TxnDetailDtl d, TxnHeaderMst h
            where d.txdTxnHeaderIdTxh = h.txhTxnHeaderId
              and d.txdItemIdItm = :itemId
              and (d.txdLocationIdLoc = :locationId or h.txhLocationIdLoc = :locationId)
              and h.txhDocType in ('GRN', 'OPENING_STOCK')
              and h.txhPartyIdVnd is not null
            order by h.txhDocDate desc, h.txhTxnHeaderId desc
            """)
    List<Object[]> findInboundPartiesByItemAndLocation(
            @Param("itemId") Integer itemId,
            @Param("locationId") Integer locationId);
}
