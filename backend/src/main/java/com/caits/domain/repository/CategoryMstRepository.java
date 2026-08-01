package com.caits.domain.repository;

import com.caits.domain.entity.CategoryMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface CategoryMstRepository extends JpaRepository<CategoryMst, Integer>, JpaSpecificationExecutor<CategoryMst> {
    Optional<CategoryMst> findByCatCategoryCodeIgnoreCase(String code);
    boolean existsByCatCategoryCodeIgnoreCase(String code);
}
