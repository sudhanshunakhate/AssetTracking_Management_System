package com.caits.config;

import com.caits.domain.entity.*;
import com.caits.domain.repository.*;
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
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            SysmUserloginMstRepository userRepo,
            SysmRolesMstRepository roleRepo,
            OrgEntityMstRepository entityRepo,
            HrcEmployeeMstRepository employeeRepo,
            SysmMenutreeMstRepository menuRepo,
            SysmRolepermissionDtlRepository rolePermRepo,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.entityRepo = entityRepo;
        this.employeeRepo = employeeRepo;
        this.menuRepo = menuRepo;
        this.rolePermRepo = rolePermRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedAdminGraphIfEmpty();
        seedMenusIfEmpty();
        seedAdminMenuPermissionsIfEmpty();
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
            r.setRolRoleLevel(1);
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

        HrcEmployeeMst emp = new HrcEmployeeMst();
        emp.setEmpEmployeeCode("ADMIN");
        emp.setEmpFirstName("System");
        emp.setEmpLastName("Admin");
        emp.setEmpEmail("admin@caits.local");
        emp.setEmpDesignation("Administrator");
        emp.setEmpDepartment("IT");
        emp.setEmpRoleIdRol(role.getRolRoleId());
        emp.setEmpIsactive(true);
        emp.setEmpCreatedBy("system");
        emp.setEmpCreatedOn(now);
        emp = employeeRepo.save(emp);

        SysmUserloginMst user = new SysmUserloginMst();
        user.setUsrEmployeeIdEmp(emp.getEmpEmployeeId());
        user.setUsrLoginId("admin");
        user.setUsrPasswordHash(passwordEncoder.encode("Admin@123"));
        user.setUsrRoleIdRol(role.getRolRoleId());
        user.setUsrAccountStatus("Active");
        user.setUsrEntityIdEnt(entity.getEntEntityId());
        user.setUsrBuAccessScope("ALL");
        user.setUsrForcePasswordReset(false);
        user.setUsrIsactive(true);
        user.setUsrFailedAttempts(0);
        user.setUsrCreatedBy("system");
        user.setUsrCreatedOn(now);
        userRepo.save(user);
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
            p.setRlpmModuleName(menu.getMtreeMenuCode());
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

    private record MenuDef(
            String code, String label, String group, int sort, String icon, String docType,
            boolean view, boolean create, boolean edit, boolean delete,
            boolean approve, boolean reject, boolean print, boolean export
    ) {}

    private static List<MenuDef> menuDefinitions() {
        return List.of(
                master("UOM", "Unit Master", 10),
                master("AIM", "Item Master", 20),
                master("ICM", "Inventory Category", 30),
                master("ISC", "Inventory Sub-Category", 40),
                master("GTY", "General Type", 50),
                master("GNM", "General Master", 60),
                master("VPM", "Vendor / Party", 70),
                master("ORG", "Organization (Entity)", 110, "Organization"),
                master("OU", "Operating Unit", 120, "Organization"),
                master("STR", "Location", 130, "Organization"),
                master("ARM", "Access Role", 210, "Access & People"),
                master("EMP", "Employee", 220, "Access & People"),
                master("USR", "User Login", 230, "Access & People"),
                new MenuDef("MNU", "Menu Access", "Access & People", 240, "MNU", null,
                        true, true, true, false, false, false, false, true),
                master("UAE", "Access Exception", 250, "Access & People"),
                txn("OPN", "Opening Stock", 310, "OPENING_STOCK", false, false),
                txn("SR", "Store Requisitions", 320, "MATERIAL_REQUISITION", true, true),
                txn("GRN", "Goods Receipt Note", 330, "GRN", true, true),
                txn("GP", "Gatepass", 340, null, true, false),
                txn("ISS", "Store Issue", 350, "MATERIAL_ISSUE", false, false),
                txn("TRF", "Material Transfer", 360, "MATERIAL_TRANSFER", false, false),
                txn("RTN", "Material Return", 370, "MATERIAL_RETURN", false, false),
                new MenuDef("DASH", "Dashboard", "Reports", 410, null, null,
                        true, false, false, false, false, false, false, true),
                new MenuDef("STKREG", "Stock Register", "Reports", 420, null, null,
                        true, false, false, false, false, false, false, true),
                new MenuDef("FULLRPT", "Full Report", "Reports", 430, null, null,
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
}
