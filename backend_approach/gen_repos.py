#!/usr/bin/env python3
"""Generate CAITS masters module (DTOs, services, controllers) + seeder + README."""
from pathlib import Path

BASE = Path(r"D:\AssetTracking_Management_System\backend\src\main\java\com\caits")
ROOT = Path(r"D:\AssetTracking_Management_System\backend")

def w(rel, content):
    path = BASE / rel if not str(rel).startswith("README") else ROOT / rel
    if str(rel).startswith("README"):
        path = ROOT / "README.md"
    else:
        path = BASE / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + "\n", encoding="utf-8")
    print("Wrote", path.name)

# Extra repository methods
w("domain/repository/UnitMstRepository.java", """
package com.caits.domain.repository;

import com.caits.domain.entity.UnitMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface UnitMstRepository extends JpaRepository<UnitMst, Integer>, JpaSpecificationExecutor<UnitMst> {
    Optional<UnitMst> findByUntUnitCodeIgnoreCase(String code);
    boolean existsByUntUnitCodeIgnoreCase(String code);
}
""")

w("domain/repository/CategoryMstRepository.java", """
package com.caits.domain.repository;

import com.caits.domain.entity.CategoryMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface CategoryMstRepository extends JpaRepository<CategoryMst, Integer>, JpaSpecificationExecutor<CategoryMst> {
    Optional<CategoryMst> findByCatCategoryCodeIgnoreCase(String code);
    boolean existsByCatCategoryCodeIgnoreCase(String code);
}
""")

w("domain/repository/SubcategoryMstRepository.java", """
package com.caits.domain.repository;

import com.caits.domain.entity.SubcategoryMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface SubcategoryMstRepository extends JpaRepository<SubcategoryMst, Integer>, JpaSpecificationExecutor<SubcategoryMst> {
    Optional<SubcategoryMst> findByScatSubcategoryCodeIgnoreCase(String code);
    boolean existsByScatSubcategoryCodeIgnoreCase(String code);
    List<SubcategoryMst> findByScatCategoryIdCat(Integer categoryId);
}
""")

w("domain/repository/GentypeMstRepository.java", """
package com.caits.domain.repository;

import com.caits.domain.entity.GentypeMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface GentypeMstRepository extends JpaRepository<GentypeMst, Integer>, JpaSpecificationExecutor<GentypeMst> {
    Optional<GentypeMst> findByGtypTypeCodeIgnoreCase(String code);
    boolean existsByGtypTypeCodeIgnoreCase(String code);
}
""")

w("domain/repository/GenmasterMstRepository.java", """
package com.caits.domain.repository;

import com.caits.domain.entity.GenmasterMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface GenmasterMstRepository extends JpaRepository<GenmasterMst, Integer>, JpaSpecificationExecutor<GenmasterMst> {
    Optional<GenmasterMst> findByGmstValueCodeIgnoreCaseAndGmstGentypeIdGtyp(String code, Integer gentypeId);
    boolean existsByGmstValueCodeIgnoreCaseAndGmstGentypeIdGtyp(String code, Integer gentypeId);
    List<GenmasterMst> findByGmstGentypeIdGtypOrderByGmstSortOrderAsc(Integer gentypeId);
}
""")

w("domain/repository/OrgEntityMstRepository.java", """
package com.caits.domain.repository;

import com.caits.domain.entity.OrgEntityMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface OrgEntityMstRepository extends JpaRepository<OrgEntityMst, Integer>, JpaSpecificationExecutor<OrgEntityMst> {
    Optional<OrgEntityMst> findByEntEntityCodeIgnoreCase(String code);
    boolean existsByEntEntityCodeIgnoreCase(String code);
}
""")

w("domain/repository/OrgBusinessunitMstRepository.java", """
package com.caits.domain.repository;

import com.caits.domain.entity.OrgBusinessunitMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface OrgBusinessunitMstRepository extends JpaRepository<OrgBusinessunitMst, Integer>, JpaSpecificationExecutor<OrgBusinessunitMst> {
    Optional<OrgBusinessunitMst> findByBuBuCodeIgnoreCase(String code);
    boolean existsByBuBuCodeIgnoreCase(String code);
}
""")

