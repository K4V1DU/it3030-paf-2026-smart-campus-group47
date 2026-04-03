package com.sliit.smartcampus.dto;



import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResourceDTO {

    private Long id;
    private String name;
    private String type;
    private Integer capacity;
    private String location;
    private String description;
    private LocalTime availableFrom;
    private LocalTime availableTo;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
