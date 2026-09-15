package com.caits.common;

/** Shared page-size clamps for list APIs. */
public final class PageSizes {

    public static final int MASTER_MAX = 500;
    public static final int MASTER_DEFAULT = 20;

    private PageSizes() {}

    public static int clampMaster(int pageSize) {
        if (pageSize < 1) {
            return MASTER_DEFAULT;
        }
        return Math.min(pageSize, MASTER_MAX);
    }
}
