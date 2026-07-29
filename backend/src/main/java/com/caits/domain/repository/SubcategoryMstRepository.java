package com.caits.domain.repository;

import com.caits.domain.entity.SubcategoryMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface SubcategoryMstRepository extends JpaRepository<SubcategoryMst, Integer>, JpaSpecificationExecutor<SubcategoryMst> {
    Optional<SubcategoryMst> findByScatSubcategoryCodeIgnoreCase(String code);
    boolean existsByScatSubcategoryCodeIgnoreCase(String code);
    List<SubcategoryMst> findByScatCategoryIdCat(Integer categoryId);
}
