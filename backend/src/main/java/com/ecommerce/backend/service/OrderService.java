package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.OrderDTO;
import com.ecommerce.backend.dto.OrderRequestDTO;
import com.ecommerce.backend.exception.InsufficientStockException;
import com.ecommerce.backend.exception.InvalidRequestException;
import com.ecommerce.backend.exception.ResourceNotFoundException;
import com.ecommerce.backend.model.*;
import com.ecommerce.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {
    
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    
    public OrderDTO getOrderById(UUID id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
        return new OrderDTO(order);
    }
    
    public OrderDTO getOrderByOrderNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "orderNumber", orderNumber));
        return new OrderDTO(order);
    }
    
    public Page<OrderDTO> getOrdersByUserId(UUID userId, Pageable pageable) {
        return orderRepository.findByUserId(userId, pageable)
                .map(OrderDTO::new);
    }
    
    public List<OrderDTO> getAllOrdersByUserId(UUID userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(OrderDTO::new)
                .collect(Collectors.toList());
    }
    
    public Page<OrderDTO> getOrdersByStatus(Order.OrderStatus status, Pageable pageable) {
        return orderRepository.findByStatus(status, pageable)
                .map(OrderDTO::new);
    }
    
    @Transactional
    public OrderDTO createOrder(UUID userId, OrderRequestDTO orderRequestDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        // Get cart items
        List<CartItem> cartItems = cartItemRepository.findByUserId(userId);
        if (cartItems.isEmpty()) {
            throw new InvalidRequestException("Cart is empty");
        }
        
        // Validate cart items
        for (UUID cartItemId : orderRequestDTO.getCartItemIds()) {
            CartItem cartItem = cartItemRepository.findById(cartItemId)
                    .orElseThrow(() -> new ResourceNotFoundException("Cart item", "id", cartItemId));
            
            if (!cartItem.getUser().getId().equals(userId)) {
                throw new InvalidRequestException("Cart item does not belong to user");
            }
            
            // Check stock
            if (cartItem.getProduct().getStockQuantity() < cartItem.getQuantity()) {
                throw new InsufficientStockException(
                        cartItem.getProduct().getName(), 
                        cartItem.getQuantity(), 
                        cartItem.getProduct().getStockQuantity());
            }
        }
        
        // Create order
        Order order = new Order();
        order.setUser(user);
        order.setOrderNumber(generateOrderNumber());
        order.setShippingAddress(orderRequestDTO.getShippingAddress());
        order.setShippingPhone(orderRequestDTO.getShippingPhone());
        order.setShippingName(orderRequestDTO.getShippingName());
        order.setPaymentMethod(orderRequestDTO.getPaymentMethod());
        order.setNotes(orderRequestDTO.getNotes());
        order.setStatus(Order.OrderStatus.PENDING);
        order.setPaymentStatus(Order.PaymentStatus.PENDING);
        
        // Create order items and calculate total
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (UUID cartItemId : orderRequestDTO.getCartItemIds()) {
            CartItem cartItem = cartItemRepository.findById(cartItemId).orElseThrow();
            
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(cartItem.getProduct());
            orderItem.setProductName(cartItem.getProduct().getName());
            
            BigDecimal price = cartItem.getProduct().getDiscountPrice() != null 
                    ? cartItem.getProduct().getDiscountPrice() 
                    : cartItem.getProduct().getPrice();
            orderItem.setProductPrice(price);
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setSubtotal(price.multiply(BigDecimal.valueOf(cartItem.getQuantity())));
            
            totalAmount = totalAmount.add(orderItem.getSubtotal());
            
            // Update product stock
            Product product = cartItem.getProduct();
            product.setStockQuantity(product.getStockQuantity() - cartItem.getQuantity());
            if (product.getStockQuantity() == 0) {
                product.setStatus(Product.ProductStatus.OUT_OF_STOCK);
            }
            productRepository.save(product);
        }
        
        order.setTotalAmount(totalAmount);
        Order savedOrder = orderRepository.save(order);
        
        // Create order items (after order is saved)
        for (UUID cartItemId : orderRequestDTO.getCartItemIds()) {
            CartItem cartItem = cartItemRepository.findById(cartItemId).orElseThrow();
            
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(savedOrder);
            orderItem.setProduct(cartItem.getProduct());
            orderItem.setProductName(cartItem.getProduct().getName());
            
            BigDecimal price = cartItem.getProduct().getDiscountPrice() != null 
                    ? cartItem.getProduct().getDiscountPrice() 
                    : cartItem.getProduct().getPrice();
            orderItem.setProductPrice(price);
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setSubtotal(price.multiply(BigDecimal.valueOf(cartItem.getQuantity())));
            
            orderItemRepository.save(orderItem);
            
            // Remove from cart
            cartItemRepository.delete(cartItem);
        }
        
        return new OrderDTO(savedOrder);
    }
    
    @Transactional
    public OrderDTO updateOrderStatus(UUID orderId, Order.OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        order.setStatus(status);
        Order updatedOrder = orderRepository.save(order);
        return new OrderDTO(updatedOrder);
    }
    
    @Transactional
    public OrderDTO updatePaymentStatus(UUID orderId, Order.PaymentStatus paymentStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        order.setPaymentStatus(paymentStatus);
        
        if (paymentStatus == Order.PaymentStatus.PAID) {
            order.setStatus(Order.OrderStatus.CONFIRMED);
        }
        
        Order updatedOrder = orderRepository.save(order);
        return new OrderDTO(updatedOrder);
    }
    
    private String generateOrderNumber() {
        return "ORD-" + System.currentTimeMillis();
    }
}

