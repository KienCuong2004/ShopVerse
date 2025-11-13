package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.BannerReorderRequestDTO;
import com.ecommerce.backend.dto.BannerRequestDTO;
import com.ecommerce.backend.dto.BannerResponseDTO;
import com.ecommerce.backend.exception.InvalidRequestException;
import com.ecommerce.backend.exception.ResourceNotFoundException;
import com.ecommerce.backend.model.Banner;
import com.ecommerce.backend.repository.BannerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BannerService {

    private final BannerRepository bannerRepository;

    @Transactional(readOnly = true)
    public List<BannerResponseDTO> getAllBanners() {
        List<Banner> banners = bannerRepository.findAllByOrderByDisplayOrderAscCreatedAtDesc();
        return banners.stream()
                .sorted(Comparator.comparing(Banner::getDisplayOrder))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BannerResponseDTO> getActiveBanners() {
        List<Banner> activeBanners = bannerRepository.findActiveBanners(LocalDateTime.now());
        return activeBanners.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BannerResponseDTO createBanner(BannerRequestDTO request) {
        validateSchedule(request.getScheduleStart(), request.getScheduleEnd());

        Banner banner = new Banner();
        banner.setDisplayOrder(determineNextDisplayOrder());
        applyRequestToEntity(banner, request);

        Banner saved = bannerRepository.save(banner);
        return mapToResponse(saved);
    }

    @Transactional
    public BannerResponseDTO updateBanner(UUID bannerId, BannerRequestDTO request) {
        validateSchedule(request.getScheduleStart(), request.getScheduleEnd());

        Banner banner = bannerRepository.findById(bannerId)
                .orElseThrow(() -> new ResourceNotFoundException("Banner", "id", bannerId));

        applyRequestToEntity(banner, request);
        Banner saved = bannerRepository.save(banner);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteBanner(UUID bannerId) {
        Banner banner = bannerRepository.findById(bannerId)
                .orElseThrow(() -> new ResourceNotFoundException("Banner", "id", bannerId));
        bannerRepository.delete(banner);
        normalizeDisplayOrder();
    }

    @Transactional
    public void reorderBanners(BannerReorderRequestDTO request) {
        List<UUID> orderedIds = request.getOrderedBannerIds();
        if (orderedIds == null || orderedIds.isEmpty()) {
            throw new InvalidRequestException("Danh sách banner để sắp xếp không hợp lệ");
        }

        List<Banner> banners = bannerRepository.findAllById(orderedIds);
        if (banners.size() != orderedIds.size()) {
            throw new InvalidRequestException("Không thể sắp xếp vì tồn tại banner không hợp lệ");
        }

        Map<UUID, Banner> bannerMap = new LinkedHashMap<>();
        banners.forEach(banner -> bannerMap.put(banner.getId(), banner));

        for (int index = 0; index < orderedIds.size(); index++) {
            UUID id = orderedIds.get(index);
            Banner banner = bannerMap.get(id);
            banner.setDisplayOrder(index);
        }

        bannerRepository.saveAll(bannerMap.values());
    }

    private void applyRequestToEntity(Banner banner, BannerRequestDTO request) {
        banner.setTitle(request.getTitle().trim());
        banner.setSubtitle(normalize(request.getSubtitle()));
        banner.setDescription(normalize(request.getDescription()));
        banner.setImageUrl(request.getImageUrl().trim());
        banner.setButtonText(normalize(request.getButtonText()));
        banner.setButtonLink(normalize(request.getButtonLink()));
        banner.setActive(request.getActive() == null || request.getActive());
        banner.setScheduleStart(toLocalDateTime(request.getScheduleStart()));
        banner.setScheduleEnd(toLocalDateTime(request.getScheduleEnd()));
    }

    private void validateSchedule(OffsetDateTime start, OffsetDateTime end) {
        if (start != null && end != null && end.isBefore(start)) {
            throw new InvalidRequestException("Thời gian kết thúc phải sau thời gian bắt đầu");
        }
    }

    private void normalizeDisplayOrder() {
        List<Banner> banners = bannerRepository.findAllByOrderByDisplayOrderAscCreatedAtDesc();
        for (int index = 0; index < banners.size(); index++) {
            banners.get(index).setDisplayOrder(index);
        }
        bannerRepository.saveAll(banners);
    }

    private int determineNextDisplayOrder() {
        return bannerRepository.findAllByOrderByDisplayOrderAscCreatedAtDesc()
                .stream()
                .map(Banner::getDisplayOrder)
                .max(Integer::compareTo)
                .map(order -> order + 1)
                .orElse(0);
    }

    private BannerResponseDTO mapToResponse(Banner banner) {
        return BannerResponseDTO.builder()
                .id(banner.getId())
                .title(banner.getTitle())
                .subtitle(banner.getSubtitle())
                .description(banner.getDescription())
                .imageUrl(banner.getImageUrl())
                .buttonText(banner.getButtonText())
                .buttonLink(banner.getButtonLink())
                .displayOrder(banner.getDisplayOrder())
                .active(Boolean.TRUE.equals(banner.getActive()))
                .scheduleStart(toOffsetDateTime(banner.getScheduleStart()))
                .scheduleEnd(toOffsetDateTime(banner.getScheduleEnd()))
                .createdAt(toOffsetDateTime(banner.getCreatedAt()))
                .updatedAt(toOffsetDateTime(banner.getUpdatedAt()))
                .build();
    }

    private OffsetDateTime toOffsetDateTime(LocalDateTime localDateTime) {
        return localDateTime == null
                ? null
                : localDateTime.atZone(ZoneId.systemDefault()).toOffsetDateTime();
    }

    private LocalDateTime toLocalDateTime(OffsetDateTime offsetDateTime) {
        return offsetDateTime == null
                ? null
                : offsetDateTime.atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();
    }

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}

