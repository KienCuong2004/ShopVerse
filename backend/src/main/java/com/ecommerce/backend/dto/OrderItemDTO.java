package com.ecommerce.backend.dto;

import com.ecommerce.backend.model.OrderItem;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemDTO {
    
    private UUID id;
    private UUID orderId;
    private UUID productId;
    private String productName;
    private String productImageUrl;
    private BigDecimal productPrice;
    private Integer quantity;
    private BigDecimal subtotal;
    private LocalDateTime createdAt;
    
    // Constructor to convert from Entity
    public OrderItemDTO(OrderItem orderItem) {
        this.id = orderItem.getId();
        this.orderId = orderItem.getOrder().getId();
        
        if (orderItem.getProduct() != null) {
            this.productId = orderItem.getProduct().getId();
            this.productImageUrl = orderItem.getProduct().getImageUrl();
        }
        
        this.productName = orderItem.getProductName();
        this.productPrice = orderItem.getProductPrice();
        this.quantity = orderItem.getQuantity();
        this.subtotal = orderItem.getSubtotal();
        this.createdAt = orderItem.getCreatedAt();
    }
}

