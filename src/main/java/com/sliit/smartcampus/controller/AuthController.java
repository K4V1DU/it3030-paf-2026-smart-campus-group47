package com.sliit.smartcampus.controller;

import com.sliit.smartcampus.dto.AuthResponseDTO;
import com.sliit.smartcampus.dto.LoginRequestDTO;
import com.sliit.smartcampus.dto.RegisterRequestDTO;
import com.sliit.smartcampus.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@CrossOrigin
@RequestMapping(value = "Auth/")
public class AuthController {

    @Autowired
    private AuthService authService;

    // REGISTER — sends OTP, saves user as INACTIVE
    // POST http://localhost:8080/Auth/register
    @PostMapping("register")
    public ResponseEntity<Map<String, String>> register(
            @RequestBody RegisterRequestDTO request) {
        authService.register(request);
        return ResponseEntity.ok(
                Map.of("message", "OTP sent to " + request.getEmail())
        );
    }

    // VERIFY OTP — activates account, returns JWT
    // POST http://localhost:8080/Auth/verify-otp
    // Body: { "email":"...", "otp":"123456" }
    @PostMapping("verify-otp")
    public ResponseEntity<AuthResponseDTO> verifyOtp(
            @RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp   = body.get("otp");
        return ResponseEntity.ok(authService.verifyOtp(email, otp));
    }

    // RESEND OTP
    // POST http://localhost:8080/Auth/resend-otp
    @PostMapping("resend-otp")
    public ResponseEntity<Map<String, String>> resendOtp(
            @RequestBody Map<String, String> body) {
        authService.resendOtp(body.get("email"));
        return ResponseEntity.ok(Map.of("message", "OTP resent successfully"));
    }

    // LOGIN
    // POST http://localhost:8080/Auth/login
    @PostMapping("login")
    public ResponseEntity<AuthResponseDTO> login(
            @RequestBody LoginRequestDTO request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // VALIDATE TOKEN
    // GET http://localhost:8080/Auth/validate
    @GetMapping("validate")
    public ResponseEntity<String> validateToken(
            @RequestHeader("Authorization") String token) {
        return ResponseEntity.ok(authService.validateToken(token));
    }
}