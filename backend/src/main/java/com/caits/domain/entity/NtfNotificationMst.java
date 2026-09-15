package com.caits.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ntf_notification_mst")
public class NtfNotificationMst {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ntf_notification_id", nullable = false)
    private Integer ntfNotificationId;

    @Column(name = "ntf_user_id_usr", nullable = false)
    private Integer ntfUserIdUsr;

    @Column(name = "ntf_title", nullable = false, length = 200)
    private String ntfTitle;

    @Column(name = "ntf_body", nullable = false, length = 1000)
    private String ntfBody;

    @Column(name = "ntf_kind", nullable = false, length = 40)
    private String ntfKind;

    @Column(name = "ntf_menu_code", length = 20)
    private String ntfMenuCode;

    @Column(name = "ntf_doc_type", length = 40)
    private String ntfDocType;

    @Column(name = "ntf_doc_id")
    private Integer ntfDocId;

    @Column(name = "ntf_link_url", length = 300)
    private String ntfLinkUrl;

    @Column(name = "ntf_is_read", nullable = false)
    private Boolean ntfIsRead = false;

    @Column(name = "ntf_created_on", nullable = false)
    private LocalDateTime ntfCreatedOn;

    public Integer getNtfNotificationId() { return ntfNotificationId; }
    public void setNtfNotificationId(Integer ntfNotificationId) { this.ntfNotificationId = ntfNotificationId; }

    public Integer getNtfUserIdUsr() { return ntfUserIdUsr; }
    public void setNtfUserIdUsr(Integer ntfUserIdUsr) { this.ntfUserIdUsr = ntfUserIdUsr; }

    public String getNtfTitle() { return ntfTitle; }
    public void setNtfTitle(String ntfTitle) { this.ntfTitle = ntfTitle; }

    public String getNtfBody() { return ntfBody; }
    public void setNtfBody(String ntfBody) { this.ntfBody = ntfBody; }

    public String getNtfKind() { return ntfKind; }
    public void setNtfKind(String ntfKind) { this.ntfKind = ntfKind; }

    public String getNtfMenuCode() { return ntfMenuCode; }
    public void setNtfMenuCode(String ntfMenuCode) { this.ntfMenuCode = ntfMenuCode; }

    public String getNtfDocType() { return ntfDocType; }
    public void setNtfDocType(String ntfDocType) { this.ntfDocType = ntfDocType; }

    public Integer getNtfDocId() { return ntfDocId; }
    public void setNtfDocId(Integer ntfDocId) { this.ntfDocId = ntfDocId; }

    public String getNtfLinkUrl() { return ntfLinkUrl; }
    public void setNtfLinkUrl(String ntfLinkUrl) { this.ntfLinkUrl = ntfLinkUrl; }

    public Boolean getNtfIsRead() { return ntfIsRead; }
    public void setNtfIsRead(Boolean ntfIsRead) { this.ntfIsRead = ntfIsRead; }

    public LocalDateTime getNtfCreatedOn() { return ntfCreatedOn; }
    public void setNtfCreatedOn(LocalDateTime ntfCreatedOn) { this.ntfCreatedOn = ntfCreatedOn; }
}
