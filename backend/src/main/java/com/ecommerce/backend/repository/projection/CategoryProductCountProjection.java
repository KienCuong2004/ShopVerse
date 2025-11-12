package com.ecommerce.backend.repository.projection;

import java.util.UUID;

public interface CategoryProductCountProjection {
    
    UUID getCategoryId();
    
    Long getProductCount();
}

