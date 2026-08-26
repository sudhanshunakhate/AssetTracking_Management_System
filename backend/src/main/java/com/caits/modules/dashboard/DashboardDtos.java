package com.caits.modules.dashboard;

import java.util.List;
import java.util.Map;

public final class DashboardDtos {
    private DashboardDtos() {}

    public record HomeResponse(
            String roleCode,
            String roleName,
            String title,
            String description,
            List<WidgetDto> widgets
    ) {}

    public record WidgetDto(
            String code,
            String type,
            String title,
            String subtitle,
            String icon,
            String tone,
            String linkPath,
            int colSpan,
            int sortOrder,
            Map<String, Object> data
    ) {}

    public record ShortcutDto(String menuCode, String label, String path) {}
}
