package com.caits.domain.repository;

import com.caits.domain.entity.SysmUserloginMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SysmUserloginMstRepository extends JpaRepository<SysmUserloginMst, Integer>, JpaSpecificationExecutor<SysmUserloginMst> {
    Optional<SysmUserloginMst> findByUsrLoginIdIgnoreCase(String loginId);
    boolean existsByUsrLoginIdIgnoreCase(String loginId);
    Optional<SysmUserloginMst> findByUsrEmployeeIdEmp(Integer employeeId);
    boolean existsByUsrEmployeeIdEmp(Integer employeeId);

    @Query("""
            select distinct u.usrUserId
            from SysmUserloginMst u, SysmRolepermissionDtl p, SysmMenutreeMst m
            where u.usrRoleIdRol = p.rlpmRoleIdRol
              and p.rlpmMenuIdMtree = m.mtreeMenuId
              and u.usrIsactive = true
              and upper(m.mtreeMenuCode) = upper(:menuCode)
              and (
                    (:needApprove = false and coalesce(p.rlpmCanView, false) = true)
                 or (:needApprove = true and (coalesce(p.rlpmCanApprove, false) = true
                        or coalesce(p.rlpmCanView, false) = true))
              )
            """)
    List<Integer> findActiveUserIdsWithMenuAccess(
            @Param("menuCode") String menuCode,
            @Param("needApprove") boolean needApprove);
}
