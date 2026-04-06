package com.sliit.smartcampus.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
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

    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime availableFrom;

    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime availableTo;

    private ResourceStatus status;

    private String imageName;
    private String imageType;
    private String imageUrl;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}