w("domain/repository/OrgLocationMstRepository.java", """
package com.caits.domain.repository;

import com.caits.domain.entity.OrgLocationMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface OrgLocationMstRepository extends JpaRepository<OrgLocationMst, Integer>, JpaSpecificationExecutor<OrgLocationMst> {
    Optional<OrgLocationMst> findByLocLocationCodeIgnoreCase(String code);
    boolean existsByLocLocationCodeIgnoreCase(String code);
}
""")

w("domain/repository/InvItemMstRepository.java", """
package com.caits.domain.repository;

import com.caits.domain.entity.InvItemMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface InvItemMstRepository extends JpaRepository<InvItemMst, Integer>, JpaSpecificationExecutor<InvItemMst> {
    Optional<InvItemMst> findByItmItemCodeIgnoreCase(String code);
    boolean existsByItmItemCodeIgnoreCase(String code);
}
""")

w("domain/repository/InvVendorMstRepository.java", """
package com.caits.domain.repository;

import com.caits.domain.entity.InvVendorMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface InvVendorMstRepository extends JpaRepository<InvVendorMst, Integer>, JpaSpecificationExecutor<InvVendorMst> {
    Optional<InvVendorMst> findByVndVendorCodeIgnoreCase(String code);
    boolean existsByVndVendorCodeIgnoreCase(String code);
}
""")

w("domain/repository/InvStockMstRepository.java", """
package com.caits.domain.repository;

import com.caits.domain.entity.InvStockMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface InvStockMstRepository extends JpaRepository<InvStockMst, Integer>, JpaSpecificationExecutor<InvStockMst> {
    Optional<InvStockMst> findFirstByStkItemIdItmAndStkLocationIdLoc(Integer itemId, Integer locationId);
}
""")

w("domain/repository/SysmRolesMstRepository.java", """
package com.caits.domain.repository;

import com.caits.domain.entity.SysmRolesMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface SysmRolesMstRepository extends JpaRepository<SysmRolesMst, Integer>, JpaSpecificationExecutor<SysmRolesMst> {
    Optional<SysmRolesMst> findByRolRoleCodeIgnoreCase(String code);
    boolean existsByRolRoleCodeIgnoreCase(String code);
}
""")

w("domain/repository/SysmRolepermissionDtlRepository.java", """
package com.caits.domain.repository;

import com.caits.domain.entity.SysmRolepermissionDtl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface SysmRolepermissionDtlRepository extends JpaRepository<SysmRolepermissionDtl, Integer>, JpaSpecificationExecutor<SysmRolepermissionDtl> {
    List<SysmRolepermissionDtl> findByRlpmRoleIdRol(Integer roleId);
    void deleteByRlpmRoleIdRol(Integer roleId);
}
""")

w("domain/repository/HrcEmployeeMstRepository.java", """
package com.caits.domain.repository;

import com.caits.domain.entity.HrcEmployeeMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface HrcEmployeeMstRepository extends JpaRepository<HrcEmployeeMst, Integer>, JpaSpecificationExecutor<HrcEmployeeMst> {
    Optional<HrcEmployeeMst> findByEmpEmployeeCodeIgnoreCase(String code);
    boolean existsByEmpEmployeeCodeIgnoreCase(String code);
    List<HrcEmployeeMst> findByEmpReportingToEmpIdEmp(Integer managerId);
}
""")

w("domain/repository/SysmUserBuMappingDtlRepository.java", """
package com.caits.domain.repository;

import com.caits.domain.entity.SysmUserBuMappingDtl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface SysmUserBuMappingDtlRepository extends JpaRepository<SysmUserBuMappingDtl, Integer>, JpaSpecificationExecutor<SysmUserBuMappingDtl> {
    List<SysmUserBuMappingDtl> findByUboaUserIdUsr(Integer userId);
    void deleteByUboaUserIdUsr(Integer userId);
}
""")

w("domain/repository/SysmMenutreeMstRepository.java", """
package com.caits.domain.repository;

import com.caits.domain.entity.SysmMenutreeMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface SysmMenutreeMstRepository extends JpaRepository<SysmMenutreeMst, Integer>, JpaSpecificationExecutor<SysmMenutreeMst> {
    List<SysmMenutreeMst> findByMtreeIsactiveTrueOrderByMtreeSortOrderAsc();
}
""")

print("Repos updated")
