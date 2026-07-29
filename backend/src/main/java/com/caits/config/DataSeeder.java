package com.caits.config;

import com.caits.domain.entity.*;
import com.caits.domain.repository.*;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Seeds only the admin login graph when the database has no users.
 * No sample masters / transactions are created.
 */
@Component
public class DataSeeder implements ApplicationRunner {

    private final SysmUserloginMstRepository userRepo;
    private final SysmRolesMstRepository roleRepo;
    private final OrgEntityMstRepository entityRepo;
    private final HrcEmployeeMstRepository employeeRepo;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            SysmUserloginMstRepository userRepo,
            SysmRolesMstRepository roleRepo,
            OrgEntityMstRepository entityRepo,
            HrcEmployeeMstRepository employeeRepo,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.entityRepo = entityRepo;
        this.employeeRepo = employeeRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepo.count() > 0) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();

        SysmRolesMst role = new SysmRolesMst();
        role.setRolRoleCode("ADMIN");
        role.setRolRoleName("Administrator");
        role.setRolRoleLevel(1);
        role.setRolDesc("System administrator");
        role.setRolIsSystemRole(true);
        role.setRolIsactive(true);
        role.setRolCreatedBy("system");
        role.setRolCreatedOn(now);
        role = roleRepo.save(role);

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
}
