package com.caits.domain.repository;

import com.caits.domain.entity.SysmUserFavouriteMenuDtl;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SysmUserFavouriteMenuDtlRepository extends JpaRepository<SysmUserFavouriteMenuDtl, Integer> {

    List<SysmUserFavouriteMenuDtl> findByUfavUserIdUsrOrderByUfavSortOrderAscUfavFavouriteIdAsc(Integer userId);

    void deleteByUfavUserIdUsr(Integer userId);
}
