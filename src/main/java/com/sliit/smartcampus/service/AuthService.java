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

    @Autowired private UserRepo userRepo;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private OtpService otpService;
    @Autowired private EmailService emailService;

    // ── REGISTER — save INACTIVE, send OTP ───────────────────────────
    public void register(RegisterRequestDTO request) {

        if (userRepo.existsByEmail(request.getEmail())) {
            User existing = userRepo.findByEmail(request.getEmail()).get();
            // Resend OTP if still pending verification
            if (existing.getStatus() == UserStatus.INACTIVE) {
                String otp = otpService.generateOtp(request.getEmail());
                emailService.sendOtpEmail(request.getEmail(), otp);
                return;
            }
            throw new RuntimeException("Email already in use: " + request.getEmail());
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setStatus(UserStatus.INACTIVE); // activate after OTP

        // SECURITY — ADMIN cannot self-assign
        UserRole assignedRole = UserRole.USER;
        if (request.getRole() != null && request.getRole() != UserRole.ADMIN) {
            assignedRole = request.getRole();
        }
        user.setRole(assignedRole);

        userRepo.save(user);

        String otp = otpService.generateOtp(request.getEmail());
        emailService.sendOtpEmail(request.getEmail(), otp);
    }

    // ── VERIFY OTP — activate account, return JWT ─────────────────────
    public AuthResponseDTO verifyOtp(String email, String otp) {
        if (!otpService.verifyOtp(email, otp)) {
            throw new RuntimeException("Invalid or expired OTP. Please try again.");
        }

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setStatus(UserStatus.ACTIVE);
        User saved = userRepo.save(user);

        String token = jwtUtil.generateToken(saved.getEmail(), saved.getRole().name());
        return buildResponse(token, saved, "Account created successfully!");
    }

    public void resendOtp(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getStatus() == UserStatus.ACTIVE) {
            throw new RuntimeException("Account already verified.");
        }
        String otp = otpService.generateOtp(email);
        emailService.sendOtpEmail(email, otp);
    }

    // ── LOGIN ─────────────────────────────────────────────────────────
    public AuthResponseDTO login(LoginRequestDTO request) {
        User user = userRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (user.getPassword() == null) {
            throw new RuntimeException("This account uses Google login. Please continue with Google.");
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }
        if (user.getStatus() == UserStatus.INACTIVE) {
            throw new RuntimeException("Please verify your email first.");
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