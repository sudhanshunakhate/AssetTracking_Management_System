package com.caits.modules.notifications;

import com.caits.common.PageResponse;
import com.caits.domain.entity.NtfNotificationMst;
import com.caits.domain.entity.NtfPushSubscriptionDtl;
import com.caits.domain.entity.SysmUserloginMst;
import com.caits.domain.repository.NtfNotificationMstRepository;
import com.caits.domain.repository.NtfPushSubscriptionDtlRepository;
import com.caits.domain.repository.SysmUserloginMstRepository;
import com.caits.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class NotificationService {

    private final NtfNotificationMstRepository notificationRepo;
    private final NtfPushSubscriptionDtlRepository subscriptionRepo;
    private final SysmUserloginMstRepository userRepo;
    private final SimpMessagingTemplate messagingTemplate;
    private final WebPushService webPushService;

    public NotificationService(
            NtfNotificationMstRepository notificationRepo,
            NtfPushSubscriptionDtlRepository subscriptionRepo,
            SysmUserloginMstRepository userRepo,
            SimpMessagingTemplate messagingTemplate,
            WebPushService webPushService) {
        this.notificationRepo = notificationRepo;
        this.subscriptionRepo = subscriptionRepo;
        this.userRepo = userRepo;
        this.messagingTemplate = messagingTemplate;
        this.webPushService = webPushService;
    }

    public PageResponse<NotificationDto> listMine(int page, int pageSize) {
        Integer userId = SecurityUtils.requireCurrentUser().userId();
        int p = Math.max(page, 1);
        int size = Math.min(Math.max(pageSize, 1), 100);
        Page<NtfNotificationMst> result = notificationRepo.findByNtfUserIdUsrOrderByNtfCreatedOnDesc(
                userId, PageRequest.of(p - 1, size));
        return PageResponse.of(p, size, result.getTotalElements(),
                result.getContent().stream().map(this::toDto).toList());
    }

    public long unreadCount() {
        return notificationRepo.countByNtfUserIdUsrAndNtfIsReadFalse(SecurityUtils.requireCurrentUser().userId());
    }

    @Transactional
    public void markRead(Integer id) {
        Integer userId = SecurityUtils.requireCurrentUser().userId();
        notificationRepo.findByNtfNotificationIdAndNtfUserIdUsr(id, userId).ifPresent(n -> {
            n.setNtfIsRead(true);
            notificationRepo.save(n);
        });
    }

    @Transactional
    public void markAllRead() {
        notificationRepo.markAllRead(SecurityUtils.requireCurrentUser().userId());
    }

    public String vapidPublicKey() {
        return webPushService.publicKey();
    }

    public void sendTestPush() {
        webPushService.sendTestAsync(SecurityUtils.requireCurrentUser().userId());
    }

    @Transactional
    public void saveSubscription(PushSubscribeRequest req, String userAgent) {
        Integer userId = SecurityUtils.requireCurrentUser().userId();
        if (req == null || req.endpoint() == null || req.keys() == null) {
            return;
        }
        NtfPushSubscriptionDtl row = subscriptionRepo.findByNpsEndpoint(req.endpoint())
                .orElseGet(NtfPushSubscriptionDtl::new);
        boolean creating = row.getNpsSubscriptionId() == null;
        row.setNpsUserIdUsr(userId);
        row.setNpsEndpoint(req.endpoint());
        row.setNpsP256dh(req.keys().p256dh());
        row.setNpsAuth(req.keys().auth());
        row.setNpsUserAgent(userAgent);
        row.setNpsModifiedOn(LocalDateTime.now());
        if (creating) {
            row.setNpsCreatedOn(LocalDateTime.now());
        }
        subscriptionRepo.save(row);
        webPushService.sendTestAsync(userId);
    }

    @Transactional
    public void deleteSubscription(String endpoint) {
        Integer userId = SecurityUtils.requireCurrentUser().userId();
        if (endpoint != null && !endpoint.isBlank()) {
            subscriptionRepo.deleteByNpsEndpointAndNpsUserIdUsr(endpoint, userId);
        }
    }

    public void notifyMenuViewers(String menuCode, boolean needApprove, NotificationDraft draft, Integer excludeUserId) {
        List<Integer> userIds = userRepo.findActiveUserIdsWithMenuAccess(menuCode, needApprove);
        Set<Integer> unique = new HashSet<>(userIds);
        if (excludeUserId != null) {
            unique.remove(excludeUserId);
        }
        unique.forEach(id -> notifyUser(id, draft));
    }

    public void notifyEmployee(Integer employeeId, NotificationDraft draft, Integer excludeUserId) {
        if (employeeId == null) {
            return;
        }
        userRepo.findByUsrEmployeeIdEmp(employeeId).ifPresent(u -> {
            if (Boolean.TRUE.equals(u.getUsrIsactive())
                    && (excludeUserId == null || !excludeUserId.equals(u.getUsrUserId()))) {
                notifyUser(u.getUsrUserId(), draft);
            }
        });
    }

    public void notifyUser(Integer userId, NotificationDraft draft) {
        if (userId == null || draft == null) {
            return;
        }
        SysmUserloginMst user = userRepo.findById(userId).orElse(null);
        if (user == null || !Boolean.TRUE.equals(user.getUsrIsactive())) {
            return;
        }
        NtfNotificationMst row = new NtfNotificationMst();
        row.setNtfUserIdUsr(userId);
        row.setNtfTitle(draft.title());
        row.setNtfBody(draft.body());
        row.setNtfKind(draft.kind());
        row.setNtfMenuCode(draft.menuCode());
        row.setNtfDocType(draft.docType());
        row.setNtfDocId(draft.docId());
        row.setNtfLinkUrl(draft.linkUrl());
        row.setNtfIsRead(false);
        row.setNtfCreatedOn(LocalDateTime.now());
        NtfNotificationMst saved = notificationRepo.save(row);
        NotificationDto dto = toDto(saved);
        deliverAfterCommit(userId, dto);
    }

    private void deliverAfterCommit(Integer userId, NotificationDto dto) {
        Runnable send = () -> {
            messagingTemplate.convertAndSendToUser(String.valueOf(userId), "/queue/notifications", dto);
            webPushService.sendAsync(userId, dto);
        };
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    send.run();
                }
            });
        } else {
            send.run();
        }
    }

    private NotificationDto toDto(NtfNotificationMst n) {
        return new NotificationDto(
                n.getNtfNotificationId(),
                n.getNtfTitle(),
                n.getNtfBody(),
                n.getNtfKind(),
                n.getNtfMenuCode(),
                n.getNtfDocType(),
                n.getNtfDocId(),
                n.getNtfLinkUrl(),
                Boolean.TRUE.equals(n.getNtfIsRead()),
                n.getNtfCreatedOn()
        );
    }

    public record NotificationDraft(
            String title,
            String body,
            String kind,
            String menuCode,
            String docType,
            Integer docId,
            String linkUrl
    ) {}

    public record PushSubscribeRequest(String endpoint, PushKeys keys) {}

    public record PushKeys(String p256dh, String auth) {}
}
