package com.caits.domain.repository;

import com.caits.domain.entity.TxnHeaderMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface TxnHeaderMstRepository extends JpaRepository<TxnHeaderMst, Integer>, JpaSpecificationExecutor<TxnHeaderMst> {
}
