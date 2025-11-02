package com.ecommerce.backend.dto;

import com.ecommerce.backend.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    
    private UUID id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String address;
    private User.UserRole role;
    private Boolean enabled;
    private LocalDateTime createdAt;
    
    // Constructor to convert from Entity
    public UserDTO(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.phone = user.getPhone();
        this.address = user.getAddress();
        this.role = user.getRole();
        this.enabled = user.getEnabled();
        this.createdAt = user.getCreatedAt();
    }
}

