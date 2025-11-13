package com.ecommerce.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BannerRequestDTO {

    @NotBlank(message = "Tiêu đề banner không được để trống")
    @Size(max = 150, message = "Tiêu đề banner không được vượt quá 150 ký tự")
    private String title;

    @Size(max = 255, message = "Phụ đề không được vượt quá 255 ký tự")
    private String subtitle;

    private String description;

    @NotBlank(message = "Đường dẫn hình ảnh không được để trống")
    @Size(max = 255, message = "Đường dẫn hình ảnh không được vượt quá 255 ký tự")
    private String imageUrl;

    @Size(max = 100, message = "Nội dung nút hành động không được vượt quá 100 ký tự")
    private String buttonText;

    @Size(max = 255, message = "Đường dẫn nút hành động không được vượt quá 255 ký tự")
    private String buttonLink;

    private Boolean active = true;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")
    private OffsetDateTime scheduleStart;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")
    private OffsetDateTime scheduleEnd;
}

