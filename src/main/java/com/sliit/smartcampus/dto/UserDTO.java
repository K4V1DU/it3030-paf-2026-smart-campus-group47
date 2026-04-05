package com.sliit.smartcampus.dto;

import com.sliit.smartcampus.model.enums.UserRole;
import com.sliit.smartcampus.model.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {

    private Long id;
    private String name;
    private String email;
    private UserRole role;
    private UserStatus status;
    private String oauthProvider;

    // Image fields — imageData excluded (fetched via /User/image/{id})
    private String imageName;
    private String imageType;
    private String imageUrl;            // e.g. "User/image/5"

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
