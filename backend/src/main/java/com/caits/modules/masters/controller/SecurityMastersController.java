package com.caits.modules.masters.controller;

import com.caits.common.MessageResponse;
import com.caits.common.PageResponse;
import com.caits.modules.masters.dto.MasterDtos.*;
import com.caits.modules.masters.service.DepartmentMastersService;
import com.caits.modules.masters.service.SecurityMastersService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class SecurityMastersController {

    private final SecurityMastersService service;
    private final DepartmentMastersService departmentService;

    public SecurityMastersController(SecurityMastersService service, DepartmentMastersService departmentService) {
        this.service = service;
        this.departmentService = departmentService;
    }

    @GetMapping("/menus")
    public List<MenuDto> listMenus() {
        return service.listMenus();
    }

    @GetMapping("/roles")
    public PageResponse<RoleDto> listRoles(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive) {
        return service.listRoles(page, pageSize, search, isActive);
    }

    @GetMapping("/roles/{id}")
    public RoleDto getRole(@PathVariable Integer id) {
        return service.getRole(id);
    }

    @PostMapping("/roles")
    public ResponseEntity<RoleDto> createRole(@RequestBody RoleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createRole(request));
    }

    @PutMapping("/roles/{id}")
    public RoleDto updateRole(@PathVariable Integer id, @RequestBody RoleRequest request) {
        return service.updateRole(id, request);
    }

    @DeleteMapping("/roles/{id}")
    public MessageResponse deleteRole(@PathVariable Integer id) {
        return service.deleteRole(id);
    }

    @GetMapping("/roles/{roleId}/permissions")
    public List<PermissionDto> getPermissions(@PathVariable Integer roleId) {
        return service.getPermissions(roleId);
    }

    @PutMapping("/roles/{roleId}/permissions")
    public MessageResponse putPermissions(@PathVariable Integer roleId, @RequestBody List<PermissionDto> permissions) {
        return service.putPermissions(roleId, permissions);
    }

    @GetMapping("/employees")
    public PageResponse<EmployeeDto> listEmployees(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive) {
        return service.listEmployees(page, pageSize, search, isActive);
    }

    @GetMapping("/employees/{id}")
    public EmployeeDto getEmployee(@PathVariable Integer id) {
        return service.getEmployee(id);
    }

    @GetMapping("/employees/{employeeId}/subordinates")
    public List<SubordinateDto> subordinates(@PathVariable Integer employeeId) {
        return service.subordinates(employeeId);
    }

    @PostMapping("/employees")
    public ResponseEntity<EmployeeDto> createEmployee(@RequestBody EmployeeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createEmployee(request));
    }

    @PutMapping("/employees/{id}")
    public EmployeeDto updateEmployee(@PathVariable Integer id, @RequestBody EmployeeRequest request) {
        return service.updateEmployee(id, request);
    }

    @DeleteMapping("/employees/{id}")
    public MessageResponse deleteEmployee(@PathVariable Integer id) {
        return service.deleteEmployee(id);
    }

    @GetMapping("/users")
    public PageResponse<UserDto> listUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive) {
        return service.listUsers(page, pageSize, search, isActive);
    }

    @GetMapping("/users/{userId}")
    public UserDto getUser(@PathVariable Integer userId) {
        return service.getUser(userId);
    }

    @PostMapping("/users")
    public ResponseEntity<UserDto> createUser(@RequestBody UserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createUser(request));
    }

    @PutMapping("/users/{userId}")
    public UserDto updateUser(@PathVariable Integer userId, @RequestBody UserRequest request) {
        return service.updateUser(userId, request);
    }

    @DeleteMapping("/users/{userId}")
    public MessageResponse deleteUser(@PathVariable Integer userId) {
        return service.deleteUser(userId);
    }

    @PostMapping("/users/{userId}/reset-password")
    public MessageResponse resetPassword(@PathVariable Integer userId) {
        return service.resetPassword(userId);
    }

    @PostMapping("/users/{userId}/lock-status")
    public LockStatusResponse lockStatus(@PathVariable Integer userId, @RequestBody LockStatusRequest request) {
        return service.lockStatus(userId, request);
    }

    @GetMapping("/users/{userId}/ou-access")
    public OuAccessDto getOuAccess(@PathVariable Integer userId) {
        return service.getOuAccess(userId);
    }

    @PutMapping("/users/{userId}/ou-access")
    public OuAccessDto putOuAccess(@PathVariable Integer userId, @RequestBody OuAccessRequest request) {
        return service.putOuAccess(userId, request);
    }

    @GetMapping("/access-exceptions")
    public PageResponse<AccessExceptionDto> listExceptions(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) Integer employeeId) {
        return service.listExceptions(page, pageSize, search, isActive, employeeId);
    }

    @GetMapping("/access-exceptions/{id}")
    public AccessExceptionDto getException(@PathVariable Integer id) {
        return service.getException(id);
    }

    @PostMapping("/access-exceptions")
    public ResponseEntity<AccessExceptionDto> createException(@RequestBody AccessExceptionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createException(request));
    }

    @PutMapping("/access-exceptions/{id}")
    public AccessExceptionDto updateException(@PathVariable Integer id, @RequestBody AccessExceptionRequest request) {
        return service.updateException(id, request);
    }

    @DeleteMapping("/access-exceptions/{id}")
    public MessageResponse deleteException(@PathVariable Integer id) {
        return service.deleteException(id);
    }

    @GetMapping("/departments")
    public PageResponse<DepartmentDto> listDepartments(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) Integer entityId) {
        return departmentService.list(page, pageSize, search, isActive, entityId);
    }

    @GetMapping("/departments/{id}")
    public DepartmentDto getDepartment(@PathVariable Integer id) {
        return departmentService.get(id);
    }

    @PostMapping("/departments")
    public ResponseEntity<DepartmentDto> createDepartment(@RequestBody DepartmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(departmentService.create(request));
    }

    @PutMapping("/departments/{id}")
    public DepartmentDto updateDepartment(@PathVariable Integer id, @RequestBody DepartmentRequest request) {
        return departmentService.update(id, request);
    }

    @DeleteMapping("/departments/{id}")
    public MessageResponse deleteDepartment(@PathVariable Integer id) {
        return departmentService.delete(id);
    }
}
