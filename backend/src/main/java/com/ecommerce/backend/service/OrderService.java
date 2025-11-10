package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.OrderDTO;
import com.ecommerce.backend.dto.OrderRequestDTO;
import com.ecommerce.backend.dto.OrderSummaryDTO;
import com.ecommerce.backend.dto.OrderUpdateRequestDTO;
import com.ecommerce.backend.exception.InsufficientStockException;
import com.ecommerce.backend.exception.InvalidRequestException;
import com.ecommerce.backend.exception.ResourceNotFoundException;
import com.ecommerce.backend.model.*;
import com.ecommerce.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import jakarta.persistence.criteria.JoinType;

@Service
@RequiredArgsConstructor
public class OrderService {
    
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;

    private static final Map<Order.OrderStatus, Set<Order.OrderStatus>> ALLOWED_STATUS_TRANSITIONS =
            new EnumMap<>(Order.OrderStatus.class);

    static {
        ALLOWED_STATUS_TRANSITIONS.put(
                Order.OrderStatus.PENDING,
                EnumSet.of(
                        Order.OrderStatus.CONFIRMED,
                        Order.OrderStatus.PROCESSING,
                        Order.OrderStatus.SHIPPED,
                        Order.OrderStatus.CANCELLED));
        ALLOWED_STATUS_TRANSITIONS.put(
                Order.OrderStatus.CONFIRMED,
                EnumSet.of(
                        Order.OrderStatus.PROCESSING,
                        Order.OrderStatus.SHIPPED,
                        Order.OrderStatus.CANCELLED));
        ALLOWED_STATUS_TRANSITIONS.put(
                Order.OrderStatus.PROCESSING,
                EnumSet.of(
                        Order.OrderStatus.SHIPPED,
                        Order.OrderStatus.CANCELLED));
        ALLOWED_STATUS_TRANSITIONS.put(
                Order.OrderStatus.SHIPPED,
                EnumSet.of(
                        Order.OrderStatus.DELIVERED,
                        Order.OrderStatus.CANCELLED));
        ALLOWED_STATUS_TRANSITIONS.put(
                Order.OrderStatus.DELIVERED,
                EnumSet.of(Order.OrderStatus.REFUNDED));
        ALLOWED_STATUS_TRANSITIONS.put(
                Order.OrderStatus.CANCELLED,
                EnumSet.noneOf(Order.OrderStatus.class));
        ALLOWED_STATUS_TRANSITIONS.put(
                Order.OrderStatus.REFUNDED,
                EnumSet.noneOf(Order.OrderStatus.class));
    }
    
    public OrderDTO getOrderById(UUID id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
        initializeOrder(order);
        return new OrderDTO(order);
    }
    
