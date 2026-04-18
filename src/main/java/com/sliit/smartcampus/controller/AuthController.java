package com.sliit.smartcampus.controller;

import com.sliit.smartcampus.dto.AuthResponseDTO;
import com.sliit.smartcampus.dto.LoginRequestDTO;
import com.sliit.smartcampus.dto.RegisterRequestDTO;
import com.sliit.smartcampus.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin
@RequestMapping(value = "Auth/")
public class AuthController {

    @Autowired
    private AuthService authService;

    // REGISTER
    // POST http://localhost:8080/Auth/register
    // Body: { "name":"...", "email":"...", "password":"...", "role":"USER" }
    @PostMapping("register")
    public ResponseEntity<AuthResponseDTO> register(@RequestBody RegisterRequestDTO request) {
        return new ResponseEntity<>(authService.register(request), HttpStatus.CREATED);
    }

    // LOGIN
    // POST http://localhost:8080/Auth/login
    // Body: { "email":"...", "password":"..." }
    @PostMapping("login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody LoginRequestDTO request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // VALIDATE TOKEN  (optional utility — used for testing)
    // GET http://localhost:8080/Auth/validate
    // Header: Authorization: Bearer <token>
    @GetMapping("validate")
    public ResponseEntity<String> validateToken(
            @RequestHeader("Authorization") String token) {
        return ResponseEntity.ok(authService.validateToken(token));
    }
}