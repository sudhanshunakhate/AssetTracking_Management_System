package com.caits.common;

import java.util.List;

public record PageResponse<T>(
        int page,
        int pageSize,
        long totalRecords,
        List<T> data
) {
    public static <T> PageResponse<T> of(int page, int pageSize, long total, List<T> data) {
        return new PageResponse<>(page, pageSize, total, data);
    }
}
