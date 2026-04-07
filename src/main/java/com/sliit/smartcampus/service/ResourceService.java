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
import com.sliit.smartcampus.model.Booking;
import com.sliit.smartcampus.repository.BookingRepo;

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
        List<ResourceDTO> dtos = modelMapper.map(
                resourcesList, new TypeToken<List<ResourceDTO>>(){}.getType());

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

    // ── GET IMAGE ────────────────────────────────────────────────────
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
    public ResourceDTO addResource(ResourceDTO dto, MultipartFile image) {
        Resource resource = new Resource();
        applyDtoFields(resource, dto);
        applyImage(resource, image);
        return toDTO(resourceRepo.save(resource));
    }

    // ── UPDATE ───────────────────────────────────────────────────────
    public ResourceDTO updateResource(Long id, ResourceDTO dto, MultipartFile image) {
        Resource resource = findById(id);
        applyDtoFields(resource, dto);
        if (image != null && !image.isEmpty()) {
            applyImage(resource, image);
        }
        // No image in request = keep existing image untouched
        return toDTO(resourceRepo.save(resource));
    }

    // ── REMOVE IMAGE ONLY ────────────────────────────────────────────
    public ResourceDTO removeResourceImage(Long id) {
        Resource resource = findById(id);
        resource.setImageData(null);
        resource.setImageType(null);
        resource.setImageName(null);
        return toDTO(resourceRepo.save(resource));
    }

    @Autowired
    private BookingRepo bookingRepo;

    // ── DELETE ───────────────────────────────────────────────────────
    public String deleteResource(Long id) {
        if (!resourceRepo.existsById(id)) {
            throw new RuntimeException("Resource not found with id: " + id);
        }
        // Delete all bookings related to this resource first
        List<Booking> relatedBookings = bookingRepo.findByResourceId(id);
        if (!relatedBookings.isEmpty()) {
            bookingRepo.deleteAll(relatedBookings);
        }
        resourceRepo.deleteById(id);
        return "Resource with id " + id + " deleted successfully";
    }

    // ── Private helpers ───────────────────────────────────────────────

    private Resource findById(Long id) {
        return resourceRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found with id: " + id));
    }

    private void applyDtoFields(Resource resource, ResourceDTO dto) {
        resource.setName(dto.getName());
        resource.setType(dto.getType());
        resource.setCapacity(dto.getCapacity());
        resource.setLocation(dto.getLocation());
        resource.setDescription(dto.getDescription());
        resource.setAvailableFrom(dto.getAvailableFrom());
        resource.setAvailableTo(dto.getAvailableTo());
        resource.setStatus(dto.getStatus());
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

    private ResourceDTO toDTO(Resource resource) {
        ResourceDTO dto = modelMapper.map(resource, ResourceDTO.class);
        if (resource.getImageData() != null) {
            dto.setImageUrl("Resource/image/" + resource.getId());
        }
        return dto;
    }
}