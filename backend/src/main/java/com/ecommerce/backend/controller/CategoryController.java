package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.CategoryDTO;
import com.ecommerce.backend.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class CategoryController {
    
    private final CategoryService categoryService;
    
    @GetMapping
    public ResponseEntity<List<CategoryDTO>> getAllCategories() {
        List<CategoryDTO> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(categories);
    }
    
    @GetMapping("/main")
    public ResponseEntity<List<CategoryDTO>> getMainCategories() {
        List<CategoryDTO> categories = categoryService.getMainCategories();
        return ResponseEntity.ok(categories);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CategoryDTO> getCategoryById(@PathVariable UUID id) {
        CategoryDTO category = categoryService.getCategoryById(id);
        return ResponseEntity.ok(category);
    }
    
    @GetMapping("/{id}/subcategories")
    public ResponseEntity<List<CategoryDTO>> getSubCategories(@PathVariable UUID id) {
        List<CategoryDTO> subCategories = categoryService.getSubCategories(id);
        return ResponseEntity.ok(subCategories);
    }
    
    @GetMapping("/name/{name}")
    public ResponseEntity<CategoryDTO> getCategoryByName(@PathVariable String name) {
        CategoryDTO category = categoryService.getCategoryByName(name);
        return ResponseEntity.ok(category);
    }
}

