package com.ecommerce.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDashboardResponseDTO {

    private AdminDashboardSummaryDTO summary;
    private List<RevenueTrendPointDTO> revenueTrend;
    private List<RecentOrderDTO> recentOrders;
}

