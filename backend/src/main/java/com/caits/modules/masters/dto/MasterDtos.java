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

    public record DepartmentDto(Integer departmentId, String departmentCode, String departmentName, Integer entityId,
                                Integer buId, String buCode, String buName,
                                Integer headEmpId, String headEmpName, String desc, Boolean isActive,
                                String createdBy, LocalDateTime createdOn, String modifiedBy, LocalDateTime modifiedOn,
                                String message) {}
    public record DepartmentRequest(Integer departmentId, String departmentCode, String departmentName, Integer entityId,
                                    Integer buId, Integer headEmpId, String desc, Boolean isActive) {}

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
                              Boolean isSystemLocation, String systemRole, String printLocationName,
                              String createdBy, LocalDateTime createdOn, String modifiedBy, LocalDateTime modifiedOn, String message) {}
    public record LocationRequest(Integer locationId, String locationCode, String locationName, String locationType,
                                  Integer entityId, Integer buId, Integer managerEmpId, String city, Boolean isActive,
                                  String printLocationName) {}

    public record ItemDto(Integer itemId, String itemCode, String itemName, String itemType, Integer categoryId,
                          Integer subcategoryId, Integer uomId, BigDecimal standardCost, String imageUrl, String desc,
                          String remarks, String assetType, String makeBrand, String model,
                          BigDecimal usefulLifeYears, String depreciationMethod, BigDecimal depreciationRate,
                          Integer currentLocationId, Boolean isSerialized, Boolean isReturnable,
                          Boolean isUnderAmc, Boolean isInsuranceRequired, Boolean inspectionNeeded, String consumableType,
                          Boolean trackBatchLot, Boolean trackExpiry, Boolean isConsumable, Boolean allowNegativeStock,
                          String ram, String storage, String processor, String productNo,
                          Integer parentItemId, Boolean isActive,
                          Integer entityId, String buAccessScope, String locationAccessScope,
                          List<Integer> buIds, List<Integer> locationIds, List<Integer> effectiveLocationIds,
                          String createdBy, LocalDateTime createdOn, String modifiedBy, LocalDateTime modifiedOn,
                          String message) {}
    public record ItemRequest(Integer itemId, String itemCode, String itemName, String itemType, Integer categoryId,
                              Integer subcategoryId, Integer uomId, BigDecimal standardCost, String imageUrl, String desc,
                              String remarks, String assetType, String makeBrand, String model,
                              BigDecimal usefulLifeYears, String depreciationMethod, BigDecimal depreciationRate,
                              Integer currentLocationId, Boolean isSerialized, Boolean isReturnable,
                              Boolean isUnderAmc, Boolean isInsuranceRequired, Boolean inspectionNeeded, String consumableType,
                              Boolean trackBatchLot, Boolean trackExpiry, Boolean isConsumable, Boolean allowNegativeStock,
                              String ram, String storage, String processor, String productNo,
                              Integer parentItemId, Boolean isActive,
                              Integer entityId, String buAccessScope, String locationAccessScope,
                              List<Integer> buIds, List<Integer> locationIds) {}

    public record VendorDto(Integer vendorId, String vendorCode, String vendorName, String partyType, String gstin,
                            String panNo, Integer rating, String add1, String add2, String city, String state, String pin,
                            String country, String contactPerson, String phone, String altPhone, String email,
                            String website, String notes, Boolean isActive, String createdBy, LocalDateTime createdOn,
                            String modifiedBy, LocalDateTime modifiedOn, String message) {}
    public record VendorRequest(Integer vendorId, String vendorCode, String vendorName, String partyType, String gstin,
                                String panNo, Integer rating, String add1, String add2, String city, String state,
                                String pin, String country, String contactPerson, String phone, String altPhone,
                                String email, String website, String notes, Boolean isActive) {}

    public record StockDto(Integer stockId, Integer itemId, Integer locationId, BigDecimal currentQty, BigDecimal reservedQty,
                           BigDecimal availableQty, String batchLotNo, Boolean isActive) {}
    public record StockDetailDto(Integer itemId, Integer locationId, BigDecimal currentQty, BigDecimal reservedQty,
                                 BigDecimal availableQty, String batchLotNo) {}

    public record MenuDto(Integer menuId, String menuCode, String menuLabel, String menuGroup, Integer sortOrder,
                          Integer groupSortOrder,
                          String docType, Boolean supportsView, Boolean supportsCreate, Boolean supportsEdit,
                          Boolean supportsDelete, Boolean supportsApprove, Boolean supportsReject,
                          Boolean supportsPrint, Boolean supportsExport) {}

    public record RoleDto(Integer roleId, String roleCode, String roleName, String desc,
                          Boolean isSystemRole, Boolean isActive, String createdBy, LocalDateTime createdOn,
                          String modifiedBy, LocalDateTime modifiedOn, String message) {}
    public record RoleRequest(Integer roleId, String roleCode, String roleName, String desc,
                              Boolean isSystemRole, Boolean isActive) {}
    public record PermissionDto(Integer menuId, String module, Boolean canView, Boolean canCreate, Boolean canEdit,
                                Boolean canDelete, Boolean canApprove, Boolean canReject, Boolean canPrint,
                                Boolean canExport, Integer sortOrder, Integer groupSortOrder) {}

    public record EmployeeDto(Integer employeeId, String employeeCode, String firstName, String lastName,
                              String gender, java.time.LocalDate dob, java.time.LocalDate joiningDate, String employmentType,
                              String email, String phone, String altPhone, String designation, Integer departmentId,
                              String departmentName, Integer roleId, Integer baseLocationId, Integer reportingToEmpId, Boolean isActive,
                              Boolean hasLogin, String createdBy, LocalDateTime createdOn,
                              String modifiedBy, LocalDateTime modifiedOn, String message) {}
    public record EmployeeRequest(Integer employeeId, String employeeCode, String firstName, String lastName,
                                  String gender, java.time.LocalDate dob, java.time.LocalDate joiningDate,
                                  String employmentType, String email, String phone, String altPhone,
                                  String designation, Integer departmentId, Integer roleId, Integer baseLocationId,
                                  Integer reportingToEmpId, Boolean isActive,
                                  Boolean createLogin, String loginId, String password, String confirmPassword,
                                  Integer entityId) {}
    public record SubordinateDto(Integer employeeId, String employeeCode, String firstName, String designation) {}

    public record UserDto(Integer userId, Integer employeeId, String loginId, Integer roleId, String accountStatus,
                          Integer entityId, String buAccessScope, Integer locationId, List<Integer> buIds,
                          String locationAccessScope, List<Integer> locationIds,
                          Boolean forcePasswordReset, Boolean isActive, String createdBy, LocalDateTime createdOn,
                          String modifiedBy, LocalDateTime modifiedOn, String message) {}
    public record UserRequest(Integer employeeId, String loginId, String password, Integer roleId, String accountStatus,
                              Integer entityId, String buAccessScope, Integer locationId, Boolean forcePasswordReset,
                              Boolean isActive) {}
    public record LockStatusRequest(String action) {}
    public record LockStatusResponse(Integer userId, String accountStatus, String message) {}
    public record OuAccessDto(Integer userId, String buAccessScope, List<Integer> buIds,
                              String locationAccessScope, List<Integer> locationIds) {}
    public record OuAccessRequest(String buAccessScope, List<Integer> buIds,
                                  String locationAccessScope, List<Integer> locationIds) {}

    public record AccessExceptionDto(Integer exceptionId, Integer employeeId, String exceptionType, String menuCode,
                                     String reason, LocalDate validFrom, LocalDate validUntil, Boolean isActive,
                                     String createdBy, LocalDateTime createdOn, String modifiedBy, LocalDateTime modifiedOn,
                                     String message) {}
    public record AccessExceptionRequest(Integer exceptionId, Integer employeeId, String exceptionType, String menuCode,
                                         String reason, LocalDate validFrom, LocalDate validUntil, Boolean isActive) {}
}
