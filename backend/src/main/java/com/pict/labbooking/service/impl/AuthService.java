package com.pict.labbooking.service.impl;

import com.pict.labbooking.dto.request.LoginRequest;
import com.pict.labbooking.dto.request.RegisterRequest;
import com.pict.labbooking.dto.response.JwtResponse;
import com.pict.labbooking.dto.response.UserResponse;
import com.pict.labbooking.entity.User;
import com.pict.labbooking.exception.ResourceNotFoundException;
import com.pict.labbooking.repository.UserRepository;
import com.pict.labbooking.security.JwtUtils;
import com.pict.labbooking.util.MapperUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final MapperUtil mapperUtil;

    /**
     * Authenticates user and returns a JWT token with user info.
     */
    public JwtResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", 0L));

        log.info("User '{}' logged in successfully", user.getUsername());

        return JwtResponse.builder()
                .token(jwt)
                .type("Bearer")
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(user.getRoles())
                .build();
    }

    /**
     * Registers a new user after validating uniqueness of username/email.
     */
    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalStateException("Username '" + request.getUsername() + "' is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalStateException("Email '" + request.getEmail() + "' is already registered");
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .division(request.getDivision())
                .clubName(request.getClubName())
                .department(request.getDepartment())
                .roles(request.getRoles())
                .isActive(true)
                .build();

        User saved = userRepository.save(user);
        log.info("New user registered: '{}' with roles {}", saved.getUsername(), saved.getRoles());

        return mapperUtil.toUserResponse(saved);
    }

    /**
     * Returns the currently authenticated user's profile.
     */
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return mapperUtil.toUserResponse(user);
    }
}
