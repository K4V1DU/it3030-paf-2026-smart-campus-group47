package com.sliit.smartcampus.model;

import com.sliit.smartcampus.model.enums.UserRole;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
@NoArgsConstructor
@AllArgsConstructor
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Column(nullable = false, unique = true)
    private String email;

    private String password;            // null for OAuth2 users

    // OAuth2 fields
    private String oauthProvider;       // e.g. "google"
    private String oauthProviderId;     // Google sub ID

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Role is required")
    private UserRole role = UserRole.USER;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Status is required")
    private UserStatus status = UserStatus.ACTIVE;

    // ── Profile image stored in DB ──────────────────────────────────
    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] imageData;

    private String imageType;           // e.g. "image/jpeg"
    private String imageName;           // original filename
    // ────────────────────────────────────────────────────────────────

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Booking> bookings;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
