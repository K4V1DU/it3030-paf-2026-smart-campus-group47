package com.sliit.smartcampus.dto;

import com.sliit.smartcampus.model.enums.UserRole;
import com.sliit.smartcampus.model.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponseDTO {

    private String token;           // JWT Bearer token
    private Long   userId;
    private String name;
    private String email;
    private UserRole   role;
    private UserStatus status;
    private String imageUrl;        // e.g. "User/image/5" — null if no photo
    private String message;         // "Login successful" / "Registration successful"
}