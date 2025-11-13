package com.ecommerce.backend.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BannerReorderRequestDTO {

    @NotEmpty(message = "Danh sách banner không được để trống")
    private List<UUID> orderedBannerIds;
}

