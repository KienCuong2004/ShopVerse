package com.ecommerce.backend.dto;

import com.ecommerce.backend.model.Product;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequestDTO {
    
    @NotBlank(message = "Product name is required")
    private String name;
    
    private String description;
    
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", message = "Price must be positive")
    private BigDecimal price;
    
    @DecimalMin(value = "0.0", message = "Discount price must be positive")
    private BigDecimal discountPrice;
    
    @NotNull(message = "Stock quantity is required")
    @Min(value = 0, message = "Stock quantity must be non-negative")
    private Integer stockQuantity;
    
    private String sku;
    
    @NotNull(message = "Category ID is required")
    private UUID categoryId;
    
    private String imageUrl;
    
    private List<String> imageUrls;
    
    private Product.ProductStatus status = Product.ProductStatus.ACTIVE;
}

