package com.sliit.smartcampus.dto;

import com.sliit.smartcampus.model.enums.Ticketcategory;
import com.sliit.smartcampus.model.enums.Ticketpriority;
import com.sliit.smartcampus.model.enums.Ticketstatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class TicketDTO {

    private Long id;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Category is required")
    private Ticketcategory category;

    @NotNull(message = "Priority is required")
    private Ticketpriority priority;

    private Ticketstatus status;

    @NotBlank(message = "Location is required")
    private String location;

    @NotBlank(message = "Reported by is required")
    private String reportedBy;

    private String contactDetails;
    private String assignedTo;
    private String resolutionNotes;
    private String rejectionReason;

    /**
     * Each entry must be a base64 data URI starting with "data:image/".
     * Maximum 3 attachments (images stored as blobs in the DB via LONGTEXT).
     */
    @Size(max = 3, message = "Maximum 3 attachments allowed")
    private List<
            @Pattern(
                    regexp = "^data:image\\/(png|jpeg|jpg|webp|gif);base64,.+",
                    message = "Each attachment must be a valid base64 image data URI"
            )
                    String
            > attachments;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}