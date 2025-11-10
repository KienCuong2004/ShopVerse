package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.Order;
import com.ecommerce.backend.model.Order.OrderStatus;
import com.ecommerce.backend.model.Order.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID>, JpaSpecificationExecutor<Order> {
    
    Optional<Order> findByOrderNumber(String orderNumber);
    
    boolean existsByOrderNumber(String orderNumber);
    
    List<Order> findByUserId(UUID userId);
    
    Page<Order> findByUserId(UUID userId, Pageable pageable);
    
    List<Order> findByStatus(OrderStatus status);
    
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);
    
    List<Order> findByPaymentStatus(PaymentStatus paymentStatus);
    
    Page<Order> findByUserIdAndStatus(UUID userId, OrderStatus status, Pageable pageable);
    
    List<Order> findByUserIdOrderByCreatedAtDesc(UUID userId);
}

