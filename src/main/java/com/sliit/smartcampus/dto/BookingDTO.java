package com.sliit.smartcampus.dto;

import com.sliit.smartcampus.model.enums.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingDTO {

    private Long id;

    // User info — flattened (no password / imageData exposed)
    private Long userId;
    private String userName;
    private String userEmail;

    // Resource info — flattened
    private Long resourceId;
    private String resourceName;
    private String resourceLocation;

    // Booking details
    private LocalDate bookingDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String purpose;
    private Integer expectedAttendees;

    // Workflow
    private BookingStatus status;
    private String reviewedBy;
    private String rejectionReason;
    private LocalDateTime reviewedAt;

    // Cancellation
    private String cancellationReason;
    private LocalDateTime cancelledAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
