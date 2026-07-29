package com.caits.domain.repository;

import com.caits.domain.entity.InvItemMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface InvItemMstRepository extends JpaRepository<InvItemMst, Integer>, JpaSpecificationExecutor<InvItemMst> {
    Optional<InvItemMst> findByItmItemCodeIgnoreCase(String code);
    boolean existsByItmItemCodeIgnoreCase(String code);
}
