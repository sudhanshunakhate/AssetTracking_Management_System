package com.caits.modules.masters.service;

import com.caits.common.ApiException;
import com.caits.common.MessageResponse;
import com.caits.common.PageResponse;
import com.caits.common.spec.SpecUtils;
import com.caits.domain.entity.*;
import com.caits.domain.repository.*;
import com.caits.modules.masters.dto.MasterDtos.*;
import com.caits.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class SetupMastersService {

    private final UnitMstRepository unitRepo;
    private final CategoryMstRepository categoryRepo;
    private final SubcategoryMstRepository subcategoryRepo;
    private final GentypeMstRepository gentypeRepo;
    private final GenmasterMstRepository genmasterRepo;

    public SetupMastersService(UnitMstRepository unitRepo, CategoryMstRepository categoryRepo,
                               SubcategoryMstRepository subcategoryRepo, GentypeMstRepository gentypeRepo,
                               GenmasterMstRepository genmasterRepo) {
        this.unitRepo = unitRepo;
        this.categoryRepo = categoryRepo;
        this.subcategoryRepo = subcategoryRepo;
        this.gentypeRepo = gentypeRepo;
        this.genmasterRepo = genmasterRepo;
    }

    // ---- Units ----
    @Transactional(readOnly = true)
    public PageResponse<UnitDto> listUnits(int page, int pageSize, String search, Boolean isActive) {
        Specification<UnitMst> spec = SpecUtils.combine(
                SpecUtils.activeEquals("untIsactive", isActive),
                SpecUtils.searchContains(search, "untUnitCode", "untUnitName"));
        Page<UnitMst> result = unitRepo.findAll(spec, PageRequest.of(Math.max(page - 1, 0), pageSize));
        return PageResponse.of(page, pageSize, result.getTotalElements(),
                result.getContent().stream().map(e -> toUnitDto(e, null)).toList());
    }

    @Transactional(readOnly = true)
    public UnitDto getUnit(Integer id) {
        return toUnitDto(findUnit(id), null);
    }

    @Transactional
    public UnitDto createUnit(UnitRequest req) {
        requireCode(req.unitCode(), "unitCode");
        if (unitRepo.existsByUntUnitCodeIgnoreCase(req.unitCode())) {
            throw ApiException.conflict("Unit code already exists");
        }
        UnitMst e = new UnitMst();
        applyUnit(e, req);
        e.setUntCreatedBy(SecurityUtils.requireLoginId());
        e.setUntCreatedOn(LocalDateTime.now());
        return toUnitDto(unitRepo.save(e), "Unit created successfully");
    }

    @Transactional
    public UnitDto updateUnit(Integer id, UnitRequest req) {
        UnitMst e = findUnit(id);
        if (req.unitCode() != null && !req.unitCode().equalsIgnoreCase(e.getUntUnitCode())
                && unitRepo.existsByUntUnitCodeIgnoreCase(req.unitCode())) {
            throw ApiException.conflict("Unit code already exists");
        }
        applyUnit(e, req);
        e.setUntModifiedBy(SecurityUtils.requireLoginId());
        e.setUntModifiedOn(LocalDateTime.now());
        return toUnitDto(unitRepo.save(e), "Unit updated successfully");
    }

    @Transactional
    public MessageResponse deleteUnit(Integer id) {
        UnitMst e = findUnit(id);
        e.setUntIsactive(false);
        e.setUntModifiedBy(SecurityUtils.requireLoginId());
        e.setUntModifiedOn(LocalDateTime.now());
        unitRepo.save(e);
        return MessageResponse.of("Unit deactivated successfully");
    }

    private UnitMst findUnit(Integer id) {
        return unitRepo.findById(id).orElseThrow(() -> ApiException.notFound("Unit not found"));
    }

    private void applyUnit(UnitMst e, UnitRequest req) {
        e.setUntUnitCode(req.unitCode());
        e.setUntUnitName(req.unitName());
        e.setUntDesc(req.desc());
        e.setUntIsactive(req.isActive() == null || req.isActive());
    }

    private UnitDto toUnitDto(UnitMst e, String message) {
        return new UnitDto(e.getUntUnitId(), e.getUntUnitCode(), e.getUntUnitName(), e.getUntDesc(),
                e.getUntIsactive(), e.getUntCreatedBy(), e.getUntCreatedOn(), e.getUntModifiedBy(),
                e.getUntModifiedOn(), message);
    }

    // ---- Categories ----
    @Transactional(readOnly = true)
    public PageResponse<CategoryDto> listCategories(int page, int pageSize, String search, Boolean isActive) {
        Specification<CategoryMst> spec = SpecUtils.combine(
                SpecUtils.activeEquals("catIsactive", isActive),
                SpecUtils.searchContains(search, "catCategoryCode", "catCategoryName"));
        Page<CategoryMst> result = categoryRepo.findAll(spec, PageRequest.of(Math.max(page - 1, 0), pageSize));
        return PageResponse.of(page, pageSize, result.getTotalElements(),
                result.getContent().stream().map(e -> toCategoryDto(e, null)).toList());
    }

    @Transactional(readOnly = true)
    public CategoryDto getCategory(Integer id) {
        return toCategoryDto(findCategory(id), null);
    }

    @Transactional
    public CategoryDto createCategory(CategoryRequest req) {
        requireCode(req.categoryCode(), "categoryCode");
        if (categoryRepo.existsByCatCategoryCodeIgnoreCase(req.categoryCode())) {
            throw ApiException.conflict("Category code already exists");
        }
        CategoryMst e = new CategoryMst();
        applyCategory(e, req);
        e.setCatCreatedBy(SecurityUtils.requireLoginId());
        e.setCatCreatedOn(LocalDateTime.now());
        return toCategoryDto(categoryRepo.save(e), "Category created successfully");
    }

    @Transactional
    public CategoryDto updateCategory(Integer id, CategoryRequest req) {
        CategoryMst e = findCategory(id);
        if (req.categoryCode() != null && !req.categoryCode().equalsIgnoreCase(e.getCatCategoryCode())
                && categoryRepo.existsByCatCategoryCodeIgnoreCase(req.categoryCode())) {
            throw ApiException.conflict("Category code already exists");
        }
        applyCategory(e, req);
        e.setCatModifiedBy(SecurityUtils.requireLoginId());
        e.setCatModifiedOn(LocalDateTime.now());
        return toCategoryDto(categoryRepo.save(e), "Category updated successfully");
    }

    @Transactional
    public MessageResponse deleteCategory(Integer id) {
        CategoryMst e = findCategory(id);
        e.setCatIsactive(false);
        e.setCatModifiedBy(SecurityUtils.requireLoginId());
        e.setCatModifiedOn(LocalDateTime.now());
        categoryRepo.save(e);
        return MessageResponse.of("Category deactivated successfully");
    }

    private CategoryMst findCategory(Integer id) {
        return categoryRepo.findById(id).orElseThrow(() -> ApiException.notFound("Category not found"));
    }

    private void applyCategory(CategoryMst e, CategoryRequest req) {
        e.setCatCategoryCode(req.categoryCode());
        e.setCatCategoryName(req.categoryName());
        e.setCatDesc(req.desc());
        e.setCatIsactive(req.isActive() == null || req.isActive());
    }

    private CategoryDto toCategoryDto(CategoryMst e, String message) {
        return new CategoryDto(e.getCatCategoryId(), e.getCatCategoryCode(), e.getCatCategoryName(), e.getCatDesc(),
                e.getCatIsactive(), e.getCatCreatedBy(), e.getCatCreatedOn(), e.getCatModifiedBy(),
                e.getCatModifiedOn(), message);
    }

    // ---- Subcategories ----
    @Transactional(readOnly = true)
    public PageResponse<SubcategoryDto> listSubcategories(int page, int pageSize, String search, Boolean isActive, Integer categoryId) {
        Specification<SubcategoryMst> spec = SpecUtils.combine(
                SpecUtils.activeEquals("scatIsactive", isActive),
                SpecUtils.searchContains(search, "scatSubcategoryCode", "scatSubcategoryName"),
                SpecUtils.eq("scatCategoryIdCat", categoryId));
        Page<SubcategoryMst> result = subcategoryRepo.findAll(spec, PageRequest.of(Math.max(page - 1, 0), pageSize));
        return PageResponse.of(page, pageSize, result.getTotalElements(),
                result.getContent().stream().map(e -> toSubcategoryDto(e, null)).toList());
    }

    @Transactional(readOnly = true)
    public List<SubcategoryDto> listByCategory(Integer categoryId) {
        findCategory(categoryId);
        return subcategoryRepo.findByScatCategoryIdCat(categoryId).stream()
                .map(e -> toSubcategoryDto(e, null)).toList();
    }

    @Transactional(readOnly = true)
    public SubcategoryDto getSubcategory(Integer id) {
        return toSubcategoryDto(findSubcategory(id), null);
    }

    @Transactional
    public SubcategoryDto createSubcategory(SubcategoryRequest req) {
        requireCode(req.subcategoryCode(), "subcategoryCode");
        if (req.categoryId() == null) throw ApiException.badRequest("categoryId is required");
        findCategory(req.categoryId());
        if (subcategoryRepo.existsByScatSubcategoryCodeIgnoreCase(req.subcategoryCode())) {
            throw ApiException.conflict("Subcategory code already exists");
        }
        SubcategoryMst e = new SubcategoryMst();
        applySubcategory(e, req);
        e.setScatCreatedBy(SecurityUtils.requireLoginId());
        e.setScatCreatedOn(LocalDateTime.now());
        return toSubcategoryDto(subcategoryRepo.save(e), "Sub-Category created successfully");
    }

    @Transactional
    public SubcategoryDto updateSubcategory(Integer id, SubcategoryRequest req) {
        SubcategoryMst e = findSubcategory(id);
        if (req.subcategoryCode() != null && !req.subcategoryCode().equalsIgnoreCase(e.getScatSubcategoryCode())
                && subcategoryRepo.existsByScatSubcategoryCodeIgnoreCase(req.subcategoryCode())) {
            throw ApiException.conflict("Subcategory code already exists");
        }
        if (req.categoryId() != null) findCategory(req.categoryId());
        applySubcategory(e, req);
        e.setScatModifiedBy(SecurityUtils.requireLoginId());
        e.setScatModifiedOn(LocalDateTime.now());
        return toSubcategoryDto(subcategoryRepo.save(e), "Sub-Category updated successfully");
    }

    @Transactional
    public MessageResponse deleteSubcategory(Integer id) {
        SubcategoryMst e = findSubcategory(id);
        e.setScatIsactive(false);
        e.setScatModifiedBy(SecurityUtils.requireLoginId());
        e.setScatModifiedOn(LocalDateTime.now());
        subcategoryRepo.save(e);
        return MessageResponse.of("Sub-Category deactivated successfully");
    }

    private SubcategoryMst findSubcategory(Integer id) {
        return subcategoryRepo.findById(id).orElseThrow(() -> ApiException.notFound("Subcategory not found"));
    }

    private void applySubcategory(SubcategoryMst e, SubcategoryRequest req) {
        e.setScatSubcategoryCode(req.subcategoryCode());
        e.setScatSubcategoryName(req.subcategoryName());
        if (req.categoryId() != null) e.setScatCategoryIdCat(req.categoryId());
        e.setScatDesc(req.desc());
        e.setScatIsactive(req.isActive() == null || req.isActive());
    }

    private SubcategoryDto toSubcategoryDto(SubcategoryMst e, String message) {
        String catName = categoryRepo.findById(e.getScatCategoryIdCat()).map(CategoryMst::getCatCategoryName).orElse(null);
        return new SubcategoryDto(e.getScatSubcategoryId(), e.getScatSubcategoryCode(), e.getScatSubcategoryName(),
                e.getScatCategoryIdCat(), catName, e.getScatDesc(), e.getScatIsactive(),
                e.getScatCreatedBy(), e.getScatCreatedOn(), e.getScatModifiedBy(), e.getScatModifiedOn(), message);
    }

    // ---- General Types ----
    @Transactional(readOnly = true)
    public PageResponse<GentypeDto> listGentypes(int page, int pageSize, String search, Boolean isActive) {
        Specification<GentypeMst> spec = SpecUtils.combine(
                SpecUtils.activeEquals("gtypIsactive", isActive),
                SpecUtils.searchContains(search, "gtypTypeCode", "gtypTypeName"));
        Page<GentypeMst> result = gentypeRepo.findAll(spec, PageRequest.of(Math.max(page - 1, 0), pageSize));
        return PageResponse.of(page, pageSize, result.getTotalElements(),
                result.getContent().stream().map(e -> toGentypeDto(e, null)).toList());
    }

    @Transactional(readOnly = true)
    public GentypeDto getGentype(Integer id) {
        return toGentypeDto(findGentype(id), null);
    }

    @Transactional
    public GentypeDto createGentype(GentypeRequest req) {
        requireCode(req.typeCode(), "typeCode");
        if (gentypeRepo.existsByGtypTypeCodeIgnoreCase(req.typeCode())) {
            throw ApiException.conflict("Type code already exists");
        }
        GentypeMst e = new GentypeMst();
        applyGentype(e, req);
        e.setGtypCreatedBy(SecurityUtils.requireLoginId());
        e.setGtypCreatedOn(LocalDateTime.now());
        return toGentypeDto(gentypeRepo.save(e), "General Type created successfully");
    }

    @Transactional
    public GentypeDto updateGentype(Integer id, GentypeRequest req) {
        GentypeMst e = findGentype(id);
        if (req.typeCode() != null && !req.typeCode().equalsIgnoreCase(e.getGtypTypeCode())
                && gentypeRepo.existsByGtypTypeCodeIgnoreCase(req.typeCode())) {
            throw ApiException.conflict("Type code already exists");
        }
        applyGentype(e, req);
        e.setGtypModifiedBy(SecurityUtils.requireLoginId());
        e.setGtypModifiedOn(LocalDateTime.now());
        return toGentypeDto(gentypeRepo.save(e), "General Type updated successfully");
    }

    @Transactional
    public MessageResponse deleteGentype(Integer id) {
        GentypeMst e = findGentype(id);
        e.setGtypIsactive(false);
        e.setGtypModifiedBy(SecurityUtils.requireLoginId());
        e.setGtypModifiedOn(LocalDateTime.now());
        gentypeRepo.save(e);
        return MessageResponse.of("General Type deactivated successfully");
    }

    private GentypeMst findGentype(Integer id) {
        return gentypeRepo.findById(id).orElseThrow(() -> ApiException.notFound("General type not found"));
    }

    private void applyGentype(GentypeMst e, GentypeRequest req) {
        e.setGtypTypeCode(req.typeCode());
        e.setGtypTypeName(req.typeName());
        e.setGtypDesc(req.desc());
        e.setGtypIsactive(req.isActive() == null || req.isActive());
    }

    private GentypeDto toGentypeDto(GentypeMst e, String message) {
        return new GentypeDto(e.getGtypGentypeId(), e.getGtypTypeCode(), e.getGtypTypeName(), e.getGtypDesc(),
                e.getGtypIsactive(), e.getGtypCreatedBy(), e.getGtypCreatedOn(), e.getGtypModifiedBy(),
                e.getGtypModifiedOn(), message);
    }

    // ---- General Masters ----
    @Transactional(readOnly = true)
    public PageResponse<GenmasterDto> listGenmasters(
            int page, int pageSize, String search, Boolean isActive, Integer gentypeId, String typeCode) {
        Integer resolvedTypeId = gentypeId;
        if (resolvedTypeId == null && typeCode != null && !typeCode.isBlank()) {
            resolvedTypeId = gentypeRepo.findByGtypTypeCodeIgnoreCase(typeCode.trim())
                    .map(GentypeMst::getGtypGentypeId)
                    .orElseThrow(() -> ApiException.notFound("General type not found: " + typeCode));
        }
        Specification<GenmasterMst> spec = SpecUtils.combine(
                SpecUtils.activeEquals("gmstIsactive", isActive),
                SpecUtils.searchContains(search, "gmstValueCode", "gmstValueName"),
                SpecUtils.eq("gmstGentypeIdGtyp", resolvedTypeId));
        Page<GenmasterMst> result = genmasterRepo.findAll(spec, PageRequest.of(Math.max(page - 1, 0), pageSize));
        return PageResponse.of(page, pageSize, result.getTotalElements(),
                result.getContent().stream().map(e -> toGenmasterDto(e, null)).toList());
    }

    @Transactional(readOnly = true)
    public List<GenmasterValueDto> valuesByTypeCode(String typeCode) {
        GentypeMst type = gentypeRepo.findByGtypTypeCodeIgnoreCase(typeCode)
                .orElseThrow(() -> ApiException.notFound("General type not found"));
        return genmasterRepo.findByGmstGentypeIdGtypOrderByGmstSortOrderAsc(type.getGtypGentypeId()).stream()
                .filter(g -> Boolean.TRUE.equals(g.getGmstIsactive()))
                .map(g -> new GenmasterValueDto(g.getGmstGenmasterId(), g.getGmstValueCode(), g.getGmstValueName(), g.getGmstSortOrder()))
                .toList();
    }

    @Transactional(readOnly = true)
    public GenmasterDto getGenmaster(Integer id) {
        return toGenmasterDto(findGenmaster(id), null);
    }

    @Transactional
    public GenmasterDto createGenmaster(GenmasterRequest req) {
        requireCode(req.valueCode(), "valueCode");
        if (req.gentypeId() == null) throw ApiException.badRequest("gentypeId is required");
        findGentype(req.gentypeId());
        if (genmasterRepo.existsByGmstValueCodeIgnoreCaseAndGmstGentypeIdGtyp(req.valueCode(), req.gentypeId())) {
            throw ApiException.conflict("Value code already exists for this type");
        }
        GenmasterMst e = new GenmasterMst();
        applyGenmaster(e, req);
        e.setGmstCreatedBy(SecurityUtils.requireLoginId());
        e.setGmstCreatedOn(LocalDateTime.now());
        return toGenmasterDto(genmasterRepo.save(e), "General Master created successfully");
    }

    @Transactional
    public GenmasterDto updateGenmaster(Integer id, GenmasterRequest req) {
        GenmasterMst e = findGenmaster(id);
        Integer typeId = req.gentypeId() != null ? req.gentypeId() : e.getGmstGentypeIdGtyp();
        if (req.valueCode() != null && (!req.valueCode().equalsIgnoreCase(e.getGmstValueCode())
                || !Objects.equals(typeId, e.getGmstGentypeIdGtyp()))
                && genmasterRepo.existsByGmstValueCodeIgnoreCaseAndGmstGentypeIdGtyp(req.valueCode(), typeId)) {
            throw ApiException.conflict("Value code already exists for this type");
        }
        if (req.gentypeId() != null) findGentype(req.gentypeId());
        applyGenmaster(e, req);
        e.setGmstModifiedBy(SecurityUtils.requireLoginId());
        e.setGmstModifiedOn(LocalDateTime.now());
        return toGenmasterDto(genmasterRepo.save(e), "General Master updated successfully");
    }

    @Transactional
    public MessageResponse deleteGenmaster(Integer id) {
        GenmasterMst e = findGenmaster(id);
        e.setGmstIsactive(false);
        e.setGmstModifiedBy(SecurityUtils.requireLoginId());
        e.setGmstModifiedOn(LocalDateTime.now());
        genmasterRepo.save(e);
        return MessageResponse.of("General Master deactivated successfully");
    }

    private GenmasterMst findGenmaster(Integer id) {
        return genmasterRepo.findById(id).orElseThrow(() -> ApiException.notFound("General master not found"));
    }

    private void applyGenmaster(GenmasterMst e, GenmasterRequest req) {
        e.setGmstValueCode(req.valueCode());
        e.setGmstValueName(req.valueName());
        if (req.gentypeId() != null) e.setGmstGentypeIdGtyp(req.gentypeId());
        e.setGmstSortOrder(req.sortOrder());
        e.setGmstDesc(req.desc());
        e.setGmstIsactive(req.isActive() == null || req.isActive());
    }

    private GenmasterDto toGenmasterDto(GenmasterMst e, String message) {
        return new GenmasterDto(e.getGmstGenmasterId(), e.getGmstValueCode(), e.getGmstValueName(), e.getGmstGentypeIdGtyp(),
                e.getGmstSortOrder(), e.getGmstDesc(), e.getGmstIsactive(), e.getGmstCreatedBy(), e.getGmstCreatedOn(),
                e.getGmstModifiedBy(), e.getGmstModifiedOn(), message);
    }

    private static void requireCode(String code, String field) {
        if (code == null || code.isBlank()) throw ApiException.badRequest(field + " is required");
    }
}
