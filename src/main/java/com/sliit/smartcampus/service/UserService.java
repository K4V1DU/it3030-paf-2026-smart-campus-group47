package com.sliit.smartcampus.service;

import com.sliit.smartcampus.dto.UserDTO;
import com.sliit.smartcampus.model.User;
import com.sliit.smartcampus.repository.UserRepo;
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
public class UserService {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private ModelMapper modelMapper;

    // ── GET ALL ──────────────────────────────────────────────────────
    public List<UserDTO> getAllUsers() {
        List<User> userList = userRepo.findAll();
        List<UserDTO> dtos = modelMapper.map(userList, new TypeToken<List<UserDTO>>(){}.getType());

        for (int i = 0; i < userList.size(); i++) {
            if (userList.get(i).getImageData() != null) {
                dtos.get(i).setImageUrl("User/image/" + userList.get(i).getId());
            }
        }
        return dtos;
    }

    // ── GET BY ID ────────────────────────────────────────────────────
    public UserDTO getUserById(Long id) {
        User user = findById(id);
        UserDTO dto = modelMapper.map(user, UserDTO.class);
        if (user.getImageData() != null) {
            dto.setImageUrl("User/image/" + id);
        }
        return dto;
    }

    // ── GET PROFILE IMAGE ────────────────────────────────────────────
    public ResponseEntity<byte[]> getUserImage(Long id) {
        User user = findById(id);

        if (user.getImageData() == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(user.getImageType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + user.getImageName() + "\"")
                .body(user.getImageData());
    }

    // ── CREATE ───────────────────────────────────────────────────────
    public UserDTO addUser(UserDTO userDTO, MultipartFile image) {
        if (userRepo.existsByEmail(userDTO.getEmail())) {
            throw new RuntimeException("Email already in use: " + userDTO.getEmail());
        }

        User user = modelMapper.map(userDTO, User.class);
        applyImage(user, image);
        User saved = userRepo.save(user);

        UserDTO result = modelMapper.map(saved, UserDTO.class);
        if (saved.getImageData() != null) {
            result.setImageUrl("User/image/" + saved.getId());
        }
        return result;
    }

    // ── UPDATE ───────────────────────────────────────────────────────
    public UserDTO updateUser(Long id, UserDTO userDTO, MultipartFile image) {
        User existing = findById(id);

        // Prevent email conflict with another user
        if (!existing.getEmail().equals(userDTO.getEmail())
                && userRepo.existsByEmail(userDTO.getEmail())) {
            throw new RuntimeException("Email already in use: " + userDTO.getEmail());
        }

        User user = modelMapper.map(userDTO, User.class);
        user.setId(id);

        // Keep existing image if no new image is provided
        if (image == null || image.isEmpty()) {
            user.setImageData(existing.getImageData());
            user.setImageType(existing.getImageType());
            user.setImageName(existing.getImageName());
        } else {
            applyImage(user, image);
        }

        // Keep existing password (not updated via this endpoint)
        user.setPassword(existing.getPassword());

        User updated = userRepo.save(user);
        UserDTO result = modelMapper.map(updated, UserDTO.class);
        if (updated.getImageData() != null) {
            result.setImageUrl("User/image/" + updated.getId());
        }
        return result;
    }

    // ── DELETE ───────────────────────────────────────────────────────
    public String deleteUser(Long id) {
        if (!userRepo.existsById(id)) {
            throw new RuntimeException("User not found with id: " + id);
        }
        userRepo.deleteById(id);
        return "User with id " + id + " deleted successfully";
    }

    // ── Helpers ──────────────────────────────────────────────────────
    private User findById(Long id) {
        return userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    private void applyImage(User user, MultipartFile image) {
        if (image != null && !image.isEmpty()) {
            try {
                user.setImageData(image.getBytes());
                user.setImageType(image.getContentType());
                user.setImageName(image.getOriginalFilename());
            } catch (IOException e) {
                throw new RuntimeException("Failed to read image: " + e.getMessage(), e);
            }
        }
    }
}
