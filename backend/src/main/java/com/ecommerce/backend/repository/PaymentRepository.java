package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.Payment;
import com.ecommerce.backend.model.Payment.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    
    List<Payment> findByOrderId(UUID orderId);
    
    Optional<Payment> findByTransactionId(String transactionId);
    
    List<Payment> findByStatus(PaymentStatus status);
    
    List<Payment> findByPaymentMethod(String paymentMethod);
    
    List<Payment> findByOrderIdAndStatus(UUID orderId, PaymentStatus status);
}

