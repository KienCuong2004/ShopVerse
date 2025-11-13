package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.CouponRequestDTO;
import com.ecommerce.backend.dto.CouponResponseDTO;
import com.ecommerce.backend.exception.InvalidRequestException;
import com.ecommerce.backend.exception.ResourceAlreadyExistsException;
import com.ecommerce.backend.exception.ResourceNotFoundException;
import com.ecommerce.backend.model.Coupon;
import com.ecommerce.backend.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;

    @Transactional(readOnly = true)
    public List<CouponResponseDTO> getAllCoupons() {
        return couponRepository.findAll()
                .stream()
                .sorted((a, b) -> {
                    boolean aActive = Boolean.TRUE.equals(a.getActive());
                    boolean bActive = Boolean.TRUE.equals(b.getActive());
                    if (aActive != bActive) {
                        return Boolean.compare(bActive, aActive);
                    }
                    if (a.getStartAt() != null && b.getStartAt() != null) {
                        return a.getStartAt().compareTo(b.getStartAt());
                    }
                    return a.getCreatedAt().compareTo(b.getCreatedAt());
                })
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CouponResponseDTO createCoupon(CouponRequestDTO request) {
        validateCouponRequest(request, null);

        Coupon coupon = new Coupon();
        coupon.setUsageCount(0);
        applyRequestToEntity(coupon, request);

        Coupon saved = couponRepository.save(coupon);
        return mapToResponse(saved);
    }

    @Transactional
    public CouponResponseDTO updateCoupon(UUID couponId, CouponRequestDTO request) {
        validateCouponRequest(request, couponId);

        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon", "id", couponId));

        applyRequestToEntity(coupon, request);
        Coupon saved = couponRepository.save(coupon);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteCoupon(UUID couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon", "id", couponId));
        couponRepository.delete(coupon);
    }

    private void validateCouponRequest(CouponRequestDTO request, UUID couponId) {
        String normalizedCode = request.getCode().trim().toUpperCase();
        boolean exists = couponId == null
                ? couponRepository.existsByCodeIgnoreCase(normalizedCode)
                : couponRepository.existsByCodeIgnoreCaseAndIdNot(normalizedCode, couponId);

        if (exists) {
            throw new ResourceAlreadyExistsException("Coupon", "code", normalizedCode);
        }

        if (request.getDiscountType() == Coupon.DiscountType.PERCENTAGE) {
            if (request.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new InvalidRequestException("Phần trăm giảm giá không được vượt quá 100%");
            }
            if (request.getMaxDiscountValue() == null) {
                throw new InvalidRequestException("Vui lòng thiết lập mức giảm tối đa cho mã giảm giá phần trăm");
            }
        }

        if (request.getDiscountType() == Coupon.DiscountType.FIXED_AMOUNT) {
            if (request.getMaxDiscountValue() != null
                    && request.getMaxDiscountValue().compareTo(request.getDiscountValue()) < 0) {
                throw new InvalidRequestException("Mức giảm tối đa không được nhỏ hơn giá trị giảm cố định");
            }
        }

        if (request.getUsageLimit() != null && request.getPerUserLimit() != null
                && request.getPerUserLimit() > request.getUsageLimit()) {
            throw new InvalidRequestException("Giới hạn mỗi khách hàng không được lớn hơn tổng số lượt sử dụng");
        }

        if (request.getStartAt() != null && request.getEndAt() != null
                && request.getEndAt().isBefore(request.getStartAt())) {
            throw new InvalidRequestException("Thời gian kết thúc chương trình phải sau thời gian bắt đầu");
        }
    }

    private void applyRequestToEntity(Coupon coupon, CouponRequestDTO request) {
        coupon.setCode(request.getCode().trim().toUpperCase());
        coupon.setName(request.getName().trim());
        coupon.setDescription(normalize(request.getDescription()));
        coupon.setDiscountType(request.getDiscountType());
        coupon.setDiscountValue(request.getDiscountValue());
        coupon.setMaxDiscountValue(request.getMaxDiscountValue());
        coupon.setMinimumOrderValue(request.getMinimumOrderValue());
        coupon.setUsageLimit(request.getUsageLimit());
        coupon.setPerUserLimit(request.getPerUserLimit());

        if (coupon.getUsageLimit() != null
                && coupon.getUsageCount() != null
                && coupon.getUsageCount() > coupon.getUsageLimit()) {
            throw new InvalidRequestException("Số lượt sử dụng hiện tại vượt quá giới hạn mới");
        }

        coupon.setActive(request.getActive() == null || request.getActive());
        coupon.setSegment(request.getSegment());
        coupon.setStartAt(toLocalDateTime(request.getStartAt()));
        coupon.setEndAt(toLocalDateTime(request.getEndAt()));
    }

    private CouponResponseDTO mapToResponse(Coupon coupon) {
        return CouponResponseDTO.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .name(coupon.getName())
                .description(coupon.getDescription())
                .discountType(coupon.getDiscountType())
                .discountValue(coupon.getDiscountValue())
                .maxDiscountValue(coupon.getMaxDiscountValue())
                .minimumOrderValue(coupon.getMinimumOrderValue())
                .usageLimit(coupon.getUsageLimit())
                .perUserLimit(coupon.getPerUserLimit())
                .usageCount(coupon.getUsageCount())
                .active(Boolean.TRUE.equals(coupon.getActive()))
                .segment(coupon.getSegment())
                .status(deriveStatus(coupon))
                .startAt(toOffsetDateTime(coupon.getStartAt()))
                .endAt(toOffsetDateTime(coupon.getEndAt()))
                .createdAt(toOffsetDateTime(coupon.getCreatedAt()))
                .updatedAt(toOffsetDateTime(coupon.getUpdatedAt()))
                .build();
    }

    private String deriveStatus(Coupon coupon) {
        if (!Boolean.TRUE.equals(coupon.getActive())) {
            return "INACTIVE";
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = coupon.getStartAt();
        LocalDateTime end = coupon.getEndAt();

        if (start != null && start.isAfter(now)) {
            return "UPCOMING";
        }

        if (end != null && end.isBefore(now)) {
            return "EXPIRED";
        }

        return "ACTIVE";
    }

    private OffsetDateTime toOffsetDateTime(LocalDateTime localDateTime) {
        return localDateTime == null
                ? null
                : localDateTime.atZone(ZoneId.systemDefault()).toOffsetDateTime();
    }

    private LocalDateTime toLocalDateTime(OffsetDateTime offsetDateTime) {
        return offsetDateTime == null
                ? null
                : offsetDateTime.atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();
    }

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}

