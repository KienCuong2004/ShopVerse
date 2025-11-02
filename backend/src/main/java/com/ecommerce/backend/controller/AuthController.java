package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.AuthResponseDTO;
import com.ecommerce.backend.dto.LoginDTO;
import com.ecommerce.backend.dto.RegisterDTO;
import com.ecommerce.backend.dto.UserDTO;
import com.ecommerce.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {
    
    private final UserService userService;
    
    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@Valid @RequestBody RegisterDTO registerDTO) {
        UserDTO userDTO = userService.register(registerDTO);
        
        // TODO: Generate JWT token when Spring Security is configured
        // For now, return a simple token
        String token = "temp-token-" + userDTO.getId();
        
        AuthResponseDTO authResponse = new AuthResponseDTO(token, userDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);
    }
    
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginDTO loginDTO) {
        boolean isValid = userService.validateUser(loginDTO);
        
        if (!isValid) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        UserDTO userDTO = userService.findByUsername(loginDTO.getUsernameOrEmail());
        if (userDTO == null) {
            userDTO = userService.findByEmail(loginDTO.getUsernameOrEmail());
        }
        
        // TODO: Generate JWT token when Spring Security is configured
        String token = "temp-token-" + userDTO.getId();
        
        AuthResponseDTO authResponse = new AuthResponseDTO(token, userDTO);
        return ResponseEntity.ok(authResponse);
    }
    
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(@RequestHeader(value = "Authorization", required = false) String token) {
        // TODO: Extract user from JWT token when Spring Security is configured
        // For now, return null or throw exception
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
}

