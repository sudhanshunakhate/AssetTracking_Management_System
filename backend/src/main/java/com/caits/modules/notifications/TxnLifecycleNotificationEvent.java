package com.caits.modules.notifications;

import com.caits.modules.transactions.DocType;

public record TxnLifecycleNotificationEvent(
        String kind,
        DocType docType,
        Integer docId,
        String docNo,
        String status,
        Integer inspectorEmpId,
        Integer initiatorEmpId,
        Integer actorUserId
) {}
