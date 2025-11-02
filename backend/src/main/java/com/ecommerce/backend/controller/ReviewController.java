package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.ReviewDTO;
import com.ecommerce.backend.dto.ReviewRequestDTO;
import com.ecommerce.backend.service.ReviewService;
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
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class ReviewController {
    
    private final ReviewService reviewService;
    
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ReviewDTO>> getAllReviewsByProductId(@PathVariable UUID productId) {
        List<ReviewDTO> reviews = reviewService.getAllReviewsByProductId(productId);
        return ResponseEntity.ok(reviews);
    }
    
    @GetMapping("/product/{productId}/page")
    public ResponseEntity<Page<ReviewDTO>> getReviewsByProductId(
            @PathVariable UUID productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<ReviewDTO> reviews = reviewService.getReviewsByProductId(productId, pageable);
        return ResponseEntity.ok(reviews);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ReviewDTO> getReviewById(@PathVariable UUID id) {
        ReviewDTO review = reviewService.getReviewById(id);
        return ResponseEntity.ok(review);
    }
    
    @PostMapping("/{userId}")
    public ResponseEntity<ReviewDTO> createReview(
            @PathVariable UUID userId,
            @Valid @RequestBody ReviewRequestDTO reviewRequestDTO) {
        ReviewDTO review = reviewService.createReview(userId, reviewRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(review);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ReviewDTO> updateReview(
            @PathVariable UUID id,
            @Valid @RequestBody ReviewRequestDTO reviewRequestDTO) {
        ReviewDTO review = reviewService.updateReview(id, reviewRequestDTO);
        return ResponseEntity.ok(review);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable UUID id) {
        reviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }
}

