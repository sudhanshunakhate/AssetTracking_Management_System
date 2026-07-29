package com.caits.modules.masters.controller;

import com.caits.common.MessageResponse;
import com.caits.common.PageResponse;
import com.caits.modules.masters.dto.MasterDtos.*;
import com.caits.modules.masters.service.OrgMastersService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class OrgMastersController {

    private final OrgMastersService service;

    public OrgMastersController(OrgMastersService service) {
        this.service = service;
    }

    @GetMapping("/entities")
    public PageResponse<EntityDto> listEntities(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive) {
        return service.listEntities(page, pageSize, search, isActive);
    }

    @GetMapping("/entities/{id}")
    public EntityDto getEntity(@PathVariable Integer id) {
        return service.getEntity(id);
    }

    @PostMapping("/entities")
    public ResponseEntity<EntityDto> createEntity(@RequestBody EntityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createEntity(request));
    }

    @PutMapping("/entities/{id}")
    public EntityDto updateEntity(@PathVariable Integer id, @RequestBody EntityRequest request) {
        return service.updateEntity(id, request);
    }

    @DeleteMapping("/entities/{id}")
    public MessageResponse deleteEntity(@PathVariable Integer id) {
        return service.deleteEntity(id);
    }

    @GetMapping("/business-units")
    public PageResponse<BusinessUnitDto> listBus(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) Integer entityId) {
        return service.listBus(page, pageSize, search, isActive, entityId);
    }

    @GetMapping("/business-units/{id}")
    public BusinessUnitDto getBu(@PathVariable Integer id) {
        return service.getBu(id);
    }

    @PostMapping("/business-units")
    public ResponseEntity<BusinessUnitDto> createBu(@RequestBody BusinessUnitRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createBu(request));
    }

    @PutMapping("/business-units/{id}")
    public BusinessUnitDto updateBu(@PathVariable Integer id, @RequestBody BusinessUnitRequest request) {
        return service.updateBu(id, request);
    }

    @DeleteMapping("/business-units/{id}")
    public MessageResponse deleteBu(@PathVariable Integer id) {
        return service.deleteBu(id);
    }

    @GetMapping("/locations")
    public PageResponse<LocationDto> listLocations(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) Integer entityId,
            @RequestParam(required = false) Integer buId) {
        return service.listLocations(page, pageSize, search, isActive, entityId, buId);
    }

    @GetMapping("/locations/{id}")
    public LocationDto getLocation(@PathVariable Integer id) {
        return service.getLocation(id);
    }

    @PostMapping("/locations")
    public ResponseEntity<LocationDto> createLocation(@RequestBody LocationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createLocation(request));
    }

    @PutMapping("/locations/{id}")
    public LocationDto updateLocation(@PathVariable Integer id, @RequestBody LocationRequest request) {
        return service.updateLocation(id, request);
    }

    @DeleteMapping("/locations/{id}")
    public MessageResponse deleteLocation(@PathVariable Integer id) {
        return service.deleteLocation(id);
    }
}
