package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.ProductDTO;
import com.ecommerce.backend.dto.ProductRequestDTO;
import com.ecommerce.backend.exception.ResourceAlreadyExistsException;
import com.ecommerce.backend.exception.ResourceNotFoundException;
import com.ecommerce.backend.model.Category;
import com.ecommerce.backend.model.Product;
import com.ecommerce.backend.model.ProductImage;
import com.ecommerce.backend.repository.CategoryRepository;
import com.ecommerce.backend.repository.ProductImageRepository;
import com.ecommerce.backend.repository.ProductRepository;
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
public class ProductService {
    
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductImageRepository productImageRepository;
    
    public Page<ProductDTO> getAllProducts(Pageable pageable) {
        return productRepository.findAll(pageable)
                .map(ProductDTO::new);
    }
    
    public ProductDTO getProductById(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        return new ProductDTO(product);
    }
    
    public ProductDTO getProductBySku(String sku) {
        Product product = productRepository.findBySku(sku)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "sku", sku));
        return new ProductDTO(product);
    }
    
    public Page<ProductDTO> getProductsByCategory(UUID categoryId, Pageable pageable) {
        return productRepository.findByCategoryId(categoryId, pageable)
                .map(ProductDTO::new);
    }
    
    public Page<ProductDTO> getProductsByStatus(Product.ProductStatus status, Pageable pageable) {
        return productRepository.findByStatus(status, pageable)
                .map(ProductDTO::new);
    }
    
    public Page<ProductDTO> searchProducts(String keyword, Pageable pageable) {
        return productRepository.searchProducts(keyword, pageable)
                .map(ProductDTO::new);
    }
    
    public Page<ProductDTO> getProductsByPriceRange(BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable) {
        return productRepository.findByPriceBetween(minPrice, maxPrice, pageable)
                .map(ProductDTO::new);
    }
    
    public Page<ProductDTO> getProductsByMinRating(BigDecimal minRating, Pageable pageable) {
        return productRepository.findByMinRating(minRating, pageable)
                .map(ProductDTO::new);
    }
    
    @Transactional
    public ProductDTO createProduct(ProductRequestDTO productRequestDTO) {
        // Check if SKU already exists
        if (productRequestDTO.getSku() != null && 
            productRepository.existsBySku(productRequestDTO.getSku())) {
            throw new ResourceAlreadyExistsException("Product", "sku", productRequestDTO.getSku());
        }
        
        // Get category
        Category category = categoryRepository.findById(productRequestDTO.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", productRequestDTO.getCategoryId()));
        
        // Create product
        Product product = new Product();
        product.setName(productRequestDTO.getName());
        product.setDescription(productRequestDTO.getDescription());
        product.setPrice(productRequestDTO.getPrice());
        product.setDiscountPrice(productRequestDTO.getDiscountPrice());
        product.setStockQuantity(productRequestDTO.getStockQuantity());
        product.setSku(productRequestDTO.getSku());
        product.setCategory(category);
        product.setImageUrl(productRequestDTO.getImageUrl());
        product.setStatus(productRequestDTO.getStatus());
        product.setRating(BigDecimal.ZERO);
        product.setTotalReviews(0);
        
        Product savedProduct = productRepository.save(product);
        
        // Add product images
        if (productRequestDTO.getImageUrls() != null && !productRequestDTO.getImageUrls().isEmpty()) {
            for (int i = 0; i < productRequestDTO.getImageUrls().size(); i++) {
                ProductImage image = new ProductImage();
                image.setProduct(savedProduct);
                image.setImageUrl(productRequestDTO.getImageUrls().get(i));
                image.setIsPrimary(i == 0);
                image.setDisplayOrder(i);
                productImageRepository.save(image);
            }
        }
        
        return new ProductDTO(savedProduct);
    }
    
    @Transactional
    public ProductDTO updateProduct(UUID id, ProductRequestDTO productRequestDTO) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        
        // Check SKU uniqueness if changed
        if (productRequestDTO.getSku() != null && 
            !productRequestDTO.getSku().equals(product.getSku()) &&
            productRepository.existsBySku(productRequestDTO.getSku())) {
            throw new ResourceAlreadyExistsException("Product", "sku", productRequestDTO.getSku());
        }
        
        // Update category if changed
        if (productRequestDTO.getCategoryId() != null && 
            !productRequestDTO.getCategoryId().equals(product.getCategory() != null ? product.getCategory().getId() : null)) {
            Category category = categoryRepository.findById(productRequestDTO.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", productRequestDTO.getCategoryId()));
            product.setCategory(category);
        }
        
        product.setName(productRequestDTO.getName());
        product.setDescription(productRequestDTO.getDescription());
        product.setPrice(productRequestDTO.getPrice());
        product.setDiscountPrice(productRequestDTO.getDiscountPrice());
        product.setStockQuantity(productRequestDTO.getStockQuantity());
        product.setSku(productRequestDTO.getSku());
        product.setImageUrl(productRequestDTO.getImageUrl());
        product.setStatus(productRequestDTO.getStatus());
        
        Product updatedProduct = productRepository.save(product);
        return new ProductDTO(updatedProduct);
    }
    
    @Transactional
    public void deleteProduct(UUID id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product", "id", id);
        }
        productRepository.deleteById(id);
    }
    
    public List<ProductDTO> getAvailableProducts() {
        return productRepository.findByStockQuantityGreaterThan(0).stream()
                .map(ProductDTO::new)
                .collect(Collectors.toList());
    }
}

