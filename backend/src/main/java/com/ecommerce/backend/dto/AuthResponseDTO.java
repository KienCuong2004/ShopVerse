package com.ecommerce.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponseDTO {
    
    private String token;
    private String type = "Bearer";
    private UserDTO user;
    
    public AuthResponseDTO(String token, UserDTO user) {
        this.token = token;
        this.user = user;
    }
}

