package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.CategoryDTO;
import com.ecommerce.backend.dto.CategoryRequestDTO;
import com.ecommerce.backend.dto.CategoryReorderRequestDTO;
import com.ecommerce.backend.dto.CategoryTreeNodeDTO;
import com.ecommerce.backend.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
@Validated
@CrossOrigin(origins = "http://localhost:3000")
public class AdminCategoryController {
    
    private final CategoryService categoryService;
    
    @GetMapping("/tree")
    public ResponseEntity<List<CategoryTreeNodeDTO>> getCategoryTree() {
        return ResponseEntity.ok(categoryService.getAdminCategoryTree());
    }
    
    @PostMapping
    public ResponseEntity<CategoryDTO> createCategory(@Valid @RequestBody CategoryRequestDTO request) {
        CategoryDTO createdCategory = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdCategory);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<CategoryDTO> updateCategory(@PathVariable UUID id,
                                                      @Valid @RequestBody CategoryRequestDTO request) {
        CategoryDTO updatedCategory = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(updatedCategory);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable UUID id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/reorder")
    public ResponseEntity<Void> reorderCategories(@Valid @RequestBody CategoryReorderRequestDTO request) {
        categoryService.reorderCategories(request);
        return ResponseEntity.noContent().build();
    }
}

