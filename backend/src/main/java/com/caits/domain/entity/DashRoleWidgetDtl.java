package com.caits.domain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "dash_role_widget_dtl")
public class DashRoleWidgetDtl {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dshr_id", nullable = false)
    private Integer dshrId;

    @Column(name = "dshr_role_id_rol", nullable = false)
    private Integer dshrRoleIdRol;

    @Column(name = "dshr_widget_id_dshw", nullable = false)
    private Integer dshrWidgetIdDshw;

    @Column(name = "dshr_sort_order", nullable = false)
    private Integer dshrSortOrder = 100;

    @Column(name = "dshr_col_span", nullable = false)
    private Integer dshrColSpan = 1;

    @Column(name = "dshr_is_visible", nullable = false)
    private Boolean dshrIsVisible = true;

    public Integer getDshrId() { return dshrId; }
    public void setDshrId(Integer dshrId) { this.dshrId = dshrId; }
    public Integer getDshrRoleIdRol() { return dshrRoleIdRol; }
    public void setDshrRoleIdRol(Integer dshrRoleIdRol) { this.dshrRoleIdRol = dshrRoleIdRol; }
    public Integer getDshrWidgetIdDshw() { return dshrWidgetIdDshw; }
    public void setDshrWidgetIdDshw(Integer dshrWidgetIdDshw) { this.dshrWidgetIdDshw = dshrWidgetIdDshw; }
    public Integer getDshrSortOrder() { return dshrSortOrder; }
    public void setDshrSortOrder(Integer dshrSortOrder) { this.dshrSortOrder = dshrSortOrder; }
    public Integer getDshrColSpan() { return dshrColSpan; }
    public void setDshrColSpan(Integer dshrColSpan) { this.dshrColSpan = dshrColSpan; }
    public Boolean getDshrIsVisible() { return dshrIsVisible; }
    public void setDshrIsVisible(Boolean dshrIsVisible) { this.dshrIsVisible = dshrIsVisible; }
}
