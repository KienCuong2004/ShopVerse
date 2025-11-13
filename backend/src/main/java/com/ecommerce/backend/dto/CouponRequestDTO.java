package com.ecommerce.backend.dto;

import com.ecommerce.backend.model.Coupon;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CouponRequestDTO {

    @NotBlank(message = "Mã giảm giá không được để trống")
    @Size(max = 50, message = "Mã giảm giá không được vượt quá 50 ký tự")
    private String code;

    @NotBlank(message = "Tên chương trình không được để trống")
    @Size(max = 150, message = "Tên chương trình không được vượt quá 150 ký tự")
    private String name;

    @Size(max = 2000, message = "Mô tả không được vượt quá 2000 ký tự")
    private String description;

    @NotNull(message = "Loại giảm giá không hợp lệ")
    private Coupon.DiscountType discountType;

    @NotNull(message = "Giá trị giảm không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá trị giảm phải lớn hơn 0")
    private BigDecimal discountValue;

    @DecimalMin(value = "0.0", inclusive = false, message = "Giá trị giảm tối đa phải lớn hơn 0")
    private BigDecimal maxDiscountValue;

    @DecimalMin(value = "0.0", inclusive = false, message = "Giá trị tối thiểu đơn hàng phải lớn hơn 0")
    private BigDecimal minimumOrderValue;

    @Min(value = 1, message = "Giới hạn số lượt sử dụng phải lớn hơn 0")
    private Integer usageLimit;

    @Min(value = 1, message = "Giới hạn mỗi khách hàng phải lớn hơn 0")
    private Integer perUserLimit;

    private Boolean active = true;

    @NotNull(message = "Phân khúc khách hàng không được để trống")
    private Coupon.CustomerSegment segment;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")
    private OffsetDateTime startAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")
    private OffsetDateTime endAt;
}

