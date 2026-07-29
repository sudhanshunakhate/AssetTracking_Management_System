package com.caits.modules.masters.controller;

import com.caits.common.MessageResponse;
import com.caits.common.PageResponse;
import com.caits.modules.masters.dto.MasterDtos.*;
import com.caits.modules.masters.service.ItemMastersService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class ItemMastersController {

    private final ItemMastersService service;

    public ItemMastersController(ItemMastersService service) {
        this.service = service;
    }

    @GetMapping("/items")
    public PageResponse<ItemDto> listItems(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive) {
        return service.listItems(page, pageSize, search, isActive);
    }

    @GetMapping("/items/{id}")
    public ItemDto getItem(@PathVariable Integer id) {
        return service.getItem(id);
    }

    @PostMapping("/items")
    public ResponseEntity<ItemDto> createItem(@RequestBody ItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createItem(request));
    }

    @PutMapping("/items/{id}")
    public ItemDto updateItem(@PathVariable Integer id, @RequestBody ItemRequest request) {
        return service.updateItem(id, request);
    }

    @DeleteMapping("/items/{id}")
    public MessageResponse deleteItem(@PathVariable Integer id) {
        return service.deleteItem(id);
    }

    @GetMapping("/vendors")
    public PageResponse<VendorDto> listVendors(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive) {
        return service.listVendors(page, pageSize, search, isActive);
    }

    @GetMapping("/vendors/{id}")
    public VendorDto getVendor(@PathVariable Integer id) {
        return service.getVendor(id);
    }

    @PostMapping("/vendors")
    public ResponseEntity<VendorDto> createVendor(@RequestBody VendorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createVendor(request));
    }

    @PutMapping("/vendors/{id}")
    public VendorDto updateVendor(@PathVariable Integer id, @RequestBody VendorRequest request) {
        return service.updateVendor(id, request);
    }

    @DeleteMapping("/vendors/{id}")
    public MessageResponse deleteVendor(@PathVariable Integer id) {
        return service.deleteVendor(id);
    }

    @GetMapping("/stock")
    public PageResponse<StockDto> listStock(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) Integer itemId,
            @RequestParam(required = false) Integer locationId) {
        return service.listStock(page, pageSize, search, isActive, itemId, locationId);
    }

    @GetMapping("/stock/{itemId}/{locationId}")
    public StockDetailDto getStock(@PathVariable Integer itemId, @PathVariable Integer locationId) {
        return service.getStock(itemId, locationId);
    }
}
