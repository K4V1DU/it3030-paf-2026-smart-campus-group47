package com.sliit.smartcampus.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.sliit.smartcampus.dto.ResourceDTO;
import com.sliit.smartcampus.service.ResourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping(value = "Resource/")
public class ResourceController {

    @Autowired
    private ResourceService resourceService;

    private ObjectMapper buildMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }

    // GET ALL
    @GetMapping("getAllResource")
    public ResponseEntity<List<ResourceDTO>> getResources() {
        return ResponseEntity.ok(resourceService.getAllResources());
    }

    // GET BY ID
    @GetMapping("getResource/{id}")
    public ResponseEntity<ResourceDTO> getResourceById(@PathVariable Long id) {
        return ResponseEntity.ok(resourceService.getResourceById(id));
    }

    // GET IMAGE
    @GetMapping("image/{id}")
    public ResponseEntity<byte[]> getResourceImage(@PathVariable Long id) {
        return resourceService.getResourceImage(id);
    }

    // CREATE
    @PostMapping(value = "addResource", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResourceDTO> addResource(
            @RequestParam("resource") String resourceJson,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) throws Exception {
        ResourceDTO resourceDTO = buildMapper().readValue(resourceJson, ResourceDTO.class);
        return new ResponseEntity<>(resourceService.addResource(resourceDTO, image), HttpStatus.CREATED);
    }

    // UPDATE
    @PutMapping(value = "updateResource/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResourceDTO> updateResource(
            @PathVariable Long id,
            @RequestParam("resource") String resourceJson,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) throws Exception {
        ResourceDTO resourceDTO = buildMapper().readValue(resourceJson, ResourceDTO.class);
        return ResponseEntity.ok(resourceService.updateResource(id, resourceDTO, image));
    }

    // REMOVE IMAGE ONLY
    @DeleteMapping("removeImage/{id}")
    public ResponseEntity<ResourceDTO> removeResourceImage(@PathVariable Long id) {
        return ResponseEntity.ok(resourceService.removeResourceImage(id));
    }

    // DELETE
    @DeleteMapping("deleteResource/{id}")
    public ResponseEntity<String> deleteResource(@PathVariable Long id) {
        return ResponseEntity.ok(resourceService.deleteResource(id));
    }
}