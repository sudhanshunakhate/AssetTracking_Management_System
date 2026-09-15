package com.caits.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ntf_push_subscription_dtl")
public class NtfPushSubscriptionDtl {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "nps_subscription_id", nullable = false)
    private Integer npsSubscriptionId;

    @Column(name = "nps_user_id_usr", nullable = false)
    private Integer npsUserIdUsr;

    @Column(name = "nps_endpoint", nullable = false)
    private String npsEndpoint;

    @Convert(converter = com.caits.security.EncryptedStringConverter.class)
    @Column(name = "nps_p256dh", nullable = false, columnDefinition = "text")
    private String npsP256dh;

    @Convert(converter = com.caits.security.EncryptedStringConverter.class)
    @Column(name = "nps_auth", nullable = false, columnDefinition = "text")
    private String npsAuth;

    @Column(name = "nps_user_agent", length = 400)
    private String npsUserAgent;

    @Column(name = "nps_created_on", nullable = false)
    private LocalDateTime npsCreatedOn;

    @Column(name = "nps_modified_on", nullable = false)
    private LocalDateTime npsModifiedOn;

    public Integer getNpsSubscriptionId() { return npsSubscriptionId; }
    public void setNpsSubscriptionId(Integer npsSubscriptionId) { this.npsSubscriptionId = npsSubscriptionId; }

    public Integer getNpsUserIdUsr() { return npsUserIdUsr; }
    public void setNpsUserIdUsr(Integer npsUserIdUsr) { this.npsUserIdUsr = npsUserIdUsr; }

    public String getNpsEndpoint() { return npsEndpoint; }
    public void setNpsEndpoint(String npsEndpoint) { this.npsEndpoint = npsEndpoint; }

    public String getNpsP256dh() { return npsP256dh; }
    public void setNpsP256dh(String npsP256dh) { this.npsP256dh = npsP256dh; }

    public String getNpsAuth() { return npsAuth; }
    public void setNpsAuth(String npsAuth) { this.npsAuth = npsAuth; }

    public String getNpsUserAgent() { return npsUserAgent; }
    public void setNpsUserAgent(String npsUserAgent) { this.npsUserAgent = npsUserAgent; }

    public LocalDateTime getNpsCreatedOn() { return npsCreatedOn; }
    public void setNpsCreatedOn(LocalDateTime npsCreatedOn) { this.npsCreatedOn = npsCreatedOn; }

    public LocalDateTime getNpsModifiedOn() { return npsModifiedOn; }
    public void setNpsModifiedOn(LocalDateTime npsModifiedOn) { this.npsModifiedOn = npsModifiedOn; }
}
