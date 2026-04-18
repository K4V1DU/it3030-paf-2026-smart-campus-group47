package com.sliit.smartcampus.dto;

import com.sliit.smartcampus.model.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {

    private Long id;
    private String title;
    private String message;
    private NotificationType type;
    private boolean isRead;
    private Long userId;            // just the ID, not the full User object
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
}
