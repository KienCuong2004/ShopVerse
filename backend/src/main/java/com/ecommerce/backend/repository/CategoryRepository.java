package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.Category;
import com.ecommerce.backend.repository.projection.CategoryProductCountProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {
    
    Optional<Category> findByName(String name);
    
    boolean existsByName(String name);
    
    boolean existsByNameAndIdNot(String name, UUID id);
    
    List<Category> findByParentId(UUID parentId);
    
    List<Category> findByParentIdOrderByDisplayOrderAscNameAsc(UUID parentId);
    
    List<Category> findByParentIsNull();
    
    List<Category> findByParentIsNullOrderByDisplayOrderAscNameAsc();
    
    List<Category> findByParentIsNotNull();
    
    long countByParentIsNull();
    
    long countByParentId(UUID parentId);
    
    @Query("SELECT c FROM Category c ORDER BY c.displayOrder ASC, c.name ASC")
    List<Category> findAllOrdered();
    
    @Query("SELECT DISTINCT c FROM Category c LEFT JOIN FETCH c.parent ORDER BY c.displayOrder ASC, c.name ASC")
    List<Category> findAllWithParentOrdered();
    
    Optional<Category> findTopByParentIsNullOrderByDisplayOrderDesc();
    
    Optional<Category> findTopByParentIdOrderByDisplayOrderDesc(UUID parentId);
    
    @Query("SELECT c.id AS categoryId, COUNT(p.id) AS productCount " +
           "FROM Category c LEFT JOIN c.products p " +
           "GROUP BY c.id")
    List<CategoryProductCountProjection> findCategoryProductCounts();
}

