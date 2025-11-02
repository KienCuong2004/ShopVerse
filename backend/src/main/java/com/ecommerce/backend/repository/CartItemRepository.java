package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, UUID> {
    
    List<CartItem> findByUserId(UUID userId);
    
    Optional<CartItem> findByUserIdAndProductId(UUID userId, UUID productId);
    
    boolean existsByUserIdAndProductId(UUID userId, UUID productId);
    
    void deleteByUserId(UUID userId);
    
    void deleteByUserIdAndProductId(UUID userId, UUID productId);
    
    long countByUserId(UUID userId);
}

