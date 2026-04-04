package com.sliit.smartcampus.dto;

import com.sliit.smartcampus.model.enums.ResourceStatus;
import com.sliit.smartcampus.model.enums.ResourceType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResourceDTO {

    private Long id;
    private String name;
    private ResourceType type;
    private Integer capacity;
    private String location;
    private String description;
    private LocalTime availableFrom;
    private LocalTime availableTo;
    private ResourceStatus status;

    // Image fields — imageData is excluded (fetched via /Resource/image/{id})
    private String imageName;
    private String imageType;
    private String imageUrl;    // e.g. "Resource/image/5"

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}