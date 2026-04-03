package com.sliit.smartcampus.service;

import com.sliit.smartcampus.dto.ResourceDTO;
import com.sliit.smartcampus.model.Resource;
import com.sliit.smartcampus.repository.ResourceRepo;
import org.modelmapper.ModelMapper;
import org.modelmapper.TypeToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ResourceService {

    @Autowired
    private ResourceRepo resourceRepo;

    @Autowired
    private ModelMapper modelMapper;

    // GET ALL
    public List<ResourceDTO> getAllResources() {
        List<Resource> resourcesList = resourceRepo.findAll();
        return modelMapper.map(resourcesList, new TypeToken<List<ResourceDTO>>(){}.getType());
    }

    // GET BY ID
    public ResourceDTO getResourceById(Long id) {
        Resource resource = resourceRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found with id: " + id));
        return modelMapper.map(resource, ResourceDTO.class);
    }

    // CREATE
    public ResourceDTO addResource(ResourceDTO resourceDTO) {
        Resource resource = modelMapper.map(resourceDTO, Resource.class);
        Resource saved = resourceRepo.save(resource);
        return modelMapper.map(saved, ResourceDTO.class);
    }

    // UPDATE
    public ResourceDTO updateResource(Long id, ResourceDTO resourceDTO) {
        if (!resourceRepo.existsById(id)) {
            throw new RuntimeException("Resource not found with id: " + id);
        }
        Resource resource = modelMapper.map(resourceDTO, Resource.class);
        resource.setId(id);
        Resource updated = resourceRepo.save(resource);
        return modelMapper.map(updated, ResourceDTO.class);
    }

    // DELETE
    public String deleteResource(Long id) {
        if (!resourceRepo.existsById(id)) {
            throw new RuntimeException("Resource not found with id: " + id);
        }
        resourceRepo.deleteById(id);
        return "Resource with id " + id + " deleted successfully";
    }

}