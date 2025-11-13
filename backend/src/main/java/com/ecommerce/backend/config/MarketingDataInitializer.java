package com.ecommerce.backend.config;

import com.ecommerce.backend.model.Banner;
import com.ecommerce.backend.model.Coupon;
import com.ecommerce.backend.repository.BannerRepository;
import com.ecommerce.backend.repository.CouponRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class MarketingDataInitializer {

    private final BannerRepository bannerRepository;
    private final CouponRepository couponRepository;

    @PostConstruct
    @Transactional
    public void initializeMarketingData() {
        initializeBanners();
        initializeCoupons();
    }

    private void initializeBanners() {
        if (bannerRepository.count() > 0) {
            return;
        }

        log.info("[MARKETING] No banners found, seeding demo banners.");

        Banner novemberSale = new Banner();
        novemberSale.setTitle("Super Sale Tháng 11");
        novemberSale.setSubtitle("Giảm đến 50%");
        novemberSale.setDescription("Săn ưu đãi cực sốc cho hàng ngàn sản phẩm điện tử.");
        novemberSale.setImageUrl("/assets/images/products/iphone-15-pro-main.jpg");
        novemberSale.setButtonText("Mua ngay");
        novemberSale.setButtonLink("/products?category=electronics");
        novemberSale.setDisplayOrder(0);
        novemberSale.setActive(true);
        novemberSale.setScheduleStart(LocalDateTime.now().minusDays(1));
        novemberSale.setScheduleEnd(LocalDateTime.now().plusDays(15));

        Banner winterCollection = new Banner();
        winterCollection.setTitle("Thời Trang Đông Ấm Áp");
        winterCollection.setSubtitle("Ưu đãi độc quyền");
        winterCollection.setDescription("Bộ sưu tập thời trang mùa đông 2025 với nhiều mẫu mới.");
        winterCollection.setImageUrl("/assets/images/products/leather-jacket-main.jpg");
        winterCollection.setButtonText("Khám phá");
        winterCollection.setButtonLink("/products?category=clothing");
        winterCollection.setDisplayOrder(1);
        winterCollection.setActive(true);
        winterCollection.setScheduleStart(LocalDateTime.now().plusDays(2));
        winterCollection.setScheduleEnd(LocalDateTime.now().plusDays(30));

        bannerRepository.saveAll(List.of(novemberSale, winterCollection));
    }

    private void initializeCoupons() {
        if (couponRepository.count() > 0) {
            return;
        }

        log.info("[MARKETING] No coupons found, seeding demo coupons.");

        Coupon welcomeCoupon = new Coupon();
        welcomeCoupon.setCode("WELCOME2025");
        welcomeCoupon.setName("Ưu đãi khách hàng mới");
        welcomeCoupon.setDescription("Giảm 15% cho đơn hàng đầu tiên của bạn.");
        welcomeCoupon.setDiscountType(Coupon.DiscountType.PERCENTAGE);
        welcomeCoupon.setDiscountValue(BigDecimal.valueOf(15));
        welcomeCoupon.setMaxDiscountValue(BigDecimal.valueOf(300_000));
        welcomeCoupon.setMinimumOrderValue(BigDecimal.valueOf(500_000));
        welcomeCoupon.setUsageLimit(1000);
        welcomeCoupon.setPerUserLimit(1);
        welcomeCoupon.setUsageCount(0);
        welcomeCoupon.setActive(true);
        welcomeCoupon.setSegment(Coupon.CustomerSegment.NEW_CUSTOMER);
        welcomeCoupon.setStartAt(LocalDateTime.now().minusDays(7));
        welcomeCoupon.setEndAt(LocalDateTime.now().plusDays(60));

        Coupon vipCoupon = new Coupon();
        vipCoupon.setCode("VIP500K");
        vipCoupon.setName("Quà tặng VIP");
        vipCoupon.setDescription("Giảm ngay 500.000đ cho khách hàng VIP.");
        vipCoupon.setDiscountType(Coupon.DiscountType.FIXED_AMOUNT);
        vipCoupon.setDiscountValue(BigDecimal.valueOf(500_000));
        vipCoupon.setMaxDiscountValue(BigDecimal.valueOf(500_000));
        vipCoupon.setMinimumOrderValue(BigDecimal.valueOf(1_500_000));
        vipCoupon.setUsageLimit(200);
        vipCoupon.setPerUserLimit(2);
        vipCoupon.setUsageCount(0);
        vipCoupon.setActive(true);
        vipCoupon.setSegment(Coupon.CustomerSegment.VIP_CUSTOMER);
        vipCoupon.setStartAt(LocalDateTime.now());
        vipCoupon.setEndAt(LocalDateTime.now().plusDays(90));

        couponRepository.saveAll(List.of(welcomeCoupon, vipCoupon));
    }
}

