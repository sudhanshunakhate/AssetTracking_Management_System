package com.caits.domain.repository;

import com.caits.domain.entity.DashWidgetMst;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DashWidgetMstRepository extends JpaRepository<DashWidgetMst, Integer> {
    List<DashWidgetMst> findByDshwIsactiveTrueOrderByDshwDefaultSortAsc();
}
