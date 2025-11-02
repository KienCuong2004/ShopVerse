package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.ReviewDTO;
import com.ecommerce.backend.dto.ReviewRequestDTO;
import com.ecommerce.backend.exception.InvalidRequestException;
import com.ecommerce.backend.exception.ResourceAlreadyExistsException;
import com.ecommerce.backend.exception.ResourceNotFoundException;
import com.ecommerce.backend.model.Order;
import com.ecommerce.backend.model.Product;
import com.ecommerce.backend.model.Review;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.repository.OrderRepository;
import com.ecommerce.backend.repository.ProductRepository;
import com.ecommerce.backend.repository.ReviewRepository;
import com.ecommerce.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {
    
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    
    public Page<ReviewDTO> getReviewsByProductId(UUID productId, Pageable pageable) {
        return reviewRepository.findByProductIdAndStatus(productId, Review.ReviewStatus.APPROVED, pageable)
                .map(ReviewDTO::new);
    }
    
    public List<ReviewDTO> getAllReviewsByProductId(UUID productId) {
        return reviewRepository.findByProductIdAndStatus(productId, Review.ReviewStatus.APPROVED).stream()
                .map(ReviewDTO::new)
                .collect(Collectors.toList());
    }
    
    public ReviewDTO getReviewById(UUID id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", id));
        return new ReviewDTO(review);
    }
    
    @Transactional
    public ReviewDTO createReview(UUID userId, ReviewRequestDTO reviewRequestDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        Product product = productRepository.findById(reviewRequestDTO.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", reviewRequestDTO.getProductId()));
        
        Order order = null;
        if (reviewRequestDTO.getOrderId() != null) {
            order = orderRepository.findById(reviewRequestDTO.getOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Order", "id", reviewRequestDTO.getOrderId()));
            
            // Verify order belongs to user
            if (!order.getUser().getId().equals(userId)) {
                throw new InvalidRequestException("Order does not belong to user");
            }
        }
        
        // Check if review already exists
        if (reviewRequestDTO.getOrderId() != null) {
            if (reviewRepository.existsByUserIdAndProductIdAndOrderId(
                    userId, reviewRequestDTO.getProductId(), reviewRequestDTO.getOrderId())) {
                throw new ResourceAlreadyExistsException("Review", "userId, productId, orderId", 
                        userId + "/" + reviewRequestDTO.getProductId() + "/" + reviewRequestDTO.getOrderId());
            }
        }
        
        // Create review
        Review review = new Review();
        review.setUser(user);
        review.setProduct(product);
        review.setOrder(order);
        review.setRating(reviewRequestDTO.getRating());
        review.setComment(reviewRequestDTO.getComment());
        review.setStatus(Review.ReviewStatus.APPROVED);
        
        Review savedReview = reviewRepository.save(review);
        
        // Update product rating
        updateProductRating(product.getId());
        
        return new ReviewDTO(savedReview);
    }
    
    @Transactional
    public ReviewDTO updateReview(UUID reviewId, ReviewRequestDTO reviewRequestDTO) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));
        
        review.setRating(reviewRequestDTO.getRating());
        review.setComment(reviewRequestDTO.getComment());
        
        Review updatedReview = reviewRepository.save(review);
        
        // Update product rating
        updateProductRating(review.getProduct().getId());
        
        return new ReviewDTO(updatedReview);
    }
    
    @Transactional
    public void deleteReview(UUID reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));
        
        UUID productId = review.getProduct().getId();
        reviewRepository.delete(review);
        
        // Update product rating
        updateProductRating(productId);
    }
    
    private void updateProductRating(UUID productId) {
        BigDecimal averageRating = reviewRepository.calculateAverageRatingByProductId(productId);
        long totalReviews = reviewRepository.countApprovedReviewsByProductId(productId);
        
        Product product = productRepository.findById(productId).orElseThrow();
        
        if (averageRating != null) {
            product.setRating(averageRating.setScale(2, RoundingMode.HALF_UP));
        } else {
            product.setRating(BigDecimal.ZERO);
        }
        product.setTotalReviews((int) totalReviews);
        
        productRepository.save(product);
    }
}

