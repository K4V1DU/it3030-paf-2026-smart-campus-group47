package com.sliit.smartcampus.model;

import com.sliit.smartcampus.model.enums.Ticketpriority;
import com.sliit.smartcampus.model.enums.Ticketcategory;
import com.sliit.smartcampus.model.enums.Ticketstatus;


import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tickets")
@Data
@NoArgsConstructor
@AllArgsConstructor

public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Title is required")
    @Column(nullable = false)
    private String title;

    @NotBlank(message = "Description is required")
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "Category is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Ticketcategory category;

    @NotNull(message = "Priority is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Ticketpriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Ticketstatus status = Ticketstatus.OPEN;

    @NotBlank(message = "Location is required")
    @Column(nullable = false)
    private String location;

    // Who reported the ticket (user email or name)
    @NotBlank(message = "Reported by is required")
    @Column(nullable = false)
    private String reportedBy;

    // Preferred contact details
    private String contactDetails;

    // Technician or staff assigned to this ticket
    private String assignedTo;

    // Resolution notes added by technician
    @Column(columnDefinition = "TEXT")
    private String resolutionNotes;

    // Reason for rejection (if status = REJECTED)
    private String rejectionReason;

    // Up to 3 image attachment URLs
    @ElementCollection
    @CollectionTable(name = "ticket_attachments", joinColumns = @JoinColumn(name = "ticket_id"))
    @Column(name = "attachment_url")
    @Size(max = 3, message = "Maximum 3 attachments allowed")
    private List<String> attachments = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
