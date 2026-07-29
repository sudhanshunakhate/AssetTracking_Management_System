package com.caits.modules.masters.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class MasterDtos {
    private MasterDtos() {}

    public record UnitDto(Integer unitId, String unitCode, String unitName, String desc, Boolean isActive,
                          String createdBy, LocalDateTime createdOn, String modifiedBy, LocalDateTime modifiedOn, String message) {}
    public record UnitRequest(Integer unitId, String unitCode, String unitName, String desc, Boolean isActive) {}

    public record CategoryDto(Integer categoryId, String categoryCode, String categoryName, String desc, Boolean isActive,
                              String createdBy, LocalDateTime createdOn, String modifiedBy, LocalDateTime modifiedOn, String message) {}
    public record CategoryRequest(Integer categoryId, String categoryCode, String categoryName, String desc, Boolean isActive) {}

    public record SubcategoryDto(Integer subcategoryId, String subcategoryCode, String subcategoryName, Integer categoryId,
                                 String categoryName, String desc, Boolean isActive,
                                 String createdBy, LocalDateTime createdOn, String modifiedBy, LocalDateTime modifiedOn, String message) {}
    public record SubcategoryRequest(Integer subcategoryId, String subcategoryCode, String subcategoryName, Integer categoryId,
                                     String categoryName, String desc, Boolean isActive) {}

    public record GentypeDto(Integer gentypeId, String typeCode, String typeName, String desc, Boolean isActive,
                             String createdBy, LocalDateTime createdOn, String modifiedBy, LocalDateTime modifiedOn, String message) {}
    public record GentypeRequest(Integer gentypeId, String typeCode, String typeName, String desc, Boolean isActive) {}

    public record GenmasterDto(Integer genmasterId, String valueCode, String valueName, Integer gentypeId, Integer sortOrder,
                               String desc, Boolean isActive, String createdBy, LocalDateTime createdOn,
                               String modifiedBy, LocalDateTime modifiedOn, String message) {}
    public record GenmasterRequest(Integer genmasterId, String valueCode, String valueName, Integer gentypeId,
                                   Integer sortOrder, String desc, Boolean isActive) {}
    public record GenmasterValueDto(Integer genmasterId, String valueCode, String valueName, Integer sortOrder) {}

    public record EntityDto(Integer entityId, String entityCode, String entityName, String shortName, String gstin, String panNo,
                            String city, String state, Boolean isActive, String createdBy, LocalDateTime createdOn,
                            String modifiedBy, LocalDateTime modifiedOn, String message) {}
    public record EntityRequest(Integer entityId, String entityCode, String entityName, String shortName, String gstin,
                                String panNo, String city, String state, Boolean isActive) {}

    public record BusinessUnitDto(Integer buId, String buCode, String buName, Integer entityId, String buType,
                                  Integer managerEmpId, String city, String state, Boolean isActive,
                                  String createdBy, LocalDateTime createdOn, String modifiedBy, LocalDateTime modifiedOn, String message) {}
    public record BusinessUnitRequest(Integer buId, String buCode, String buName, Integer entityId, String buType,
                                      Integer managerEmpId, String city, String state, Boolean isActive) {}

    public record LocationDto(Integer locationId, String locationCode, String locationName, String locationType,
                              Integer entityId, Integer buId, Integer managerEmpId, String city, Boolean isActive,
                              String createdBy, LocalDateTime createdOn, String modifiedBy, LocalDateTime modifiedOn, String message) {}
    public record LocationRequest(Integer locationId, String locationCode, String locationName, String locationType,
                                  Integer entityId, Integer buId, Integer managerEmpId, String city, Boolean isActive) {}

    public record ItemDto(Integer itemId, String itemCode, String itemName, String itemType, Integer categoryId,
                          Integer subcategoryId, Integer uomId, BigDecimal standardCost, String assetType, String makeBrand,
                          String model, String serialNo, Boolean isSerialized, Boolean isReturnable, Integer assignedToEmpId,
                          Integer currentLocationId, Boolean isActive, String createdBy, LocalDateTime createdOn,
                          String modifiedBy, LocalDateTime modifiedOn, String message) {}
    public record ItemRequest(Integer itemId, String itemCode, String itemName, String itemType, Integer categoryId,
                              Integer subcategoryId, Integer uomId, BigDecimal standardCost, String assetType, String makeBrand,
                              String model, String serialNo, Boolean isSerialized, Boolean isReturnable, Integer assignedToEmpId,
                              Integer currentLocationId, Boolean isActive) {}

    public record VendorDto(Integer vendorId, String vendorCode, String vendorName, String partyType, String gstin,
                            Integer rating, String city, String phone, Boolean isActive, String createdBy, LocalDateTime createdOn,
                            String modifiedBy, LocalDateTime modifiedOn, String message) {}
    public record VendorRequest(Integer vendorId, String vendorCode, String vendorName, String partyType, String gstin,
                                Integer rating, String city, String phone, Boolean isActive) {}

    public record StockDto(Integer stockId, Integer itemId, Integer locationId, BigDecimal currentQty, BigDecimal reservedQty,
                           BigDecimal availableQty, String batchLotNo, Boolean isActive) {}
    public record StockDetailDto(Integer itemId, Integer locationId, BigDecimal currentQty, BigDecimal reservedQty,
                                 BigDecimal availableQty, String batchLotNo) {}

    public record MenuDto(Integer menuId, String menuCode, String menuLabel, String menuGroup, Integer sortOrder,
                          String docType, Boolean supportsView, Boolean supportsCreate, Boolean supportsApprove) {}

    public record RoleDto(Integer roleId, String roleCode, String roleName, Integer roleLevel, String desc,
                          Boolean isSystemRole, Boolean isActive, String createdBy, LocalDateTime createdOn,
                          String modifiedBy, LocalDateTime modifiedOn, String message) {}
    public record RoleRequest(Integer roleId, String roleCode, String roleName, Integer roleLevel, String desc,
                              Boolean isSystemRole, Boolean isActive) {}
    public record PermissionDto(String module, Boolean canView, Boolean canCreate, Boolean canEdit, Boolean canDelete,
                                Boolean canApprove, Boolean canReject, Boolean canPrint, Boolean canExport) {}

    public record EmployeeDto(Integer employeeId, String employeeCode, String firstName, String lastName, String email,
                              String phone, String designation, String department, Integer roleId, Integer baseLocationId,
                              Integer reportingToEmpId, Boolean isActive, String createdBy, LocalDateTime createdOn,
                              String modifiedBy, LocalDateTime modifiedOn, String message) {}
    public record EmployeeRequest(Integer employeeId, String employeeCode, String firstName, String lastName, String email,
                                  String phone, String designation, String department, Integer roleId, Integer baseLocationId,
                                  Integer reportingToEmpId, Boolean isActive) {}
    public record SubordinateDto(Integer employeeId, String employeeCode, String firstName, String designation) {}

    public record UserDto(Integer userId, Integer employeeId, String loginId, Integer roleId, String accountStatus,
                          Integer entityId, String buAccessScope, Integer locationId, Boolean forcePasswordReset,
                          Boolean isActive, String createdBy, LocalDateTime createdOn, String modifiedBy,
                          LocalDateTime modifiedOn, String message) {}
    public record UserRequest(Integer employeeId, String loginId, Integer roleId, String accountStatus, Integer entityId,
                              String buAccessScope, Integer locationId, Boolean forcePasswordReset, Boolean isActive) {}
    public record LockStatusRequest(String action) {}
    public record LockStatusResponse(Integer userId, String accountStatus, String message) {}
    public record OuAccessDto(Integer userId, String buAccessScope, List<Integer> buIds) {}
    public record OuAccessRequest(String buAccessScope, List<Integer> buIds) {}

    public record AccessExceptionDto(Integer exceptionId, Integer employeeId, String exceptionType, String menuCode,
                                     String reason, LocalDate validFrom, LocalDate validUntil, Boolean isActive,
                                     String createdBy, LocalDateTime createdOn, String modifiedBy, LocalDateTime modifiedOn,
                                     String message) {}
    public record AccessExceptionRequest(Integer exceptionId, Integer employeeId, String exceptionType, String menuCode,
                                         String reason, LocalDate validFrom, LocalDate validUntil, Boolean isActive) {}
}
