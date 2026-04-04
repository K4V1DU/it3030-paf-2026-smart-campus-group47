package com.sliit.smartcampus.model;

import com.sliit.smartcampus.model.enums.BookingStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "bookings")
@NoArgsConstructor
@AllArgsConstructor
@Data
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull(message = "User is required")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_id", nullable = false)
    @NotNull(message = "Resource is required")
    private Resource resource;

    @NotNull(message = "Booking date is required")
    private LocalDate bookingDate;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    @NotBlank(message = "Purpose is required")
    @Column(length = 1000)
    private String purpose;

    @Min(value = 1, message = "Expected attendees must be at least 1")
    private Integer expectedAttendees;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Status is required")
    private BookingStatus status = BookingStatus.PENDING;

    // Admin review fields
    private String reviewedBy;          // Admin email or name
    private String rejectionReason;     // Required when REJECTED
    private LocalDateTime reviewedAt;

    // Cancellation fields
    private String cancellationReason;
    private LocalDateTime cancelledAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
