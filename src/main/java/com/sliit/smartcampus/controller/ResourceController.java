package com.sliit.smartcampus.controller;

import com.sliit.smartcampus.dto.ResourceDTO;
import com.sliit.smartcampus.service.ResourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping(value = "Resource/")
public class ResourceController {

    @Autowired
    private ResourceService resourceService;

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

    // CREATE
    @PostMapping("addResource")
    public ResponseEntity<ResourceDTO> addResource(@RequestBody ResourceDTO resourceDTO) {
        return new ResponseEntity<>(resourceService.addResource(resourceDTO), HttpStatus.CREATED);
    }

    // UPDATE
    @PutMapping("updateResource/{id}")
    public ResponseEntity<ResourceDTO> updateResource(
            @PathVariable Long id,
            @RequestBody ResourceDTO resourceDTO) {
        return ResponseEntity.ok(resourceService.updateResource(id, resourceDTO));
    }

    // DELETE
    @DeleteMapping("deleteResource/{id}")
    public ResponseEntity<String> deleteResource(@PathVariable Long id) {
        return ResponseEntity.ok(resourceService.deleteResource(id));
    }

}