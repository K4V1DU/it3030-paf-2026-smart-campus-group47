package com.sliit.smartcampus.controller;

import com.sliit.smartcampus.dto.NotificationDTO;
import com.sliit.smartcampus.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping(value = "Notification/")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    // GET ALL
    @GetMapping("getAllNotifications")
    public ResponseEntity<List<NotificationDTO>> getAllNotifications() {
        return ResponseEntity.ok(notificationService.getAllNotifications());
    }

    // GET BY ID
    @GetMapping("getNotification/{id}")
    public ResponseEntity<NotificationDTO> getNotificationById(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.getNotificationById(id));
    }

    // GET ALL BY USER ID
    @GetMapping("getByUser/{userId}")
    public ResponseEntity<List<NotificationDTO>> getNotificationsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getNotificationsByUserId(userId));
    }

    // GET UNREAD BY USER ID
    @GetMapping("getUnread/{userId}")
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getUnreadNotificationsByUserId(userId));
    }

    // CREATE
    @PostMapping("addNotification")
    public ResponseEntity<NotificationDTO> addNotification(@RequestBody NotificationDTO notificationDTO) {
        return new ResponseEntity<>(notificationService.addNotification(notificationDTO), HttpStatus.CREATED);
    }

    // MARK AS READ
    @PutMapping("markAsRead/{id}")
    public ResponseEntity<NotificationDTO> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    // DELETE
    @DeleteMapping("deleteNotification/{id}")
    public ResponseEntity<String> deleteNotification(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.deleteNotification(id));
    }

    // DELETE ALL BY USER ID
    @DeleteMapping("deleteAllByUser/{userId}")
    public ResponseEntity<String> deleteAllByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.deleteAllByUserId(userId));
    }
}
