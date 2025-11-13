package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.BannerReorderRequestDTO;
import com.ecommerce.backend.dto.BannerRequestDTO;
import com.ecommerce.backend.dto.BannerResponseDTO;
import com.ecommerce.backend.service.BannerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/banners")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ADMIN')")
@CrossOrigin(origins = "http://localhost:3000")
public class AdminBannerController {

    private final BannerService bannerService;

    @GetMapping
    public ResponseEntity<List<BannerResponseDTO>> getBanners() {
        return ResponseEntity.ok(bannerService.getAllBanners());
    }

    @PostMapping
    public ResponseEntity<BannerResponseDTO> createBanner(@Valid @RequestBody BannerRequestDTO request) {
        BannerResponseDTO created = bannerService.createBanner(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BannerResponseDTO> updateBanner(
            @PathVariable UUID id,
            @Valid @RequestBody BannerRequestDTO request
    ) {
        BannerResponseDTO updated = bannerService.updateBanner(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBanner(@PathVariable UUID id) {
        bannerService.deleteBanner(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reorder")
    public ResponseEntity<Void> reorderBanners(@Valid @RequestBody BannerReorderRequestDTO request) {
        bannerService.reorderBanners(request);
        return ResponseEntity.noContent().build();
    }
}

