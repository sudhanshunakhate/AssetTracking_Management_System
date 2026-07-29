package com.caits.domain.repository;

import com.caits.domain.entity.InvStockMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface InvStockMstRepository extends JpaRepository<InvStockMst, Integer>, JpaSpecificationExecutor<InvStockMst> {
    Optional<InvStockMst> findFirstByStkItemIdItmAndStkLocationIdLoc(Integer itemId, Integer locationId);
}
