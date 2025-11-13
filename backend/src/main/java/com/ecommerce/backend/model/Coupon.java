package com.ecommerce.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "coupons")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 20)
    private DiscountType discountType;

    @Column(name = "discount_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "max_discount_value", precision = 10, scale = 2)
    private BigDecimal maxDiscountValue;

    @Column(name = "minimum_order_value", precision = 10, scale = 2)
    private BigDecimal minimumOrderValue;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Column(name = "per_user_limit")
    private Integer perUserLimit;

    @Column(name = "usage_count", nullable = false, columnDefinition = "integer default 0")
    private Integer usageCount = 0;

    @Column(name = "is_active", nullable = false, columnDefinition = "boolean default true")
    private Boolean active = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "segment", nullable = false, length = 50)
    private CustomerSegment segment = CustomerSegment.ALL;

    @Column(name = "start_at")
    private LocalDateTime startAt;

    @Column(name = "end_at")
    private LocalDateTime endAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        if (usageCount == null) {
            usageCount = 0;
        }
        if (active == null) {
            active = true;
        }
        if (segment == null) {
            segment = CustomerSegment.ALL;
        }
    }

    @PreUpdate
    public void onUpdate() {
        if (usageCount == null) {
            usageCount = 0;
        }
        if (active == null) {
            active = true;
        }
        if (segment == null) {
            segment = CustomerSegment.ALL;
        }
    }

    public enum DiscountType {
        PERCENTAGE,
        FIXED_AMOUNT
    }

    public enum CustomerSegment {
        ALL,
        NEW_CUSTOMER,
        RETURNING_CUSTOMER,
        VIP_CUSTOMER
    }
}

