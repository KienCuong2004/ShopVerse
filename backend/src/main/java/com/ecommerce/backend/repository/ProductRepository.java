package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.Product;
import com.ecommerce.backend.model.Product.ProductStatus;
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
public interface ProductRepository extends JpaRepository<Product, UUID> {
    
    Optional<Product> findBySku(String sku);
    
    boolean existsBySku(String sku);
    
    List<Product> findByCategoryId(UUID categoryId);
    
    Page<Product> findByCategoryId(UUID categoryId, Pageable pageable);
    
    List<Product> findByStatus(ProductStatus status);
    
    Page<Product> findByStatus(ProductStatus status, Pageable pageable);
    
    Page<Product> findByCategoryIdAndStatus(UUID categoryId, ProductStatus status, Pageable pageable);
    
    @Query("SELECT p FROM Product p WHERE " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Product> searchProducts(@Param("keyword") String keyword, Pageable pageable);
    
    @Query("SELECT p FROM Product p WHERE p.price BETWEEN :minPrice AND :maxPrice")
    Page<Product> findByPriceBetween(@Param("minPrice") BigDecimal minPrice, 
                                     @Param("maxPrice") BigDecimal maxPrice, 
                                     Pageable pageable);
    
    @Query("SELECT p FROM Product p WHERE p.rating >= :minRating")
    Page<Product> findByMinRating(@Param("minRating") BigDecimal minRating, Pageable pageable);
    
    List<Product> findByStockQuantityGreaterThan(Integer quantity);
}

