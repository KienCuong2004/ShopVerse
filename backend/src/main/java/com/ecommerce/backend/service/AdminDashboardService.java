package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.AdminDashboardResponseDTO;
import com.ecommerce.backend.dto.AdminDashboardSummaryDTO;
import com.ecommerce.backend.dto.RecentOrderDTO;
import com.ecommerce.backend.dto.RevenueTrendPointDTO;
import com.ecommerce.backend.model.Order;
import com.ecommerce.backend.model.Order.OrderStatus;
import com.ecommerce.backend.model.Order.PaymentStatus;
import com.ecommerce.backend.model.User.UserRole;
import com.ecommerce.backend.repository.BannerRepository;
import com.ecommerce.backend.repository.CouponRepository;
import com.ecommerce.backend.repository.OrderRepository;
import com.ecommerce.backend.repository.ProductRepository;
import com.ecommerce.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private static final int DEFAULT_RECENT_ORDER_LIMIT = 5;
    private static final int REVENUE_TREND_DAYS = 7;
    private static final int LOW_STOCK_THRESHOLD = 5;

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final BannerRepository bannerRepository;
    private final CouponRepository couponRepository;

    @Transactional(readOnly = true)
    public AdminDashboardResponseDTO getDashboardOverview() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thirtyDaysAgo = now.minusDays(30);

        AdminDashboardSummaryDTO summary = AdminDashboardSummaryDTO.builder()
                .totalRevenue(safe(orderRepository.sumTotalAmountByPaymentStatus(PaymentStatus.PAID)))
                .revenue30Days(safe(orderRepository.sumTotalAmountByPaymentStatusSince(PaymentStatus.PAID, thirtyDaysAgo)))
                .totalOrders(orderRepository.count())
                .pendingOrders(orderRepository.countByStatus(OrderStatus.PENDING))
                .deliveredOrders(orderRepository.countByStatus(OrderStatus.DELIVERED))
                .totalCustomers(userRepository.countByRole(UserRole.USER))
                .newCustomers(userRepository.countByRoleAndCreatedAtAfter(UserRole.USER, thirtyDaysAgo))
                .totalProducts(productRepository.count())
                .lowStockProducts(productRepository.countByStockQuantityLessThanEqual(LOW_STOCK_THRESHOLD))
                .activeBanners(bannerRepository.countByActiveTrue())
                .activeCoupons(couponRepository.countByActiveTrue())
                .build();

        List<RevenueTrendPointDTO> revenueTrend = buildRevenueTrend(now);

        List<RecentOrderDTO> recentOrders = orderRepository.findTop5ByOrderByCreatedAtDesc()
                .stream()
                .limit(DEFAULT_RECENT_ORDER_LIMIT)
                .map(this::mapToRecentOrderDTO)
                .toList();

        return AdminDashboardResponseDTO.builder()
                .summary(summary)
                .revenueTrend(revenueTrend)
                .recentOrders(recentOrders)
                .build();
    }

    private List<RevenueTrendPointDTO> buildRevenueTrend(LocalDateTime now) {
        LocalDate endDate = now.toLocalDate();
        LocalDate startDate = endDate.minusDays(REVENUE_TREND_DAYS - 1L);
        LocalDateTime startDateTime = startDate.atStartOfDay();

        Map<LocalDate, RevenueTrendPointDTO> trendPoints = new LinkedHashMap<>();
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            trendPoints.put(
                    current,
                    RevenueTrendPointDTO.builder()
                            .date(current)
                            .revenue(BigDecimal.ZERO)
                            .orderCount(0)
                            .build()
            );
            current = current.plusDays(1);
        }

        orderRepository.findByPaymentStatusAndCreatedAtBetween(PaymentStatus.PAID, startDateTime, now)
                .forEach(order -> {
                    LocalDate orderDate = order.getCreatedAt().toLocalDate();
                    RevenueTrendPointDTO point = trendPoints.get(orderDate);
                    if (point != null) {
                        point.setRevenue(point.getRevenue().add(safe(order.getTotalAmount())));
                        point.setOrderCount(point.getOrderCount() + 1);
                    }
                });

        return new ArrayList<>(trendPoints.values());
    }

    private RecentOrderDTO mapToRecentOrderDTO(Order order) {
        return RecentOrderDTO.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .customerName(order.getUser() != null ? order.getUser().getFullName() : null)
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .paymentStatus(order.getPaymentStatus())
                .createdAt(order.getCreatedAt())
                .build();
    }

    private BigDecimal safe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}

