package com.caits.domain.repository;

import com.caits.domain.entity.InvItemLocationMappingDtl;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface InvItemLocationMappingDtlRepository extends JpaRepository<InvItemLocationMappingDtl, Integer> {
    List<InvItemLocationMappingDtl> findByIlimItemIdItm(Integer itemId);
    List<InvItemLocationMappingDtl> findByIlimItemIdItmIn(Collection<Integer> itemIds);
    void deleteByIlimItemIdItm(Integer itemId);
}
