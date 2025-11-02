package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.CartDTO;
import com.ecommerce.backend.dto.CartItemDTO;
import com.ecommerce.backend.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class CartController {
    
    private final CartService cartService;
    
    @GetMapping("/{userId}")
    public ResponseEntity<CartDTO> getCart(@PathVariable UUID userId) {
        CartDTO cart = cartService.getCartByUserId(userId);
        return ResponseEntity.ok(cart);
    }
    
    @PostMapping("/{userId}/add")
    public ResponseEntity<CartItemDTO> addToCart(
            @PathVariable UUID userId,
            @RequestParam UUID productId,
            @RequestParam(defaultValue = "1") Integer quantity) {
        CartItemDTO cartItem = cartService.addToCart(userId, productId, quantity);
        return ResponseEntity.ok(cartItem);
    }
    
    @PutMapping("/{userId}/update")
    public ResponseEntity<CartItemDTO> updateCartItem(
            @PathVariable UUID userId,
            @RequestParam UUID productId,
            @RequestParam Integer quantity) {
        CartItemDTO cartItem = cartService.updateCartItem(userId, productId, quantity);
        return ResponseEntity.ok(cartItem);
    }
    
    @DeleteMapping("/{userId}/remove")
    public ResponseEntity<Void> removeFromCart(
            @PathVariable UUID userId,
            @RequestParam UUID productId) {
        cartService.removeFromCart(userId, productId);
        return ResponseEntity.noContent().build();
    }
    
    @DeleteMapping("/{userId}/clear")
    public ResponseEntity<Void> clearCart(@PathVariable UUID userId) {
        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/{userId}/count")
    public ResponseEntity<Long> getCartItemCount(@PathVariable UUID userId) {
        long count = cartService.getCartItemCount(userId);
        return ResponseEntity.ok(count);
    }
}

