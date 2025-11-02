package com.ecommerce.backend.dto;

import com.ecommerce.backend.model.Order;
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
public class OrderDTO {
    
    private UUID id;
    private UUID userId;
    private String username;
    private String orderNumber;
    private BigDecimal totalAmount;
    private String shippingAddress;
    private String shippingPhone;
    private String shippingName;
    private Order.OrderStatus status;
    private String paymentMethod;
    private Order.PaymentStatus paymentStatus;
    private String notes;
    private List<OrderItemDTO> orderItems;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructor to convert from Entity
    public OrderDTO(Order order) {
        this.id = order.getId();
        
        if (order.getUser() != null) {
            this.userId = order.getUser().getId();
            this.username = order.getUser().getUsername();
        }
        
        this.orderNumber = order.getOrderNumber();
        this.totalAmount = order.getTotalAmount();
        this.shippingAddress = order.getShippingAddress();
        this.shippingPhone = order.getShippingPhone();
        this.shippingName = order.getShippingName();
        this.status = order.getStatus();
        this.paymentMethod = order.getPaymentMethod();
        this.paymentStatus = order.getPaymentStatus();
        this.notes = order.getNotes();
        
        if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
            this.orderItems = order.getOrderItems().stream()
                    .map(OrderItemDTO::new)
                    .collect(Collectors.toList());
        }
        
        this.createdAt = order.getCreatedAt();
        this.updatedAt = order.getUpdatedAt();
    }
}

