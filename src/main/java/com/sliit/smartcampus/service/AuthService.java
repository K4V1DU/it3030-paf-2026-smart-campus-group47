package com.sliit.smartcampus.service;

import com.sliit.smartcampus.dto.AuthResponseDTO;
import com.sliit.smartcampus.dto.LoginRequestDTO;
import com.sliit.smartcampus.dto.RegisterRequestDTO;
import com.sliit.smartcampus.model.User;
import com.sliit.smartcampus.model.enums.UserRole;
import com.sliit.smartcampus.model.enums.UserStatus;
import com.sliit.smartcampus.repository.UserRepo;
import com.sliit.smartcampus.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ── REGISTER ─────────────────────────────────────────────────────
    public AuthResponseDTO register(RegisterRequestDTO request) {
        if (userRepo.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use: " + request.getEmail());
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setStatus(UserStatus.ACTIVE);

        // SECURITY FIX — ADMIN role cannot be self-assigned via registration
        UserRole assignedRole = UserRole.USER; // default
        if (request.getRole() != null && request.getRole() != UserRole.ADMIN) {
            assignedRole = request.getRole();
        }
        user.setRole(assignedRole);

        User saved = userRepo.save(user);
        String token = jwtUtil.generateToken(saved.getEmail(), saved.getRole().name());
        return buildResponse(token, saved, "Registration successful");
    }

    // ── LOGIN ─────────────────────────────────────────────────────────
    public AuthResponseDTO login(LoginRequestDTO request) {
        User user = userRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        // OAuth users don't have a password — direct them to Google
        if (user.getPassword() == null) {
            throw new RuntimeException("This account uses Google login. Please continue with Google.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        if (user.getStatus() == UserStatus.INACTIVE) {
            throw new RuntimeException("Account is inactive. Please contact support.");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return buildResponse(token, user, "Login successful");
    }

    // ── VALIDATE TOKEN ────────────────────────────────────────────────
    public String validateToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Invalid token format. Use: Bearer <token>");
        }
        String token = authHeader.substring(7);
        String email = jwtUtil.extractEmail(token);

        if (jwtUtil.isTokenValid(token, email)) {
            return "Token is valid for: " + email;
        }
        throw new RuntimeException("Token is invalid or expired");
    }

    // ── Helper ───────────────────────────────────────────────────────
    private AuthResponseDTO buildResponse(String token, User user, String message) {
        AuthResponseDTO res = new AuthResponseDTO();
        res.setToken(token);
        res.setUserId(user.getId());
        res.setName(user.getName());
        res.setEmail(user.getEmail());
        res.setRole(user.getRole());
        res.setStatus(user.getStatus());
        res.setMessage(message);
        if (user.getImageData() != null) {
            res.setImageUrl("User/image/" + user.getId());
        }
        return res;
    }
}