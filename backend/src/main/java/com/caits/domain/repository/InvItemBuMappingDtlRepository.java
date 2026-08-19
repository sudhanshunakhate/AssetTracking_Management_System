package com.caits.domain.repository;

import com.caits.domain.entity.InvItemBuMappingDtl;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InvItemBuMappingDtlRepository extends JpaRepository<InvItemBuMappingDtl, Integer> {
    List<InvItemBuMappingDtl> findByIibmItemIdItm(Integer itemId);
    void deleteByIibmItemIdItm(Integer itemId);
}
