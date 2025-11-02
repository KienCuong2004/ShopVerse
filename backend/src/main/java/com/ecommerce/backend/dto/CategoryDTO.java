package com.ecommerce.backend.dto;

import com.ecommerce.backend.model.Category;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDTO {
    
    private UUID id;
    private String name;
    private String description;
    private String imageUrl;
    private UUID parentId;
    private String parentName;
    private List<CategoryDTO> subCategories;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructor to convert from Entity
    public CategoryDTO(Category category) {
        this.id = category.getId();
        this.name = category.getName();
        this.description = category.getDescription();
        this.imageUrl = category.getImageUrl();
        
        if (category.getParent() != null) {
            this.parentId = category.getParent().getId();
            this.parentName = category.getParent().getName();
        }
        
        if (category.getSubCategories() != null && !category.getSubCategories().isEmpty()) {
            this.subCategories = category.getSubCategories().stream()
                    .map(CategoryDTO::new)
                    .collect(Collectors.toList());
        }
        
        this.createdAt = category.getCreatedAt();
        this.updatedAt = category.getUpdatedAt();
    }
}

