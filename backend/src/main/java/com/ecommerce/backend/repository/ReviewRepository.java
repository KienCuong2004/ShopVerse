package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.Review;
import com.ecommerce.backend.model.Review.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {
    
    List<Review> findByProductId(UUID productId);
    
    Page<Review> findByProductId(UUID productId, Pageable pageable);
    
    List<Review> findByProductIdAndStatus(UUID productId, ReviewStatus status);
    
    Page<Review> findByProductIdAndStatus(UUID productId, ReviewStatus status, Pageable pageable);
    
    List<Review> findByUserId(UUID userId);
    
    Optional<Review> findByUserIdAndProductIdAndOrderId(UUID userId, UUID productId, UUID orderId);
    
    boolean existsByUserIdAndProductIdAndOrderId(UUID userId, UUID productId, UUID orderId);
    
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId AND r.status = 'APPROVED'")
    BigDecimal calculateAverageRatingByProductId(@Param("productId") UUID productId);
    
    @Query("SELECT COUNT(r) FROM Review r WHERE r.product.id = :productId AND r.status = 'APPROVED'")
    long countApprovedReviewsByProductId(@Param("productId") UUID productId);
}

