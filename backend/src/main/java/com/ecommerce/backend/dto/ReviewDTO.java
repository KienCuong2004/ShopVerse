package com.ecommerce.backend.dto;

import com.ecommerce.backend.model.Review;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewDTO {
    
    private UUID id;
    private UUID userId;
    private String username;
    private UUID productId;
    private String productName;
    private UUID orderId;
    
    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating;
    
    private String comment;
    private Review.ReviewStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructor to convert from Entity
    public ReviewDTO(Review review) {
        this.id = review.getId();
        this.userId = review.getUser().getId();
        this.username = review.getUser().getUsername();
        this.productId = review.getProduct().getId();
        this.productName = review.getProduct().getName();
        
        if (review.getOrder() != null) {
            this.orderId = review.getOrder().getId();
        }
        
        this.rating = review.getRating();
        this.comment = review.getComment();
        this.status = review.getStatus();
        this.createdAt = review.getCreatedAt();
        this.updatedAt = review.getUpdatedAt();
    }
}

