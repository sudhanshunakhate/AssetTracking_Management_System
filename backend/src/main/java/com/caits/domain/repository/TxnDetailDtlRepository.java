package com.caits.domain.repository;

import com.caits.domain.entity.TxnDetailDtl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;

import java.util.List;

public interface TxnDetailDtlRepository extends JpaRepository<TxnDetailDtl, Integer>, JpaSpecificationExecutor<TxnDetailDtl> {
    List<TxnDetailDtl> findByTxdTxnHeaderIdTxhOrderByTxdSrNoAsc(Integer headerId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    void deleteByTxdTxnHeaderIdTxh(Integer headerId);
}
