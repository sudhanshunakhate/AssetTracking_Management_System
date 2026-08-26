package com.caits.domain.repository;

import com.caits.domain.entity.NtfNotificationMst;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface NtfNotificationMstRepository extends JpaRepository<NtfNotificationMst, Integer> {
    Page<NtfNotificationMst> findByNtfUserIdUsrOrderByNtfCreatedOnDesc(Integer userId, Pageable pageable);

    long countByNtfUserIdUsrAndNtfIsReadFalse(Integer userId);

    Optional<NtfNotificationMst> findByNtfNotificationIdAndNtfUserIdUsr(Integer id, Integer userId);

    @Modifying
    @Query("update NtfNotificationMst n set n.ntfIsRead = true where n.ntfUserIdUsr = :userId and n.ntfIsRead = false")
    int markAllRead(@Param("userId") Integer userId);
}
