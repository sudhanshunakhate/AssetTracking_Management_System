package com.caits.domain.repository;

import com.caits.domain.entity.InvBlsMst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface InvBlsMstRepository extends JpaRepository<InvBlsMst, Integer>, JpaSpecificationExecutor<InvBlsMst> {

    List<InvBlsMst> findByIbmIssuedToEmpIdEmpAndIbmIsDummyFalseAndIbmIsactiveTrue(Integer empId);

    List<InvBlsMst> findByIbmIsactiveTrueAndIbmIssuedToEmpIdEmpIsNotNull();

    List<InvBlsMst> findByIbmIsDummyFalseAndIbmIsactiveTrue();

    Optional<InvBlsMst> findFirstByIbmItemIdItmAndIbmIsDummyTrueAndIbmIsactiveTrue(Integer itemId);

    Optional<InvBlsMst> findFirstByIbmSerialNoIgnoreCaseAndIbmIsactiveTrue(String serialNo);

    Optional<InvBlsMst> findFirstByIbmItemIdItmAndIbmBatchNoIgnoreCaseAndIbmIsDummyFalseAndIbmIsactiveTrue(
            Integer itemId, String batchNo);
}
