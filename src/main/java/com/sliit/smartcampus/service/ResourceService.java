package com.sliit.smartcampus.service;

import com.sliit.smartcampus.dto.ResourceDTO;
import com.sliit.smartcampus.model.Resource;
import com.sliit.smartcampus.repository.ResourceRepo;
import org.modelmapper.ModelMapper;
import org.modelmapper.TypeToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@Transactional
public class ResourceService {

    @Autowired
    private ResourceRepo resourceRepo;

    @Autowired
    private ModelMapper modelMapper;

    // ── GET ALL ──────────────────────────────────────────────────────
    public List<ResourceDTO> getAllResources() {
        List<Resource> resourcesList = resourceRepo.findAll();
        List<ResourceDTO> dtos = modelMapper.map(resourcesList, new TypeToken<List<ResourceDTO>>(){}.getType());

        // Attach imageUrl to each DTO that has an image stored
        for (int i = 0; i < resourcesList.size(); i++) {
            if (resourcesList.get(i).getImageData() != null) {
                dtos.get(i).setImageUrl("Resource/image/" + resourcesList.get(i).getId());
            }
        }
        return dtos;
    }

    // ── GET BY ID ────────────────────────────────────────────────────
    public ResourceDTO getResourceById(Long id) {
        Resource resource = findById(id);
        ResourceDTO dto = modelMapper.map(resource, ResourceDTO.class);
        if (resource.getImageData() != null) {
            dto.setImageUrl("Resource/image/" + id);
        }
        return dto;
    }

    // ── GET IMAGE (raw bytes for the controller to serve) ────────────
    public ResponseEntity<byte[]> getResourceImage(Long id) {
        Resource resource = findById(id);

        if (resource.getImageData() == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(resource.getImageType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + resource.getImageName() + "\"")
                .body(resource.getImageData());
    }

    // ── CREATE ───────────────────────────────────────────────────────
    public ResourceDTO addResource(ResourceDTO resourceDTO, MultipartFile image) {
        Resource resource = modelMapper.map(resourceDTO, Resource.class);
        applyImage(resource, image);
        Resource saved = resourceRepo.save(resource);

        ResourceDTO result = modelMapper.map(saved, ResourceDTO.class);
        if (saved.getImageData() != null) {
            result.setImageUrl("Resource/image/" + saved.getId());
        }
        return result;
    }

    // ── UPDATE ───────────────────────────────────────────────────────
    public ResourceDTO updateResource(Long id, ResourceDTO resourceDTO, MultipartFile image) {
        if (!resourceRepo.existsById(id)) {
            throw new RuntimeException("Resource not found with id: " + id);
        }
        Resource resource = modelMapper.map(resourceDTO, Resource.class);
        resource.setId(id);

        // Keep existing image if no new image is provided
        if (image == null || image.isEmpty()) {
            Resource existing = findById(id);
            resource.setImageData(existing.getImageData());
            resource.setImageType(existing.getImageType());
            resource.setImageName(existing.getImageName());
        } else {
            applyImage(resource, image);
        }

        Resource updated = resourceRepo.save(resource);
        ResourceDTO result = modelMapper.map(updated, ResourceDTO.class);
        if (updated.getImageData() != null) {
            result.setImageUrl("Resource/image/" + updated.getId());
        }
        return result;
    }

    // ── DELETE ───────────────────────────────────────────────────────
    public String deleteResource(Long id) {
        if (!resourceRepo.existsById(id)) {
            throw new RuntimeException("Resource not found with id: " + id);
        }
        resourceRepo.deleteById(id);
        return "Resource with id " + id + " deleted successfully";
    }

    // ── Helpers ──────────────────────────────────────────────────────
    private Resource findById(Long id) {
        return resourceRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found with id: " + id));
    }

    private void applyImage(Resource resource, MultipartFile image) {
        if (image != null && !image.isEmpty()) {
            try {
                resource.setImageData(image.getBytes());
                resource.setImageType(image.getContentType());
                resource.setImageName(image.getOriginalFilename());
            } catch (IOException e) {
                throw new RuntimeException("Failed to read image: " + e.getMessage(), e);
            }
        }
    }
}