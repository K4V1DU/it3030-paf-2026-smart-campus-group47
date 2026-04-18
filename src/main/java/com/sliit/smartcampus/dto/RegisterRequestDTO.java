package com.sliit.smartcampus.dto;

import com.sliit.smartcampus.model.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequestDTO {

    private String name;
    private String email;
    private String password;
    private UserRole role;          // Optional — defaults to USER if null
}