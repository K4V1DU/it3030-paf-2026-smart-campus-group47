package com.sliit.smartcampus.model;

import com.sliit.smartcampus.model.enums.ResourceStatus;
import com.sliit.smartcampus.model.enums.ResourceType;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Data
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Resource name is required")
    private String name;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Resource type is required")
    private ResourceType type;

    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    @NotBlank(message = "Location is required")
    private String location;

    @Column(length = 1000)
    private String description;

    private LocalTime availableFrom;
    private LocalTime availableTo;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Status is required")
    private ResourceStatus status = ResourceStatus.ACTIVE;

    // ── Image stored in DB ──────────────────────────────────────────
    @Lob
    @Column(columnDefinition = "LONGBLOB")   // use BYTEA if PostgreSQL
    private byte[] imageData;

    private String imageType;   // e.g. "image/jpeg", "image/png"
    private String imageName;   // original filename
    // ────────────────────────────────────────────────────────────────

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}