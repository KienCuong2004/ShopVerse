package com.ecommerce.backend.repository;

import com.ecommerce.backend.model.Banner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface BannerRepository extends JpaRepository<Banner, UUID> {

    List<Banner> findAllByOrderByDisplayOrderAscCreatedAtDesc();

    @Query("""
            SELECT b FROM Banner b
            WHERE b.active = true
              AND (b.scheduleStart IS NULL OR b.scheduleStart <= :now)
              AND (b.scheduleEnd IS NULL OR b.scheduleEnd >= :now)
            ORDER BY b.displayOrder ASC, b.createdAt DESC
            """)
    List<Banner> findActiveBanners(LocalDateTime now);
}

