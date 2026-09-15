package com.caits.config;

import com.caits.domain.entity.*;
import com.caits.domain.repository.*;
import com.caits.modules.masters.SystemLocationRole;
import com.caits.modules.masters.SystemLocationService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Seeds minimal bootstrap data:
 * - Admin login graph when no users exist
 * - Full menu tree when menus are empty
 * - ADMIN role ↔ menu permissions when ADMIN has none
 *
 * Does not create sample masters / transactions.
 */
@Component
public class DataSeeder implements ApplicationRunner {

    private final SysmUserloginMstRepository userRepo;
    private final SysmRolesMstRepository roleRepo;
    private final OrgEntityMstRepository entityRepo;
    private final HrcEmployeeMstRepository employeeRepo;
    private final SysmMenutreeMstRepository menuRepo;
    private final SysmRolepermissionDtlRepository rolePermRepo;
    private final GentypeMstRepository gentypeRepo;
    private final GenmasterMstRepository genmasterRepo;
    private final HrcDepartmentMstRepository departmentRepo;
    private final DashWidgetMstRepository widgetRepo;
    private final DashRoleWidgetDtlRepository roleWidgetRepo;
    private final SystemLocationService systemLocationService;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            SysmUserloginMstRepository userRepo,
            SysmRolesMstRepository roleRepo,
            OrgEntityMstRepository entityRepo,
            HrcEmployeeMstRepository employeeRepo,
            SysmMenutreeMstRepository menuRepo,
            SysmRolepermissionDtlRepository rolePermRepo,
            GentypeMstRepository gentypeRepo,
            GenmasterMstRepository genmasterRepo,
            HrcDepartmentMstRepository departmentRepo,
            DashWidgetMstRepository widgetRepo,
            DashRoleWidgetDtlRepository roleWidgetRepo,
            SystemLocationService systemLocationService,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.entityRepo = entityRepo;
        this.employeeRepo = employeeRepo;
        this.menuRepo = menuRepo;
        this.rolePermRepo = rolePermRepo;
        this.gentypeRepo = gentypeRepo;
        this.genmasterRepo = genmasterRepo;
        this.departmentRepo = departmentRepo;
        this.widgetRepo = widgetRepo;
        this.roleWidgetRepo = roleWidgetRepo;
        this.systemLocationService = systemLocationService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedAdminGraphIfEmpty();
        seedMenusIfEmpty();
        seedAdminMenuPermissionsIfEmpty();
        seedDepartmentsIfEmpty();
        seedDashboardWidgetsIfNeeded();
        ensureSystemUserFlags();
        seedLookupIfMissing("GTY-DESIG", "Designation", "Employee designations", DESIGNATIONS);
    }

    private void seedDepartmentsIfEmpty() {
        if (departmentRepo.count() > 0) return;
        Integer entityId = entityRepo.findAll().stream()
                .filter(e -> Boolean.TRUE.equals(e.getEntIsactive()))
                .map(OrgEntityMst::getEntEntityId)
                .findFirst()
                .orElse(null);
        if (entityId == null) return;

        // dept_location_id_loc is NOT NULL — ensure MAIN_STORE (and other system locs) exist first.
        systemLocationService.ensureForEntity(entityId);
        Integer mainStoreId = systemLocationService
                .requireSystemLocationForEntity(entityId, SystemLocationRole.MAIN_STORE)
                .getLocLocationId();

        LocalDateTime now = LocalDateTime.now();
        for (String[] row : DEPARTMENT_SEED) {
            HrcDepartmentMst d = new HrcDepartmentMst();
            d.setDeptDepartmentCode(row[0]);
            d.setDeptDepartmentName(row[1]);
            d.setDeptEntityIdEnt(entityId);
            d.setDeptLocationIdLoc(mainStoreId);
            d.setDeptIsactive(true);
            d.setDeptCreatedBy("system");
            d.setDeptCreatedOn(now);
            departmentRepo.save(d);
        }
    }

    private static final List<String[]> DEPARTMENT_SEED = List.of(
            new String[]{"DEPT-IT", "IT"},
            new String[]{"DEPT-STORES", "Stores"},
            new String[]{"DEPT-OPS", "Operations"},
            new String[]{"DEPT-ADMIN", "Admin"},
            new String[]{"DEPT-FIN", "Finance"},
            new String[]{"DEPT-HR", "HR"},
            new String[]{"DEPT-MAINT", "Maintenance"},
            new String[]{"DEPT-PROD", "Production"}
    );

    private static final List<String[]> DESIGNATIONS = List.of(
            new String[]{"DESIG-SYSADMIN", "System Administrator"},
            new String[]{"DESIG-STRMGR", "Store Manager"},
            new String[]{"DESIG-ASSETMGR", "Asset Manager"},
            new String[]{"DESIG-SUPVR", "Supervisor"},
            new String[]{"DESIG-STRKEEP", "Store Keeper"},
            new String[]{"DESIG-MGR", "Manager"},
            new String[]{"DESIG-EXEC", "Executive"},
            new String[]{"DESIG-OFFICER", "Officer"}
    );

    /**
     * Creates the general type and its values when the type does not exist yet.
     * Existing types are left untouched so operator edits survive a restart.
     */
    private void seedLookupIfMissing(String typeCode, String typeName, String desc, List<String[]> values) {
        if (gentypeRepo.findByGtypTypeCodeIgnoreCase(typeCode).isPresent()) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();

        GentypeMst type = new GentypeMst();
        type.setGtypTypeCode(typeCode);
        type.setGtypTypeName(typeName);
        type.setGtypDesc(desc);
        type.setGtypIsactive(true);
        type.setGtypCreatedBy("system");
        type.setGtypCreatedOn(now);
        type = gentypeRepo.save(type);

        int sort = 1;
        for (String[] v : values) {
            GenmasterMst m = new GenmasterMst();
            m.setGmstValueCode(v[0]);
            m.setGmstValueName(v[1]);
            m.setGmstGentypeIdGtyp(type.getGtypGentypeId());
            m.setGmstSortOrder(sort++);
            m.setGmstIsactive(true);
            m.setGmstCreatedBy("system");
            m.setGmstCreatedOn(now);
            genmasterRepo.save(m);
        }
    }

    private void seedAdminGraphIfEmpty() {
        if (userRepo.count() > 0) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();

        SysmRolesMst role = roleRepo.findByRolRoleCodeIgnoreCase("ADMIN").orElseGet(() -> {
            SysmRolesMst r = new SysmRolesMst();
            r.setRolRoleCode("ADMIN");
            r.setRolRoleName("Administrator");
            r.setRolDesc("System administrator");
            r.setRolIsSystemRole(true);
            r.setRolIsactive(true);
            r.setRolCreatedBy("system");
            r.setRolCreatedOn(now);
            return roleRepo.save(r);
        });

        OrgEntityMst entity = new OrgEntityMst();
        entity.setEntEntityCode("DEFAULT");
        entity.setEntEntityName("Default Organization");
        entity.setEntShortName("DEFAULT");
        entity.setEntIsactive(true);
        entity.setEntCreatedBy("system");
        entity.setEntCreatedOn(now);
        entity = entityRepo.save(entity);

        seedDepartmentsIfEmpty();
        Integer itDeptId = departmentRepo.findByDeptDepartmentCodeIgnoreCase("DEPT-IT")
                .map(HrcDepartmentMst::getDeptDepartmentId)
                .orElse(null);

        HrcEmployeeMst emp = new HrcEmployeeMst();
        emp.setEmpEmployeeCode("ADMIN");
        emp.setEmpFirstName("System");
        emp.setEmpLastName("Admin");
        emp.setEmpEmail("admin@caits.local");
        emp.setEmpDesignation("Administrator");
        emp.setEmpDepartmentIdDept(itDeptId);
        emp.setEmpRoleIdRol(role.getRolRoleId());
        emp.setEmpIsactive(true);
        emp.setEmpIsSystemEmployee(true);
        emp.setEmpCreatedBy("system");
        emp.setEmpCreatedOn(now);
        emp = employeeRepo.save(emp);

        SysmUserloginMst user = new SysmUserloginMst();
        user.setUsrEmployeeIdEmp(emp.getEmpEmployeeId());
        user.setUsrLoginId("admin");
        user.setUsrPasswordHash(passwordEncoder.encode("micropro123"));
        user.setUsrRoleIdRol(role.getRolRoleId());
        user.setUsrAccountStatus("Active");
        user.setUsrEntityIdEnt(entity.getEntEntityId());
        user.setUsrBuAccessScope("ALL");
        user.setUsrLocationAccessScope("ALL");
        user.setUsrForcePasswordReset(false);
        user.setUsrIsactive(true);
        user.setUsrIsSystemUser(true);
        user.setUsrFailedAttempts(0);
        user.setUsrCreatedBy("system");
        user.setUsrCreatedOn(now);
        userRepo.save(user);
    }

    /** Marks the bootstrap admin login/employee as hidden system records on existing databases. */
    private void ensureSystemUserFlags() {
        userRepo.findByUsrLoginIdIgnoreCase("admin").ifPresent(user -> {
            if (!Boolean.TRUE.equals(user.getUsrIsSystemUser())) {
                user.setUsrIsSystemUser(true);
                userRepo.save(user);
            }
            if (user.getUsrEmployeeIdEmp() != null) {
                employeeRepo.findById(user.getUsrEmployeeIdEmp()).ifPresent(emp -> {
                    if (!Boolean.TRUE.equals(emp.getEmpIsSystemEmployee())) {
                        emp.setEmpIsSystemEmployee(true);
                        employeeRepo.save(emp);
                    }
                });
            }
        });
    }

    private void seedMenusIfEmpty() {
        if (menuRepo.count() > 0) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        List<MenuDef> defs = menuDefinitions();
        for (MenuDef d : defs) {
            SysmMenutreeMst m = new SysmMenutreeMst();
            m.setMtreeMenuCode(d.code());
            m.setMtreeMenuLabel(d.label());
            m.setMtreeMenuGroup(d.group());
            m.setMtreeSortOrder(d.sort());
            m.setMtreeGroupSortOrder(groupSortFor(d.group()));
            m.setMtreeIcon(d.icon());
            m.setMtreeDocType(d.docType());
            m.setMtreeSupportsView(d.view());
            m.setMtreeSupportsCreate(d.create());
            m.setMtreeSupportsEdit(d.edit());
            m.setMtreeSupportsDelete(d.delete());
            m.setMtreeSupportsApprove(d.approve());
            m.setMtreeSupportsReject(d.reject());
            m.setMtreeSupportsPrint(d.print());
            m.setMtreeSupportsExport(d.export());
            m.setMtreeIsSystemMenu(true);
            m.setMtreeIsactive(true);
            m.setMtreeCreatedBy("system");
            m.setMtreeCreatedOn(now);
            menuRepo.save(m);
        }
    }

    private void seedAdminMenuPermissionsIfEmpty() {
        SysmRolesMst admin = roleRepo.findByRolRoleCodeIgnoreCase("ADMIN").orElse(null);
        if (admin == null) {
            return;
        }
        if (!rolePermRepo.findByRlpmRoleIdRol(admin.getRolRoleId()).isEmpty()) {
            return;
        }
        for (SysmMenutreeMst menu : menuRepo.findAll()) {
            if (!Boolean.TRUE.equals(menu.getMtreeIsactive())) {
                continue;
            }
            SysmRolepermissionDtl p = new SysmRolepermissionDtl();
            p.setRlpmRoleIdRol(admin.getRolRoleId());
            p.setRlpmMenuIdMtree(menu.getMtreeMenuId());
            p.setRlpmCanView(true);
            p.setRlpmCanCreate(Boolean.TRUE.equals(menu.getMtreeSupportsCreate()));
            p.setRlpmCanEdit(Boolean.TRUE.equals(menu.getMtreeSupportsEdit()));
            p.setRlpmCanDelete(Boolean.TRUE.equals(menu.getMtreeSupportsDelete()));
            p.setRlpmCanApprove(Boolean.TRUE.equals(menu.getMtreeSupportsApprove()));
            p.setRlpmCanReject(Boolean.TRUE.equals(menu.getMtreeSupportsReject()));
            p.setRlpmCanPrint(Boolean.TRUE.equals(menu.getMtreeSupportsPrint()));
            p.setRlpmCanExport(Boolean.TRUE.equals(menu.getMtreeSupportsExport()));
            rolePermRepo.save(p);
        }
    }

    /** Ensure dashboard catalog + ADMIN layout exist (empty deploys otherwise show a blank home). */
    private void seedDashboardWidgetsIfNeeded() {
        LocalDateTime now = LocalDateTime.now();
        for (WidgetDef def : WIDGET_SEED) {
            DashWidgetMst w = widgetRepo.findByDshwWidgetCodeIgnoreCase(def.code()).orElseGet(DashWidgetMst::new);
            boolean isNew = w.getDshwWidgetId() == null;
            w.setDshwWidgetCode(def.code());
            w.setDshwWidgetType(def.type());
            w.setDshwTitle(def.title());
            w.setDshwSubtitle(def.subtitle());
            w.setDshwIcon(def.icon());
            w.setDshwTone(def.tone());
            w.setDshwLinkPath(def.linkPath());
            w.setDshwRequiredMenuCode(def.requiredMenu());
            w.setDshwDefaultColSpan(def.colSpan());
            w.setDshwDefaultSort(def.sort());
            w.setDshwIsactive(true);
            if (isNew) w.setDshwCreatedOn(now);
            widgetRepo.save(w);
        }

        SysmRolesMst admin = roleRepo.findByRolRoleCodeIgnoreCase("ADMIN").orElse(null);
        if (admin == null) return;
        if (roleWidgetRepo.countByDshrRoleIdRolAndDshrIsVisibleTrue(admin.getRolRoleId()) > 0) return;

        for (AdminWidgetLayout row : ADMIN_WIDGET_LAYOUT) {
            DashWidgetMst w = widgetRepo.findByDshwWidgetCodeIgnoreCase(row.code()).orElse(null);
            if (w == null) continue;
            DashRoleWidgetDtl map = new DashRoleWidgetDtl();
            map.setDshrRoleIdRol(admin.getRolRoleId());
            map.setDshrWidgetIdDshw(w.getDshwWidgetId());
            map.setDshrSortOrder(row.sort());
            map.setDshrColSpan(row.colSpan());
            map.setDshrIsVisible(true);
            roleWidgetRepo.save(map);
        }
    }

    private static int groupSortFor(String group) {
        if (group == null) return 9;
        return switch (group) {
            case "Master Setup" -> 1;
            case "Organization" -> 2;
            case "Access & People" -> 3;
            case "Transactions" -> 4;
            case "Reports" -> 5;
            default -> 9;
        };
    }

    private record MenuDef(
            String code, String label, String group, int sort, String icon, String docType,
            boolean view, boolean create, boolean edit, boolean delete,
            boolean approve, boolean reject, boolean print, boolean export
    ) {}

    private static List<MenuDef> menuDefinitions() {
        return List.of(
                master("UOM", "Unit Master", 11),
                master("AIM", "Item Master", 12),
                master("ICM", "Inventory Category", 13),
                master("ISC", "Inventory Sub-Category", 14),
                master("GTY", "General Type", 15),
                master("GNM", "General Master", 16),
                master("VPM", "Vendor / Party", 17),
                master("ORG", "Organization (Entity)", 21, "Organization"),
                master("OU", "Operating Unit", 22, "Organization"),
                master("STR", "Location", 23, "Organization"),
                master("ARM", "Role & Menu Mapping", 31, "Access & People"),
                master("EMP", "Employee", 32, "Access & People"),
                master("USR", "User Access Mapping", 33, "Access & People"),
                new MenuDef("MNU", "Menu Access", "Access & People", 34, "MNU", null,
                        true, true, true, false, false, false, false, true),
                master("UAE", "User Access Exception", 35, "Access & People"),
                master("DEPM", "Department", 36, "Access & People"),
                txn("OPN", "Opening Stock", 41, "OPENING_STOCK", false, false),
                txn("SR", "Store Requisitions", 42, "MATERIAL_REQUISITION", false, false),
                txn("GRN", "Goods Receipt Note", 43, "GRN", true, true),
                txn("GP", "Gatepass", 44, null, true, false),
                txn("ISS", "Store Issue", 45, "MATERIAL_ISSUE", false, false),
                txn("TRF", "Material Transfer", 46, "MATERIAL_TRANSFER", false, false),
                txn("RTN", "Material Return", 47, "MATERIAL_RETURN", false, false),
                txn("IAPR", "Inspection Approval", 48, "INSPECTION_APPROVAL", true, false),
                new MenuDef("DASH", "Dashboard", "Reports", 51, null, null,
                        true, false, false, false, false, false, false, true),
                new MenuDef("STKREG", "Stock Register", "Reports", 52, null, null,
                        true, false, false, false, false, false, false, true),
                new MenuDef("FULLRPT", "Log Report", "Reports", 53, null, null,
                        true, false, false, false, false, false, false, true),
                new MenuDef("STKOWN", "Stock Owner Report", "Reports", 54, null, null,
                        true, false, false, false, false, false, false, true),
                new MenuDef("STKMOV", "Stock Movement Report", "Reports", 55, null, null,
                        true, false, false, false, false, false, false, true),
                new MenuDef("ITEMREG", "Item Register", "Reports", 56, null, null,
                        true, false, false, false, false, false, false, true)
        );
    }

    private static MenuDef master(String code, String label, int sort) {
        return master(code, label, sort, "Master Setup");
    }

    private static MenuDef master(String code, String label, int sort, String group) {
        return new MenuDef(code, label, group, sort, code, null,
                true, true, true, true, false, false, false, true);
    }

    private static MenuDef txn(String code, String label, int sort, String docType,
                               boolean approve, boolean reject) {
        return new MenuDef(code, label, "Transactions", sort, code, docType,
                true, true, true, true, approve, reject, true, true);
    }

    private record WidgetDef(
            String code, String type, String title, String subtitle,
            String icon, String tone, String linkPath, String requiredMenu,
            int colSpan, int sort
    ) {}

    private record AdminWidgetLayout(String code, int sort, int colSpan) {}

    private static final List<WidgetDef> WIDGET_SEED = List.of(
            new WidgetDef("KPI_ITEMS", "KPI", "Total Items", "Open item master", "itemMaster", "sky",
                    "/masters/items", "AIM", 1, 10),
            new WidgetDef("KPI_VENDORS", "KPI", "Vendors", "Open vendor master", "vendorParty", "blue",
                    "/masters/vendors", "VPM", 1, 20),
            new WidgetDef("KPI_TXNS", "KPI", "Transactions", "Full document trail", "materialTransfer", "warm",
                    "/reports/full-report", "FULLRPT", 1, 30),
            new WidgetDef("KPI_LOW_STOCK", "KPI", "Low Stock", "Needs reorder attention", "lowStockAlert", "danger",
                    "/reports/stock-register", "STKREG", 1, 40),
            new WidgetDef("KPI_STOCK_ROWS", "KPI", "Stock Rows", "Stock register positions", "storeWiseStock", "success",
                    "/reports/stock-register", "STKREG", 1, 50),
            new WidgetDef("KPI_PENDING_IAPR", "KPI", "Pending Inspections", "Awaiting inspection approval", "storeIssue", "warm",
                    "/transactions/inspection-approvals", "IAPR", 1, 55),
            new WidgetDef("KPI_PENDING_SR", "KPI", "Open Requisitions", "Requested — ready to issue", "storeRequisitions", "sky",
                    "/transactions/issues/pick-requisition", "ISS", 1, 56),
            new WidgetDef("ALERT_LOW_STOCK", "ALERT", "Low stock alert", "Items at or below reorder", "lowStockAlert", "warm",
                    "/reports/stock-register", "STKREG", 12, 5),
            new WidgetDef("CHART_STOCK_BY_STORE", "CHART", "Stock by store", "Who holds the most on-hand quantity", "storeWiseStock", null,
                    "/reports/stock-register", "STKREG", 7, 100),
            new WidgetDef("CHART_DOC_BY_TYPE", "CHART", "Documents by type", "Document mix across types", "fullReport", null,
                    "/reports/full-report", "FULLRPT", 5, 110),
            new WidgetDef("PANEL_STOCK_HEALTH", "PANEL", "Stock health", "How positions split across status", "stockRegister", null,
                    "/reports/stock-register", "STKREG", 4, 200),
            new WidgetDef("LIST_STOCK_FOCUS", "LIST", "Stock focus", "Top or low stock positions", "lowStockAlert", null,
                    "/reports/stock-register", "STKREG", 4, 210),
            new WidgetDef("LIST_RECENT_ACTIVITY", "LIST", "Recent activity", "Latest document lines", "materialTransfer", null,
                    "/reports/full-report", "FULLRPT", 4, 220),
            new WidgetDef("SHORTCUTS_TXN", "SHORTCUTS", "Quick actions", "Jump to transactions you can use", "dashboard", null,
                    null, null, 12, 300)
    );

    private static final List<AdminWidgetLayout> ADMIN_WIDGET_LAYOUT = List.of(
            new AdminWidgetLayout("ALERT_LOW_STOCK", 5, 12),
            new AdminWidgetLayout("KPI_ITEMS", 10, 1),
            new AdminWidgetLayout("KPI_VENDORS", 20, 1),
            new AdminWidgetLayout("KPI_TXNS", 30, 1),
            new AdminWidgetLayout("KPI_LOW_STOCK", 40, 1),
            new AdminWidgetLayout("KPI_STOCK_ROWS", 50, 1),
            new AdminWidgetLayout("KPI_PENDING_IAPR", 55, 1),
            new AdminWidgetLayout("CHART_STOCK_BY_STORE", 100, 7),
            new AdminWidgetLayout("CHART_DOC_BY_TYPE", 110, 5),
            new AdminWidgetLayout("PANEL_STOCK_HEALTH", 200, 4),
            new AdminWidgetLayout("LIST_STOCK_FOCUS", 210, 4),
            new AdminWidgetLayout("LIST_RECENT_ACTIVITY", 220, 4),
            new AdminWidgetLayout("SHORTCUTS_TXN", 300, 12)
    );
}
