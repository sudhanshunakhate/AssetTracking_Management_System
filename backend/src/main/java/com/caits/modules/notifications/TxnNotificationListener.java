package com.caits.modules.notifications;

import com.caits.modules.notifications.NotificationService.NotificationDraft;
import com.caits.modules.transactions.DocType;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class TxnNotificationListener {

    private final NotificationService notifications;

    public TxnNotificationListener(NotificationService notifications) {
        this.notifications = notifications;
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onTxnEvent(TxnLifecycleNotificationEvent event) {
        if (event == null || event.docType() == null) {
            return;
        }
        String menu = menuFor(event.docType());
        String url = urlFor(event.docType(), event.docId());
        String docLabel = event.docNo() == null ? event.docType().code() : event.docNo();
        Integer actor = event.actorUserId();

        switch (event.kind()) {
            case "INSPECTION_ASSIGNED" -> {
                NotificationDraft draft = new NotificationDraft(
                        "Inspection pending",
                        "GRN inspection " + docLabel + " is waiting for you.",
                        event.kind(),
                        "IAPR",
                        event.docType().code(),
                        event.docId(),
                        url
                );
                notifications.notifyEmployee(event.inspectorEmpId() != null ? event.inspectorEmpId() : event.initiatorEmpId(), draft, actor);
            }
            case "SUBMITTED" -> {
                String title = label(event.docType()) + " submitted";
                String body = docLabel + " is now " + (event.status() == null ? "submitted" : event.status()) + ".";
                boolean needApprove = "Pending Approval".equalsIgnoreCase(event.status());
                NotificationDraft draft = new NotificationDraft(
                        title, body, event.kind(), menu, event.docType().code(), event.docId(), url);
                notifications.notifyMenuViewers(menu, needApprove, draft, actor);
                if (event.docType() == DocType.MATERIAL_REQUISITION) {
                    notifications.notifyMenuViewers("ISS", false, new NotificationDraft(
                            "Store requisition to issue",
                            docLabel + " is ready for store issue.",
                            event.kind(),
                            "ISS",
                            event.docType().code(),
                            event.docId(),
                            "/transactions/issues/pick-requisition"
                    ), actor);
                }
            }
            case "APPROVED", "REJECTED" -> {
                String verb = "APPROVED".equals(event.kind()) ? "approved" : "rejected";
                NotificationDraft draft = new NotificationDraft(
                        label(event.docType()) + " " + verb,
                        docLabel + " was " + verb + ".",
                        event.kind(),
                        menu,
                        event.docType().code(),
                        event.docId(),
                        url
                );
                notifications.notifyEmployee(event.initiatorEmpId(), draft, actor);
            }
            default -> {
            }
        }
    }

    private static String menuFor(DocType docType) {
        return switch (docType) {
            case GRN -> "GRN";
            case GATEPASS_INWARD, GATEPASS_OUTWARD -> "GP";
            case MATERIAL_REQUISITION -> "SR";
            case MATERIAL_ISSUE -> "ISS";
            case OPENING_STOCK -> "OPN";
            case MATERIAL_TRANSFER -> "TRF";
            case MATERIAL_RETURN -> "RTN";
            case INSPECTION_APPROVAL -> "IAPR";
        };
    }

    private static String urlFor(DocType docType, Integer docId) {
        if (docId == null) {
            return "/dashboard";
        }
        return switch (docType) {
            case GRN -> "/transactions/grn/" + docId;
            case OPENING_STOCK -> "/transactions/opening-stock/" + docId;
            case MATERIAL_ISSUE -> "/transactions/issues/" + docId;
            case MATERIAL_TRANSFER -> "/transactions/transfers/" + docId;
            case MATERIAL_RETURN -> "/transactions/returns/" + docId;
            case MATERIAL_REQUISITION -> "/transactions/requisitions/" + docId;
            case INSPECTION_APPROVAL -> "/transactions/inspection-approvals/" + docId;
            case GATEPASS_INWARD, GATEPASS_OUTWARD -> "/transactions/gatepass";
        };
    }

    private static String label(DocType docType) {
        return switch (docType) {
            case GRN -> "GRN";
            case GATEPASS_INWARD -> "Inward gatepass";
            case GATEPASS_OUTWARD -> "Outward gatepass";
            case MATERIAL_REQUISITION -> "Store requisition";
            case MATERIAL_ISSUE -> "Store issue";
            case OPENING_STOCK -> "Opening stock";
            case MATERIAL_TRANSFER -> "Material transfer";
            case MATERIAL_RETURN -> "Material return";
            case INSPECTION_APPROVAL -> "Inspection";
        };
    }
}
