package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.CategoryDTO;
import com.ecommerce.backend.dto.CategoryRequestDTO;
import com.ecommerce.backend.dto.CategoryReorderRequestDTO;
import com.ecommerce.backend.dto.CategoryTreeNodeDTO;
import com.ecommerce.backend.exception.InvalidRequestException;
import com.ecommerce.backend.exception.ResourceAlreadyExistsException;
import com.ecommerce.backend.exception.ResourceNotFoundException;
import com.ecommerce.backend.model.Category;
import com.ecommerce.backend.repository.CategoryRepository;
import com.ecommerce.backend.repository.ProductRepository;
import com.ecommerce.backend.repository.projection.CategoryProductCountProjection;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {
    
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    
    @PostConstruct
    @Transactional
    public void initializeDisplayOrders() {
        normalizeSiblingDisplayOrder(null);
        categoryRepository.findByParentIsNotNull().stream()
                .map(Category::getParent)
                .filter(Objects::nonNull)
                .map(Category::getId)
                .distinct()
                .forEach(this::normalizeSiblingDisplayOrder);
    }
    
    @Transactional(readOnly = true)
    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(CategoryDTO::new)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<CategoryDTO> getMainCategories() {
        return categoryRepository.findByParentIsNull().stream()
                .map(CategoryDTO::new)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<CategoryDTO> getSubCategories(UUID parentId) {
        return categoryRepository.findByParentId(parentId).stream()
                .map(CategoryDTO::new)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public CategoryDTO getCategoryById(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        return new CategoryDTO(category);
    }
    
    @Transactional(readOnly = true)
    public CategoryDTO getCategoryByName(String name) {
        Category category = categoryRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "name", name));
        return new CategoryDTO(category);
    }
    
    @Transactional(readOnly = true)
    public List<CategoryTreeNodeDTO> getAdminCategoryTree() {
        List<Category> categories = categoryRepository.findAllWithParentOrdered();
        if (categories.isEmpty()) {
            return Collections.emptyList();
        }
        
        Map<UUID, Long> productCountMap = categoryRepository.findCategoryProductCounts().stream()
                .collect(Collectors.toMap(
                        CategoryProductCountProjection::getCategoryId,
                        CategoryProductCountProjection::getProductCount
                ));
        
        Map<UUID, CategoryTreeNodeDTO> nodeMap = new LinkedHashMap<>();
        for (Category category : categories) {
            CategoryTreeNodeDTO node = new CategoryTreeNodeDTO();
            node.setId(category.getId());
            node.setName(category.getName());
            node.setDescription(category.getDescription());
            node.setImageUrl(category.getImageUrl());
            node.setDisplayOrder(category.getDisplayOrder() != null ? category.getDisplayOrder() : 0);
            Long productCount = productCountMap.getOrDefault(category.getId(), 0L);
            node.setProductCount(productCount);
            node.setTotalProductCount(productCount);
            node.setCreatedAt(category.getCreatedAt());
            node.setUpdatedAt(category.getUpdatedAt());
            node.setChildren(new ArrayList<>());
            nodeMap.put(node.getId(), node);
        }
        
        List<CategoryTreeNodeDTO> roots = new ArrayList<>();
        for (Category category : categories) {
            CategoryTreeNodeDTO node = nodeMap.get(category.getId());
            Category parent = category.getParent();
            if (parent != null) {
                node.setParentId(parent.getId());
                node.setParentName(parent.getName());
                CategoryTreeNodeDTO parentNode = nodeMap.get(parent.getId());
                if (parentNode != null) {
                    parentNode.addChild(node);
                }
            } else {
                roots.add(node);
            }
        }
        
        sortChildrenByDisplayOrder(nodeMap);
        assignDepth(roots, 0);
        roots.forEach(this::computeTotalProductCount);
        return roots;
    }
    
    @Transactional
    public CategoryDTO createCategory(CategoryRequestDTO request) {
        String name = request.getName() != null ? request.getName().trim() : null;
        if (!StringUtils.hasText(name)) {
            throw new InvalidRequestException("Tên danh mục không được để trống");
        }
        
        if (categoryRepository.existsByName(name)) {
            throw new ResourceAlreadyExistsException("Category", "name", name);
        }
        
        Category parent = null;
        if (request.getParentId() != null) {
            parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent Category", "id", request.getParentId()));
        }
        
        Category category = new Category();
        category.setName(name);
        category.setDescription(StringUtils.hasText(request.getDescription()) ? request.getDescription().trim() : null);
        category.setImageUrl(StringUtils.hasText(request.getImageUrl()) ? request.getImageUrl().trim() : null);
        category.setParent(parent);
        category.setDisplayOrder(determineNextDisplayOrder(parent));
        
        Category savedCategory = categoryRepository.save(category);
        return new CategoryDTO(savedCategory);
    }
    
    @Transactional
    public CategoryDTO updateCategory(UUID id, CategoryRequestDTO request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        
        String name = request.getName() != null ? request.getName().trim() : null;
        if (!StringUtils.hasText(name)) {
            throw new InvalidRequestException("Tên danh mục không được để trống");
        }
        
        if (categoryRepository.existsByNameAndIdNot(name, id)) {
            throw new ResourceAlreadyExistsException("Category", "name", name);
        }
        
        Category newParent = null;
        if (request.getParentId() != null) {
            newParent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent Category", "id", request.getParentId()));
        }
        
        validateParentChange(category, newParent);
        
        UUID previousParentId = category.getParent() != null ? category.getParent().getId() : null;
        UUID newParentId = newParent != null ? newParent.getId() : null;
        
        category.setName(name);
        category.setDescription(StringUtils.hasText(request.getDescription()) ? request.getDescription().trim() : null);
        category.setImageUrl(StringUtils.hasText(request.getImageUrl()) ? request.getImageUrl().trim() : null);
        
        if (!Objects.equals(previousParentId, newParentId)) {
            category.setParent(newParent);
            category.setDisplayOrder(determineNextDisplayOrder(newParent));
            normalizeSiblingDisplayOrder(previousParentId);
        }
        
        Category updatedCategory = categoryRepository.save(category);
        return new CategoryDTO(updatedCategory);
    }
    
    @Transactional
    public void deleteCategory(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        
        long subCategoryCount = categoryRepository.countByParentId(id);
        if (subCategoryCount > 0) {
            throw new InvalidRequestException("Danh mục vẫn còn danh mục con. Vui lòng xóa hoặc di chuyển danh mục con trước.");
        }
        
        long productCount = productRepository.countByCategoryId(id);
        if (productCount > 0) {
            throw new InvalidRequestException("Danh mục vẫn còn sản phẩm. Vui lòng di chuyển sản phẩm sang danh mục khác trước.");
        }
        
        UUID parentId = category.getParent() != null ? category.getParent().getId() : null;
        categoryRepository.delete(category);
        normalizeSiblingDisplayOrder(parentId);
    }
    
    @Transactional
    public void reorderCategories(CategoryReorderRequestDTO request) {
        List<UUID> orderedIds = request.getOrderedCategoryIds();
        if (orderedIds == null || orderedIds.isEmpty()) {
            throw new InvalidRequestException("Danh sách danh mục không được để trống");
        }
        
        UUID parentId = request.getParentId();
        List<Category> siblings = parentId == null
                ? categoryRepository.findByParentIsNullOrderByDisplayOrderAscNameAsc()
                : categoryRepository.findByParentIdOrderByDisplayOrderAscNameAsc(parentId);
        
        if (siblings.isEmpty()) {
            return;
        }
        
        Map<UUID, Category> siblingMap = siblings.stream()
                .collect(Collectors.toMap(Category::getId, category -> category));
        
        if (siblingMap.size() != orderedIds.size() || !siblingMap.keySet().containsAll(orderedIds)) {
            throw new InvalidRequestException("Danh sách danh mục không hợp lệ");
        }
        
        int order = 0;
        List<Category> toSave = new ArrayList<>(orderedIds.size());
        for (UUID categoryId : orderedIds) {
            Category category = siblingMap.get(categoryId);
            category.setDisplayOrder(order++);
            toSave.add(category);
        }
        
        categoryRepository.saveAll(toSave);
    }
    
    private void validateParentChange(Category category, Category newParent) {
        if (newParent == null) {
            return;
        }
        
        if (category.getId().equals(newParent.getId())) {
            throw new InvalidRequestException("Danh mục không thể là danh mục cha của chính nó");
        }
        
        Deque<Category> stack = new ArrayDeque<>();
        stack.push(newParent);
        while (!stack.isEmpty()) {
            Category current = stack.pop();
            if (current == null) {
                continue;
            }
            if (category.getId().equals(current.getId())) {
                throw new InvalidRequestException("Không thể đặt danh mục con làm danh mục cha");
            }
            if (current.getParent() != null) {
                stack.push(current.getParent());
            }
        }
    }
    
    private int determineNextDisplayOrder(Category parent) {
        Optional<Category> lastSibling = parent == null
                ? categoryRepository.findTopByParentIsNullOrderByDisplayOrderDesc()
                : categoryRepository.findTopByParentIdOrderByDisplayOrderDesc(parent.getId());
        return lastSibling.map(category -> category.getDisplayOrder() + 1).orElse(0);
    }
    
    private void normalizeSiblingDisplayOrder(UUID parentId) {
        List<Category> siblings = parentId == null
                ? categoryRepository.findByParentIsNullOrderByDisplayOrderAscNameAsc()
                : categoryRepository.findByParentIdOrderByDisplayOrderAscNameAsc(parentId);
        if (siblings.isEmpty()) {
            return;
        }
        for (int i = 0; i < siblings.size(); i++) {
            siblings.get(i).setDisplayOrder(i);
        }
        categoryRepository.saveAll(siblings);
    }
    
    private void sortChildrenByDisplayOrder(Map<UUID, CategoryTreeNodeDTO> nodeMap) {
        for (CategoryTreeNodeDTO node : nodeMap.values()) {
            if (node.getChildren() != null && !node.getChildren().isEmpty()) {
                node.getChildren().sort(Comparator
                        .comparing(CategoryTreeNodeDTO::getDisplayOrder, Comparator.nullsFirst(Comparator.naturalOrder()))
                        .thenComparing(CategoryTreeNodeDTO::getName, Comparator.nullsFirst(String::compareToIgnoreCase)));
            }
        }
    }
    
    private void assignDepth(List<CategoryTreeNodeDTO> nodes, int depth) {
        for (CategoryTreeNodeDTO node : nodes) {
            node.setDepth(depth);
            if (node.getChildren() != null && !node.getChildren().isEmpty()) {
                assignDepth(node.getChildren(), depth + 1);
            }
        }
    }
    
    private long computeTotalProductCount(CategoryTreeNodeDTO node) {
        long total = node.getProductCount() != null ? node.getProductCount() : 0L;
        if (node.getChildren() != null && !node.getChildren().isEmpty()) {
            for (CategoryTreeNodeDTO child : node.getChildren()) {
                total += computeTotalProductCount(child);
            }
        }
        node.setTotalProductCount(total);
        return total;
    }
}

