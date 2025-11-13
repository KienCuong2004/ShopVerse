package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.BannerResponseDTO;
import com.ecommerce.backend.service.BannerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/banners")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class BannerController {

    private final BannerService bannerService;

    @GetMapping("/active")
    public ResponseEntity<List<BannerResponseDTO>> getActiveBanners() {
        return ResponseEntity.ok(bannerService.getActiveBanners());
    }
}

