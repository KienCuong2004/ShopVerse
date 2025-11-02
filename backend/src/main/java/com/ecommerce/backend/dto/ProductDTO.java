package com.ecommerce.backend.dto;

import com.ecommerce.backend.model.Product;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {
    
    private UUID id;
    private String name;
    private String description;
    private BigDecimal price;
    private BigDecimal discountPrice;
    private Integer stockQuantity;
    private String sku;
    private UUID categoryId;
    private String categoryName;
    private String imageUrl;
    private List<String> imageUrls;
    private Product.ProductStatus status;
    private BigDecimal rating;
    private Integer totalReviews;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructor to convert from Entity
    public ProductDTO(Product product) {
        this.id = product.getId();
        this.name = product.getName();
        this.description = product.getDescription();
        this.price = product.getPrice();
        this.discountPrice = product.getDiscountPrice();
        this.stockQuantity = product.getStockQuantity();
        this.sku = product.getSku();
        
        if (product.getCategory() != null) {
            this.categoryId = product.getCategory().getId();
            this.categoryName = product.getCategory().getName();
        }
        
        this.imageUrl = product.getImageUrl();
        
        if (product.getImages() != null && !product.getImages().isEmpty()) {
            this.imageUrls = product.getImages().stream()
                    .map(img -> img.getImageUrl())
                    .collect(Collectors.toList());
        }
        
        this.status = product.getStatus();
        this.rating = product.getRating();
        this.totalReviews = product.getTotalReviews();
        this.createdAt = product.getCreatedAt();
        this.updatedAt = product.getUpdatedAt();
    }
}

