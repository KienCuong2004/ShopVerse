package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.CategoryDTO;
import com.ecommerce.backend.exception.ResourceAlreadyExistsException;
import com.ecommerce.backend.exception.ResourceNotFoundException;
import com.ecommerce.backend.model.Category;
import com.ecommerce.backend.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {
    
    private final CategoryRepository categoryRepository;
    
    @Transactional(readOnly = true)
    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(CategoryDTO::new)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<CategoryDTO> getMainCategories() {
        return categoryRepository.findByParentIsNull().stream()
                .map(CategoryDTO::new)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<CategoryDTO> getSubCategories(UUID parentId) {
        return categoryRepository.findByParentId(parentId).stream()
                .map(CategoryDTO::new)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public CategoryDTO getCategoryById(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        return new CategoryDTO(category);
    }
    
    @Transactional(readOnly = true)
    public CategoryDTO getCategoryByName(String name) {
        Category category = categoryRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "name", name));
        return new CategoryDTO(category);
    }
    
    @Transactional
    public CategoryDTO createCategory(String name, String description, String imageUrl, UUID parentId) {
        if (categoryRepository.existsByName(name)) {
            throw new ResourceAlreadyExistsException("Category", "name", name);
        }
        
        Category category = new Category();
        category.setName(name);
        category.setDescription(description);
        category.setImageUrl(imageUrl);
        
        if (parentId != null) {
            Category parent = categoryRepository.findById(parentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Parent Category", "id", parentId));
            category.setParent(parent);
        }
        
        Category savedCategory = categoryRepository.save(category);
        return new CategoryDTO(savedCategory);
    }
}

