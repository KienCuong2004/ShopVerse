package com.ecommerce.backend.dto;

import com.ecommerce.backend.model.Payment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDTO {
    
    private UUID id;
    private UUID orderId;
    private String orderNumber;
    private String paymentMethod;
    private String transactionId;
    private BigDecimal amount;
    private Payment.PaymentStatus status;
    private LocalDateTime paymentDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructor to convert from Entity
    public PaymentDTO(Payment payment) {
        this.id = payment.getId();
        this.orderId = payment.getOrder().getId();
        this.orderNumber = payment.getOrder().getOrderNumber();
        this.paymentMethod = payment.getPaymentMethod();
        this.transactionId = payment.getTransactionId();
        this.amount = payment.getAmount();
        this.status = payment.getStatus();
        this.paymentDate = payment.getPaymentDate();
        this.createdAt = payment.getCreatedAt();
        this.updatedAt = payment.getUpdatedAt();
    }
}

