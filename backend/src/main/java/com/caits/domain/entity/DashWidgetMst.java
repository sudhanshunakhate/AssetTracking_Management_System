package com.caits.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "dash_widget_mst")
public class DashWidgetMst {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dshw_widget_id", nullable = false)
    private Integer dshwWidgetId;

    @Column(name = "dshw_widget_code", nullable = false, length = 40)
    private String dshwWidgetCode;

    @Column(name = "dshw_widget_type", nullable = false, length = 20)
    private String dshwWidgetType;

    @Column(name = "dshw_title", nullable = false, length = 120)
    private String dshwTitle;

    @Column(name = "dshw_subtitle", length = 200)
    private String dshwSubtitle;

    @Column(name = "dshw_icon", length = 40)
    private String dshwIcon;

    @Column(name = "dshw_tone", length = 20)
    private String dshwTone;

    @Column(name = "dshw_link_path", length = 200)
    private String dshwLinkPath;

    @Column(name = "dshw_required_menu_code", length = 20)
    private String dshwRequiredMenuCode;

    @Column(name = "dshw_default_col_span", nullable = false)
    private Integer dshwDefaultColSpan = 1;

    @Column(name = "dshw_default_sort", nullable = false)
    private Integer dshwDefaultSort = 100;

    @Column(name = "dshw_isactive", nullable = false)
    private Boolean dshwIsactive = true;

    @Column(name = "dshw_created_on", nullable = false)
    private LocalDateTime dshwCreatedOn;

    public Integer getDshwWidgetId() { return dshwWidgetId; }
    public void setDshwWidgetId(Integer dshwWidgetId) { this.dshwWidgetId = dshwWidgetId; }
    public String getDshwWidgetCode() { return dshwWidgetCode; }
    public void setDshwWidgetCode(String dshwWidgetCode) { this.dshwWidgetCode = dshwWidgetCode; }
    public String getDshwWidgetType() { return dshwWidgetType; }
    public void setDshwWidgetType(String dshwWidgetType) { this.dshwWidgetType = dshwWidgetType; }
    public String getDshwTitle() { return dshwTitle; }
    public void setDshwTitle(String dshwTitle) { this.dshwTitle = dshwTitle; }
    public String getDshwSubtitle() { return dshwSubtitle; }
    public void setDshwSubtitle(String dshwSubtitle) { this.dshwSubtitle = dshwSubtitle; }
    public String getDshwIcon() { return dshwIcon; }
    public void setDshwIcon(String dshwIcon) { this.dshwIcon = dshwIcon; }
    public String getDshwTone() { return dshwTone; }
    public void setDshwTone(String dshwTone) { this.dshwTone = dshwTone; }
    public String getDshwLinkPath() { return dshwLinkPath; }
    public void setDshwLinkPath(String dshwLinkPath) { this.dshwLinkPath = dshwLinkPath; }
    public String getDshwRequiredMenuCode() { return dshwRequiredMenuCode; }
    public void setDshwRequiredMenuCode(String dshwRequiredMenuCode) { this.dshwRequiredMenuCode = dshwRequiredMenuCode; }
    public Integer getDshwDefaultColSpan() { return dshwDefaultColSpan; }
    public void setDshwDefaultColSpan(Integer dshwDefaultColSpan) { this.dshwDefaultColSpan = dshwDefaultColSpan; }
    public Integer getDshwDefaultSort() { return dshwDefaultSort; }
    public void setDshwDefaultSort(Integer dshwDefaultSort) { this.dshwDefaultSort = dshwDefaultSort; }
    public Boolean getDshwIsactive() { return dshwIsactive; }
    public void setDshwIsactive(Boolean dshwIsactive) { this.dshwIsactive = dshwIsactive; }
    public LocalDateTime getDshwCreatedOn() { return dshwCreatedOn; }
    public void setDshwCreatedOn(LocalDateTime dshwCreatedOn) { this.dshwCreatedOn = dshwCreatedOn; }
}
