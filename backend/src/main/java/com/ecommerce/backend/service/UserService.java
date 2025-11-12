package com.ecommerce.backend.service;

import com.ecommerce.backend.dto.LoginDTO;
import com.ecommerce.backend.dto.RegisterDTO;
import com.ecommerce.backend.dto.UserDTO;
import com.ecommerce.backend.exception.InvalidRequestException;
import com.ecommerce.backend.exception.ResourceAlreadyExistsException;
import com.ecommerce.backend.exception.ResourceNotFoundException;
import com.ecommerce.backend.exception.UnauthorizedException;
import com.ecommerce.backend.model.User;
import com.ecommerce.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Transactional
    public UserDTO register(RegisterDTO registerDTO) {
        // Check if username or email already exists
        if (userRepository.existsByUsername(registerDTO.getUsername())) {
            throw new ResourceAlreadyExistsException("User", "username", registerDTO.getUsername());
        }
        
        if (userRepository.existsByEmail(registerDTO.getEmail())) {
            throw new ResourceAlreadyExistsException("User", "email", registerDTO.getEmail());
        }
        
        // Create new user
        User user = new User();
        user.setUsername(registerDTO.getUsername());
        user.setEmail(registerDTO.getEmail());
        user.setPassword(passwordEncoder.encode(registerDTO.getPassword()));
        user.setFullName(registerDTO.getFullName());
        user.setPhone(registerDTO.getPhone());
        user.setAddress(registerDTO.getAddress());
        user.setRole(User.UserRole.USER);
        user.setEnabled(true);
        
        User savedUser = userRepository.save(user);
        return new UserDTO(savedUser);
    }
    
    public UserDTO findByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        return new UserDTO(user);
    }
    
    public UserDTO findById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return new UserDTO(user);
    }
    
    public UserDTO findByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return new UserDTO(user);
    }
    
    public boolean validateUser(LoginDTO loginDTO) {
        String usernameOrEmail = normalizeUsernameOrEmail(loginDTO.getUsernameOrEmail());
        String password = normalizePassword(loginDTO.getPassword());

        log.debug("Attempting login for user identifier='{}'", usernameOrEmail);

        User user = userRepository.findByUsernameOrEmail(
                usernameOrEmail,
                usernameOrEmail
        ).orElseThrow(() -> new UnauthorizedException("Invalid username/email or password"));
        
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new UnauthorizedException("Invalid username/email or password");
        }
        
        if (!user.getEnabled()) {
            throw new UnauthorizedException("User account is disabled");
        }
        
        return true;
    }
    
    public User getUserEntityByUsernameOrEmail(String usernameOrEmail) {
        String normalized = normalizeUsernameOrEmail(usernameOrEmail);
        return userRepository.findByUsernameOrEmail(normalized, normalized)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username/email", usernameOrEmail));
    }

    private String normalizeUsernameOrEmail(String input) {
        if (input == null) {
            return "";
        }
        String trimmed = input.trim();
        if (trimmed.contains("@")) {
            return trimmed.toLowerCase();
        }
        return trimmed;
    }

    private String normalizePassword(String input) {
        return input == null ? "" : input.trim();
    }
    
    public User getUserEntity(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
    }
    
    public User getUserEntity(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }
    
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserDTO::new)
                .collect(Collectors.toList());
    }
    
    public Page<UserDTO> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(UserDTO::new);
    }
    
    @Transactional
    public UserDTO updateUser(UUID id, UserDTO userDTO) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        
        user.setFullName(userDTO.getFullName());
        user.setPhone(userDTO.getPhone());
        user.setAddress(userDTO.getAddress());
        
        User updatedUser = userRepository.save(user);
        return new UserDTO(updatedUser);
    }

    @Transactional
    public void deleteUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication != null ? authentication.getName() : null;

        if (user.getRole() == User.UserRole.ADMIN) {
            throw new InvalidRequestException("Không thể xóa tài khoản quản trị viên");
        }

        if (currentUsername != null && user.getUsername().equalsIgnoreCase(currentUsername)) {
            throw new InvalidRequestException("Bạn không thể tự xóa tài khoản của mình");
        }
 
        userRepository.delete(user);
    }
}

