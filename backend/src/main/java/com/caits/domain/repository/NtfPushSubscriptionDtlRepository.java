package com.caits.domain.repository;

import com.caits.domain.entity.NtfPushSubscriptionDtl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface NtfPushSubscriptionDtlRepository extends JpaRepository<NtfPushSubscriptionDtl, Integer> {
    List<NtfPushSubscriptionDtl> findByNpsUserIdUsr(Integer userId);
    Optional<NtfPushSubscriptionDtl> findByNpsEndpoint(String endpoint);
    void deleteByNpsEndpointAndNpsUserIdUsr(String endpoint, Integer userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            INSERT INTO ntf_push_subscription_dtl (
                nps_user_id_usr, nps_endpoint, nps_p256dh, nps_auth, nps_user_agent, nps_created_on, nps_modified_on
            ) VALUES (
                :userId, :endpoint, :p256dh, :auth, :userAgent, :now, :now
            )
            ON CONFLICT (nps_endpoint) DO UPDATE SET
                nps_user_id_usr = EXCLUDED.nps_user_id_usr,
                nps_p256dh = EXCLUDED.nps_p256dh,
                nps_auth = EXCLUDED.nps_auth,
                nps_user_agent = EXCLUDED.nps_user_agent,
                nps_modified_on = EXCLUDED.nps_modified_on
            """, nativeQuery = true)
    int upsertByEndpoint(
            @Param("userId") Integer userId,
            @Param("endpoint") String endpoint,
            @Param("p256dh") String p256dh,
            @Param("auth") String auth,
            @Param("userAgent") String userAgent,
            @Param("now") LocalDateTime now);
}
