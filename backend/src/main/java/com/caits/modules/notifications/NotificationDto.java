package com.caits.modules.notifications;

import java.time.LocalDateTime;

public record NotificationDto(
        Integer id,
        String title,
        String body,
        String kind,
        String menuCode,
        String docType,
        Integer docId,
        String linkUrl,
        boolean read,
        LocalDateTime createdOn
) {}