    public OrderDTO getOrderByOrderNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "orderNumber", orderNumber));
        initializeOrder(order);
        return new OrderDTO(order);
    }
    
    public Page<OrderDTO> getOrdersByUserId(UUID userId, Pageable pageable) {
        Page<Order> page = orderRepository.findByUserId(userId, pageable);
        page.getContent().forEach(this::initializeOrder);
        return page.map(OrderDTO::new);
    }
    
    public List<OrderDTO> getAllOrdersByUserId(UUID userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .peek(this::initializeOrder)
                .map(OrderDTO::new)
                .collect(Collectors.toList());
    }
    
    public Page<OrderDTO> getOrdersByStatus(Order.OrderStatus status, Pageable pageable) {
        Page<Order> page = orderRepository.findByStatus(status, pageable);
        page.getContent().forEach(this::initializeOrder);
        return page.map(OrderDTO::new);
    }

    @Transactional(readOnly = true)
    public Page<OrderDTO> getOrders(
            String keyword,
            UUID customerId,
            Order.OrderStatus status,
            Order.PaymentStatus paymentStatus,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable) {

        Specification<Order> specification =
                buildOrderSpecification(keyword, customerId, status, paymentStatus, startDate, endDate);

        Page<Order> page = orderRepository.findAll(specification, pageable);
        page.getContent().forEach(this::initializeOrder);
        return page.map(OrderDTO::new);
    }

    @Transactional(readOnly = true)
    public OrderSummaryDTO getOrdersSummary(
            String keyword,
            UUID customerId,
            Order.OrderStatus status,
            Order.PaymentStatus paymentStatus,
            LocalDate startDate,
            LocalDate endDate) {

        Specification<Order> specification =
                buildOrderSpecification(keyword, customerId, status, paymentStatus, startDate, endDate);

        List<Order> orders = orderRepository.findAll(specification);
        orders.forEach(this::initializeOrder);

        long totalOrders = orders.size();
        long pendingOrders = orders.stream()
                .filter(order -> order.getStatus() == Order.OrderStatus.PENDING
                        || order.getStatus() == Order.OrderStatus.CONFIRMED)
                .count();
        long shippingOrders = orders.stream()
                .filter(order -> order.getStatus() == Order.OrderStatus.PROCESSING
                        || order.getStatus() == Order.OrderStatus.SHIPPED)
                .count();
        long completedOrders = orders.stream()
                .filter(order -> order.getStatus() == Order.OrderStatus.DELIVERED)
                .count();
        long cancelledOrders = orders.stream()
                .filter(order -> order.getStatus() == Order.OrderStatus.CANCELLED
                        || order.getStatus() == Order.OrderStatus.REFUNDED)
                .count();

        BigDecimal totalRevenue = orders.stream()
                .filter(order -> order.getStatus() == Order.OrderStatus.DELIVERED
                        || order.getPaymentStatus() == Order.PaymentStatus.PAID)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new OrderSummaryDTO(
                totalOrders,
                pendingOrders,
                shippingOrders,
                completedOrders,
                cancelledOrders,
                totalRevenue);
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
    public OrderDTO updateOrder(UUID orderId, OrderUpdateRequestDTO requestDTO) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        boolean hasChanges = false;

        if (requestDTO.getStatus() != null && requestDTO.getStatus() != order.getStatus()) {
            validateStatusTransition(order.getStatus(), requestDTO.getStatus());
            order.setStatus(requestDTO.getStatus());
            hasChanges = true;
        }

        if (requestDTO.getPaymentStatus() != null && requestDTO.getPaymentStatus() != order.getPaymentStatus()) {
            order.setPaymentStatus(requestDTO.getPaymentStatus());
            hasChanges = true;
        }

        if (requestDTO.getAdminNotes() != null) {
            String trimmed = requestDTO.getAdminNotes().trim();
            order.setAdminNotes(trimmed.isEmpty() ? null : trimmed);
            hasChanges = true;
        }

        if (!hasChanges) {
            initializeOrder(order);
            return new OrderDTO(order);
        }

        Order updatedOrder = orderRepository.save(order);
        initializeOrder(updatedOrder);
        return new OrderDTO(updatedOrder);
    }

    @Transactional
    public OrderDTO updateOrderStatus(UUID orderId, Order.OrderStatus status) {
        OrderUpdateRequestDTO request = new OrderUpdateRequestDTO();
        request.setStatus(status);
        return updateOrder(orderId, request);
    }
    
    @Transactional
    public OrderDTO updatePaymentStatus(UUID orderId, Order.PaymentStatus paymentStatus) {
        OrderUpdateRequestDTO request = new OrderUpdateRequestDTO();
        request.setPaymentStatus(paymentStatus);
        return updateOrder(orderId, request);
    }

    private Specification<Order> buildOrderSpecification(
            String keyword,
            UUID customerId,
            Order.OrderStatus status,
            Order.PaymentStatus paymentStatus,
            LocalDate startDate,
            LocalDate endDate) {

        Specification<Order> specification = Specification.allOf();

        if (keyword != null && !keyword.trim().isEmpty()) {
            final String likeValue = "%" + keyword.trim().toLowerCase() + "%";
            specification = specification.and((root, query, cb) -> {
                var userJoin = root.join("user", JoinType.LEFT);
                return cb.or(
                        cb.like(cb.lower(root.get("orderNumber")), likeValue),
                        cb.like(cb.lower(root.get("shippingName")), likeValue),
                        cb.like(cb.lower(root.get("shippingPhone")), likeValue),
                        cb.like(cb.lower(userJoin.get("username")), likeValue),
                        cb.like(cb.lower(userJoin.get("email")), likeValue));
            });
        }

        if (customerId != null) {
            specification = specification.and(
                    (root, query, cb) -> cb.equal(root.join("user", JoinType.LEFT).get("id"), customerId));
        }

        if (status != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }

        if (paymentStatus != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("paymentStatus"), paymentStatus));
        }

        if (startDate != null) {
            LocalDateTime start = startDate.atStartOfDay();
            specification = specification.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), start));
        }

        if (endDate != null) {
            LocalDateTime end = endDate.atTime(LocalTime.MAX);
            specification = specification.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), end));
        }

        return specification;
    }

    private void initializeOrder(Order order) {
        if (order.getUser() != null) {
            order.getUser().getUsername();
        }
        if (order.getOrderItems() != null) {
            order.getOrderItems().forEach(orderItem -> {
                if (orderItem.getProduct() != null) {
                    orderItem.getProduct().getName();
                }
            });
        }
    }

    private void validateStatusTransition(Order.OrderStatus current, Order.OrderStatus next) {
        if (next == null || current == next) {
            return;
        }
        Set<Order.OrderStatus> allowed = ALLOWED_STATUS_TRANSITIONS.getOrDefault(current, EnumSet.noneOf(Order.OrderStatus.class));
        if (!allowed.contains(next)) {
            throw new InvalidRequestException(
                    String.format("Không thể chuyển trạng thái đơn hàng từ %s sang %s", current, next));
        }
    }
    
    private String generateOrderNumber() {
        return "ORD-" + System.currentTimeMillis();
    }
}

