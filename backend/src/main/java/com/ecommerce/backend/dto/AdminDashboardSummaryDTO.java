package com.ecommerce.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDashboardSummaryDTO {

    private BigDecimal totalRevenue;
    private BigDecimal revenue30Days;
    private long totalOrders;
    private long pendingOrders;
    private long deliveredOrders;
    private long totalCustomers;
    private long newCustomers;
    private long totalProducts;
    private long lowStockProducts;
    private long activeBanners;
    private long activeCoupons;
}

