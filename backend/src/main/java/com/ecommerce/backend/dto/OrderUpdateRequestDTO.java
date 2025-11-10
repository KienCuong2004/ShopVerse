package com.ecommerce.backend.dto;

import com.ecommerce.backend.model.Order;
import lombok.Data;

@Data
public class OrderUpdateRequestDTO {

    private Order.OrderStatus status;

    private Order.PaymentStatus paymentStatus;

    private String adminNotes;
}

