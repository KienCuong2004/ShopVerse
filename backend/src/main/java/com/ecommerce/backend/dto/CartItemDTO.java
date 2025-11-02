package com.ecommerce.backend.dto;

import com.ecommerce.backend.model.CartItem;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartItemDTO {
    
    private UUID id;
    private UUID userId;
    private UUID productId;
    private String productName;
    private String productImageUrl;
    private BigDecimal productPrice;
    private BigDecimal discountPrice;
    private Integer quantity;
    private BigDecimal subtotal;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructor to convert from Entity
    public CartItemDTO(CartItem cartItem) {
        this.id = cartItem.getId();
        this.userId = cartItem.getUser().getId();
        this.productId = cartItem.getProduct().getId();
        this.productName = cartItem.getProduct().getName();
        this.productImageUrl = cartItem.getProduct().getImageUrl();
        this.productPrice = cartItem.getProduct().getPrice();
        this.discountPrice = cartItem.getProduct().getDiscountPrice();
        this.quantity = cartItem.getQuantity();
        
        // Calculate subtotal
        BigDecimal price = cartItem.getProduct().getDiscountPrice() != null 
                ? cartItem.getProduct().getDiscountPrice() 
                : cartItem.getProduct().getPrice();
        this.subtotal = price.multiply(BigDecimal.valueOf(cartItem.getQuantity()));
        
        this.createdAt = cartItem.getCreatedAt();
        this.updatedAt = cartItem.getUpdatedAt();
    }
}

