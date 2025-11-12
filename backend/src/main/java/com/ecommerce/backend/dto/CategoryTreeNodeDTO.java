package com.ecommerce.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryTreeNodeDTO {

    private UUID id;
    private String name;
    private String description;
    private String imageUrl;
    private UUID parentId;
    private String parentName;
    private Integer displayOrder;
    private Long productCount;
    private Long totalProductCount;
    private Integer depth;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<CategoryTreeNodeDTO> children = new ArrayList<>();

    public void addChild(CategoryTreeNodeDTO child) {
        if (children == null) {
            children = new ArrayList<>();
        }
        children.add(child);
    }
}

