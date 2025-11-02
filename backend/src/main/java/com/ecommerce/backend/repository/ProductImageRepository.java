package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, UUID> {
    
    List<ProductImage> findByProductId(UUID productId);
    
    Optional<ProductImage> findByProductIdAndIsPrimaryTrue(UUID productId);
    
    List<ProductImage> findByProductIdOrderByDisplayOrderAsc(UUID productId);
    
    void deleteByProductId(UUID productId);
}

