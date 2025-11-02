package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.OrderDTO;
import com.ecommerce.backend.dto.OrderRequestDTO;
import com.ecommerce.backend.model.Order;
import com.ecommerce.backend.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class OrderController {
    
    private final OrderService orderService;
    
    @GetMapping("/{id}")
    public ResponseEntity<OrderDTO> getOrderById(@PathVariable UUID id) {
        OrderDTO order = orderService.getOrderById(id);
        return ResponseEntity.ok(order);
    }
    
    @GetMapping("/number/{orderNumber}")
    public ResponseEntity<OrderDTO> getOrderByOrderNumber(@PathVariable String orderNumber) {
        OrderDTO order = orderService.getOrderByOrderNumber(orderNumber);
        return ResponseEntity.ok(order);
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<OrderDTO>> getAllOrdersByUserId(@PathVariable UUID userId) {
        List<OrderDTO> orders = orderService.getAllOrdersByUserId(userId);
        return ResponseEntity.ok(orders);
    }
    
    @GetMapping("/user/{userId}/page")
    public ResponseEntity<Page<OrderDTO>> getOrdersByUserId(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<OrderDTO> orders = orderService.getOrdersByUserId(userId, pageable);
        return ResponseEntity.ok(orders);
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<Page<OrderDTO>> getOrdersByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Order.OrderStatus orderStatus = Order.OrderStatus.valueOf(status.toUpperCase());
        Page<OrderDTO> orders = orderService.getOrdersByStatus(orderStatus, pageable);
        return ResponseEntity.ok(orders);
    }
    
    @PostMapping("/{userId}")
    public ResponseEntity<OrderDTO> createOrder(
            @PathVariable UUID userId,
            @Valid @RequestBody OrderRequestDTO orderRequestDTO) {
        OrderDTO order = orderService.createOrder(userId, orderRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<OrderDTO> updateOrderStatus(
            @PathVariable UUID id,
            @RequestParam String status) {
        Order.OrderStatus orderStatus = Order.OrderStatus.valueOf(status.toUpperCase());
        OrderDTO order = orderService.updateOrderStatus(id, orderStatus);
        return ResponseEntity.ok(order);
    }
    
    @PutMapping("/{id}/payment-status")
    public ResponseEntity<OrderDTO> updatePaymentStatus(
            @PathVariable UUID id,
            @RequestParam String paymentStatus) {
        Order.PaymentStatus paymentStatusEnum = Order.PaymentStatus.valueOf(paymentStatus.toUpperCase());
        OrderDTO order = orderService.updatePaymentStatus(id, paymentStatusEnum);
        return ResponseEntity.ok(order);
    }
}

