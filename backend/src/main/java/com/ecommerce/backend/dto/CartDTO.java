package com.ecommerce.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartDTO {
    
    private List<CartItemDTO> items;
    private Integer totalItems;
    private BigDecimal totalAmount;
    private BigDecimal totalDiscount;
    private BigDecimal finalAmount;
    
    public CartDTO(List<CartItemDTO> items) {
        this.items = items;
        this.totalItems = items != null ? items.size() : 0;
        
        if (items != null && !items.isEmpty()) {
            this.totalAmount = items.stream()
                    .map(item -> item.getProductPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            this.totalDiscount = items.stream()
                    .filter(item -> item.getDiscountPrice() != null)
                    .map(item -> {
                        BigDecimal discount = item.getProductPrice().subtract(item.getDiscountPrice());
                        return discount.multiply(BigDecimal.valueOf(item.getQuantity()));
                    })
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            this.finalAmount = items.stream()
                    .map(CartItemDTO::getSubtotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        } else {
            this.totalAmount = BigDecimal.ZERO;
            this.totalDiscount = BigDecimal.ZERO;
            this.finalAmount = BigDecimal.ZERO;
        }
    }
}

