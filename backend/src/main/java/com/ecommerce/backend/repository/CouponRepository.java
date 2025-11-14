package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, UUID> {

    Optional<Coupon> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);
    
    boolean existsByCodeIgnoreCaseAndIdNot(String code, UUID id);

    long countByActiveTrue();
}

