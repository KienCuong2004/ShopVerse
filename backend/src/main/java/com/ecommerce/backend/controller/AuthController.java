package com.ecommerce.backend.controller;

import com.ecommerce.backend.dto.AuthResponseDTO;
import com.ecommerce.backend.dto.LoginDTO;
import com.ecommerce.backend.dto.RegisterDTO;
import com.ecommerce.backend.dto.UserDTO;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.service.JwtService;
import com.ecommerce.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {
    
    private final UserService userService;
    private final JwtService jwtService;
    
    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@Valid @RequestBody RegisterDTO registerDTO) {
        UserDTO userDTO = userService.register(registerDTO);
        User user = userService.getUserEntity(userDTO.getId());
        
        String token = jwtService.generateToken(user);
        AuthResponseDTO authResponse = new AuthResponseDTO(token, userDTO);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);
    }
    
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginDTO loginDTO) {
        // Validate user credentials
        userService.validateUser(loginDTO);
        
        // Get user entity after validation
        User user = userService.getUserEntityByUsernameOrEmail(loginDTO.getUsernameOrEmail());
        
        // Generate JWT token
        String token = jwtService.generateToken(user);
        UserDTO userDTO = new UserDTO(user);
        
        AuthResponseDTO authResponse = new AuthResponseDTO(token, userDTO);
        return ResponseEntity.ok(authResponse);
    }
    
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated() || 
            authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        String username = authentication.getName();
        UserDTO userDTO = userService.findByUsername(username);
        
        return ResponseEntity.ok(userDTO);
    }
}

