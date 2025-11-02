package com.ecommerce.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequestDTO {
    
    @NotNull(message = "Shipping address is required")
    @NotBlank(message = "Shipping address cannot be empty")
    private String shippingAddress;
    
    @NotBlank(message = "Shipping phone is required")
    private String shippingPhone;
    
    @NotBlank(message = "Shipping name is required")
    private String shippingName;
    
    private String paymentMethod;
    
    private String notes;
    
    @NotNull(message = "Cart items are required")
    private List<UUID> cartItemIds;
}

