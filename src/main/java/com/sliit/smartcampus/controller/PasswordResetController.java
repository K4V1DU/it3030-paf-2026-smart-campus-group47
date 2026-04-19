package com.sliit.smartcampus.controller;

import com.sliit.smartcampus.repository.UserRepo;
import com.sliit.smartcampus.service.EmailService;
import com.sliit.smartcampus.service.OtpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@CrossOrigin
@RequestMapping("Auth/")
public class PasswordResetController {

    @Autowired private UserRepo userRepo;
    @Autowired private OtpService otpService;
    @Autowired private EmailService emailService;
    @Autowired private PasswordEncoder passwordEncoder;

    // STEP 1 — Send OTP to email
    // POST /Auth/forgot-password   body: { "email": "..." }
    @PostMapping("forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");

        if (!userRepo.existsByEmail(email)) {
            throw new RuntimeException("No account found with this email.");
        }

        String otp = otpService.generateOtp(email);
        emailService.sendOtpEmail(email, otp);

        return ResponseEntity.ok(Map.of("message", "OTP sent to " + email));
    }

    // STEP 2 — Verify OTP + reset password
    // POST /Auth/reset-password   body: { "email": "...", "otp": "...", "newPassword": "..." }
    @PostMapping("reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> body) {
        String email       = body.get("email");
        String otp         = body.get("otp");
        String newPassword = body.get("newPassword");

        if (!otpService.verifyOtp(email, otp)) {
            throw new RuntimeException("Invalid or expired OTP. Please try again.");
        }

        userRepo.findByEmail(email).ifPresent(user -> {
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepo.save(user);
        });

        return ResponseEntity.ok(Map.of("message", "Password reset successful!"));
    }
}