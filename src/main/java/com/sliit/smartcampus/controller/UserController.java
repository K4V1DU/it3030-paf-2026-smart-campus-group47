package com.sliit.smartcampus.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.sliit.smartcampus.dto.UserDTO;
import com.sliit.smartcampus.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping(value = "User/")
public class UserController {

    @Autowired
    private UserService userService;

    // GET ALL
    @GetMapping("getAllUsers")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // GET BY ID
    @GetMapping("getUser/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // GET PROFILE IMAGE
    // React usage: <img src="http://localhost:8080/User/image/1" />
    @GetMapping("image/{id}")
    public ResponseEntity<byte[]> getUserImage(@PathVariable Long id) {
        return userService.getUserImage(id);
    }

    // CREATE
    @PostMapping(value = "addUser", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserDTO> addUser(
            @RequestParam("user") String userJson,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        UserDTO userDTO = mapper.readValue(userJson, UserDTO.class);
        return new ResponseEntity<>(userService.addUser(userDTO, image), HttpStatus.CREATED);
    }

    // UPDATE
    @PutMapping(value = "updateUser/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable Long id,
            @RequestParam("user") String userJson,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        UserDTO userDTO = mapper.readValue(userJson, UserDTO.class);
        return ResponseEntity.ok(userService.updateUser(id, userDTO, image));
    }

    // DELETE
    @DeleteMapping("deleteUser/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.deleteUser(id));
    }
}
