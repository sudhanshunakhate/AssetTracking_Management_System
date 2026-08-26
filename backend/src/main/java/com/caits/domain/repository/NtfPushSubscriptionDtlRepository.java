package com.caits.domain.repository;

import com.caits.domain.entity.NtfPushSubscriptionDtl;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NtfPushSubscriptionDtlRepository extends JpaRepository<NtfPushSubscriptionDtl, Integer> {
    List<NtfPushSubscriptionDtl> findByNpsUserIdUsr(Integer userId);
    Optional<NtfPushSubscriptionDtl> findByNpsEndpoint(String endpoint);
    void deleteByNpsEndpointAndNpsUserIdUsr(String endpoint, Integer userId);
}
