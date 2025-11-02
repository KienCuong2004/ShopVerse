package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.CartDTO;
import com.ecommerce.backend.dto.CartItemDTO;
import com.ecommerce.backend.exception.InsufficientStockException;
import com.ecommerce.backend.exception.InvalidRequestException;
import com.ecommerce.backend.exception.ResourceNotFoundException;
import com.ecommerce.backend.model.CartItem;
import com.ecommerce.backend.model.Product;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.repository.CartItemRepository;
import com.ecommerce.backend.repository.ProductRepository;
import com.ecommerce.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {
    
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    
    public CartDTO getCartByUserId(UUID userId) {
        List<CartItem> cartItems = cartItemRepository.findByUserId(userId);
        List<CartItemDTO> cartItemDTOs = cartItems.stream()
                .map(CartItemDTO::new)
                .collect(Collectors.toList());
        return new CartDTO(cartItemDTOs);
    }
    
    @Transactional
    public CartItemDTO addToCart(UUID userId, UUID productId, Integer quantity) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        
        // Check stock availability
        if (product.getStockQuantity() < quantity) {
            throw new InsufficientStockException(product.getName(), quantity, product.getStockQuantity());
        }
        
        // Check if product is active
        if (product.getStatus() != Product.ProductStatus.ACTIVE) {
            throw new InvalidRequestException("Product is not available");
        }
        
        // Check if item already exists in cart
        CartItem existingItem = cartItemRepository.findByUserIdAndProductId(userId, productId)
                .orElse(null);
        
        if (existingItem != null) {
            // Update quantity
            int newQuantity = existingItem.getQuantity() + quantity;
            if (product.getStockQuantity() < newQuantity) {
                throw new InsufficientStockException(product.getName(), newQuantity, product.getStockQuantity());
            }
            existingItem.setQuantity(newQuantity);
            CartItem savedItem = cartItemRepository.save(existingItem);
            return new CartItemDTO(savedItem);
        } else {
            // Create new cart item
            CartItem cartItem = new CartItem();
            cartItem.setUser(user);
            cartItem.setProduct(product);
            cartItem.setQuantity(quantity);
            
            CartItem savedItem = cartItemRepository.save(cartItem);
            return new CartItemDTO(savedItem);
        }
    }
    
    @Transactional
    public CartItemDTO updateCartItem(UUID userId, UUID productId, Integer quantity) {
        if (quantity <= 0) {
            throw new InvalidRequestException("Quantity must be greater than 0");
        }
        
        CartItem cartItem = cartItemRepository.findByUserIdAndProductId(userId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item", "userId and productId", userId + "/" + productId));
        
        // Check stock availability
        if (cartItem.getProduct().getStockQuantity() < quantity) {
            throw new InsufficientStockException(cartItem.getProduct().getName(), quantity, cartItem.getProduct().getStockQuantity());
        }
        
        cartItem.setQuantity(quantity);
        CartItem savedItem = cartItemRepository.save(cartItem);
        return new CartItemDTO(savedItem);
    }
    
    @Transactional
    public void removeFromCart(UUID userId, UUID productId) {
        if (!cartItemRepository.existsByUserIdAndProductId(userId, productId)) {
            throw new ResourceNotFoundException("Cart item", "userId and productId", userId + "/" + productId);
        }
        cartItemRepository.deleteByUserIdAndProductId(userId, productId);
    }
    
    @Transactional
    public void clearCart(UUID userId) {
        cartItemRepository.deleteByUserId(userId);
    }
    
    public long getCartItemCount(UUID userId) {
        return cartItemRepository.countByUserId(userId);
    }
}

