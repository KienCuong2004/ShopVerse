package com.ecommerce.backend.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderSummaryDTO {

    private long totalOrders;
    private long pendingOrders;
    private long shippingOrders;
    private long completedOrders;
    private long cancelledOrders;
    private BigDecimal totalRevenue;
}

