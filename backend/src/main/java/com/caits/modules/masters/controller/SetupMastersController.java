package com.caits.modules.masters.controller;

import com.caits.common.MessageResponse;
import com.caits.common.PageResponse;
import com.caits.modules.masters.dto.MasterDtos.*;
import com.caits.modules.masters.service.SetupMastersService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class SetupMastersController {

    private final SetupMastersService service;

    public SetupMastersController(SetupMastersService service) {
        this.service = service;
    }

    // Units
    @GetMapping("/units")
    public PageResponse<UnitDto> listUnits(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive) {
        return service.listUnits(page, pageSize, search, isActive);
    }

    @GetMapping("/units/{id}")
    public UnitDto getUnit(@PathVariable Integer id) {
        return service.getUnit(id);
    }

    @PostMapping("/units")
    public ResponseEntity<UnitDto> createUnit(@RequestBody UnitRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createUnit(request));
    }

    @PutMapping("/units/{id}")
    public UnitDto updateUnit(@PathVariable Integer id, @RequestBody UnitRequest request) {
        return service.updateUnit(id, request);
    }

    @DeleteMapping("/units/{id}")
    public MessageResponse deleteUnit(@PathVariable Integer id) {
        return service.deleteUnit(id);
    }

    // Categories
    @GetMapping("/categories")
    public PageResponse<CategoryDto> listCategories(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive) {
        return service.listCategories(page, pageSize, search, isActive);
    }

    @GetMapping("/categories/{id}")
    public CategoryDto getCategory(@PathVariable Integer id) {
        return service.getCategory(id);
    }

    @GetMapping("/categories/{categoryId}/subcategories")
    public List<SubcategoryDto> subcategoriesByCategory(@PathVariable Integer categoryId) {
        return service.listByCategory(categoryId);
    }

    @PostMapping("/categories")
    public ResponseEntity<CategoryDto> createCategory(@RequestBody CategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createCategory(request));
    }

    @PutMapping("/categories/{id}")
    public CategoryDto updateCategory(@PathVariable Integer id, @RequestBody CategoryRequest request) {
        return service.updateCategory(id, request);
    }

    @DeleteMapping("/categories/{id}")
    public MessageResponse deleteCategory(@PathVariable Integer id) {
        return service.deleteCategory(id);
    }

    // Subcategories
    @GetMapping("/subcategories")
    public PageResponse<SubcategoryDto> listSubcategories(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) Integer categoryId) {
        return service.listSubcategories(page, pageSize, search, isActive, categoryId);
    }

    @GetMapping("/subcategories/{id}")
    public SubcategoryDto getSubcategory(@PathVariable Integer id) {
        return service.getSubcategory(id);
    }

    @PostMapping("/subcategories")
    public ResponseEntity<SubcategoryDto> createSubcategory(@RequestBody SubcategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createSubcategory(request));
    }

    @PutMapping("/subcategories/{id}")
    public SubcategoryDto updateSubcategory(@PathVariable Integer id, @RequestBody SubcategoryRequest request) {
        return service.updateSubcategory(id, request);
    }

    @DeleteMapping("/subcategories/{id}")
    public MessageResponse deleteSubcategory(@PathVariable Integer id) {
        return service.deleteSubcategory(id);
    }

    // General types
    @GetMapping("/general-types")
    public PageResponse<GentypeDto> listGentypes(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive) {
        return service.listGentypes(page, pageSize, search, isActive);
    }

    @GetMapping("/general-types/{typeCode}/values")
    public List<GenmasterValueDto> valuesByType(@PathVariable String typeCode) {
        return service.valuesByTypeCode(typeCode);
    }

    @PostMapping("/general-types/{typeCode}/values")
    public ResponseEntity<GenmasterValueDto> addValueByType(
            @PathVariable String typeCode,
            @RequestBody GenmasterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addValueByTypeCode(typeCode, request));
    }

    @GetMapping("/general-types/{id}")
    public GentypeDto getGentype(@PathVariable Integer id) {
        return service.getGentype(id);
    }

    @PostMapping("/general-types")
    public ResponseEntity<GentypeDto> createGentype(@RequestBody GentypeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createGentype(request));
    }

    @PutMapping("/general-types/{id}")
    public GentypeDto updateGentype(@PathVariable Integer id, @RequestBody GentypeRequest request) {
        return service.updateGentype(id, request);
    }

    @DeleteMapping("/general-types/{id}")
    public MessageResponse deleteGentype(@PathVariable Integer id) {
        return service.deleteGentype(id);
    }

    // General masters
    @GetMapping("/general-masters")
    public PageResponse<GenmasterDto> listGenmasters(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) Integer gentypeId,
            @RequestParam(required = false) String typeCode) {
        return service.listGenmasters(page, pageSize, search, isActive, gentypeId, typeCode);
    }

    @GetMapping("/general-masters/{id}")
    public GenmasterDto getGenmaster(@PathVariable Integer id) {
        return service.getGenmaster(id);
    }

    @PostMapping("/general-masters")
    public ResponseEntity<GenmasterDto> createGenmaster(@RequestBody GenmasterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createGenmaster(request));
    }

    @PutMapping("/general-masters/{id}")
    public GenmasterDto updateGenmaster(@PathVariable Integer id, @RequestBody GenmasterRequest request) {
        return service.updateGenmaster(id, request);
    }

    @DeleteMapping("/general-masters/{id}")
    public MessageResponse deleteGenmaster(@PathVariable Integer id) {
        return service.deleteGenmaster(id);
    }
}
