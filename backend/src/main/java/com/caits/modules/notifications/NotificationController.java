package com.caits.modules.notifications;

import com.caits.common.PageResponse;
import com.caits.modules.notifications.NotificationService.PushSubscribeRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<NotificationDto> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "30") int pageSize) {
        return service.listMine(page, pageSize);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount() {
        return Map.of("count", service.unreadCount());
    }

    @GetMapping("/vapid-public-key")
    public Map<String, String> vapidPublicKey() {
        String key = service.vapidPublicKey();
        return Map.of("publicKey", key == null ? "" : key);
    }

    @PostMapping("/{id}/read")
    public void markRead(@PathVariable Integer id) {
        service.markRead(id);
    }

    @PostMapping("/read-all")
    public void markAllRead() {
        service.markAllRead();
    }

    @PostMapping("/push/subscribe")
    public void subscribe(@RequestBody PushSubscribeRequest body, @RequestHeader(value = HttpHeaders.USER_AGENT, required = false) String ua) {
        service.saveSubscription(body, ua);
    }

    @PostMapping("/push/unsubscribe")
    public void unsubscribe(@RequestBody Map<String, String> body) {
        service.deleteSubscription(body == null ? null : body.get("endpoint"));
    }

    @PostMapping("/push/test")
    public Map<String, String> testPush() {
        service.sendTestPush();
        return Map.of("message", "Test notification sent");
    }
}
