package com.sliit.smartcampus.service;

import com.sliit.smartcampus.dto.NotificationDTO;
import com.sliit.smartcampus.model.Notification;
import com.sliit.smartcampus.model.User;
import com.sliit.smartcampus.repository.NotificationRepo;
import com.sliit.smartcampus.repository.UserRepo;
import org.modelmapper.ModelMapper;
import org.modelmapper.TypeToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class NotificationService {

    @Autowired
    private NotificationRepo notificationRepo;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private ModelMapper modelMapper;

    // ── GET ALL ──────────────────────────────────────────────────────
    public List<NotificationDTO> getAllNotifications() {
        List<Notification> notifications = notificationRepo.findAll();
        return mapToDTOList(notifications);
    }

    // ── GET BY ID ────────────────────────────────────────────────────
    public NotificationDTO getNotificationById(Long id) {
        Notification notification = findById(id);
        return mapToDTO(notification);
    }

    // ── GET ALL BY USER ID ───────────────────────────────────────────
    public List<NotificationDTO> getNotificationsByUserId(Long userId) {
        findUserById(userId);
        List<Notification> notifications = notificationRepo.findByUserId(userId);
        return mapToDTOList(notifications);
    }

    // ── GET UNREAD BY USER ID ────────────────────────────────────────
    public List<NotificationDTO> getUnreadNotificationsByUserId(Long userId) {
        findUserById(userId);
        List<Notification> notifications = notificationRepo.findByUserIdAndIsRead(userId, false);
        return mapToDTOList(notifications);
    }

    // ── CREATE ───────────────────────────────────────────────────────
    public NotificationDTO addNotification(NotificationDTO notificationDTO) {
        User user = findUserById(notificationDTO.getUserId());

        Notification notification = modelMapper.map(notificationDTO, Notification.class);
        notification.setUser(user);
        notification.setRead(false);
        notification.setReadAt(null);

        Notification saved = notificationRepo.save(notification);
        return mapToDTO(saved);
    }

    // ── MARK AS READ ─────────────────────────────────────────────────
    public NotificationDTO markAsRead(Long id) {
        Notification notification = findById(id);

        notification.setRead(true);
        notification.setReadAt(LocalDateTime.now());

        Notification updated = notificationRepo.save(notification);
        return mapToDTO(updated);
    }

    // ── DELETE ───────────────────────────────────────────────────────
    public String deleteNotification(Long id) {
        if (!notificationRepo.existsById(id)) {
            throw new RuntimeException("Notification not found with id: " + id);
        }
        notificationRepo.deleteById(id);
        return "Notification with id " + id + " deleted successfully";
    }

    // ── DELETE ALL BY USER ID ────────────────────────────────────────
    public String deleteAllByUserId(Long userId) {
        findUserById(userId);
        notificationRepo.deleteByUserId(userId);
        return "All notifications for user with id " + userId + " deleted successfully";
    }

    // ── Helpers ──────────────────────────────────────────────────────
    private Notification findById(Long id) {
        return notificationRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + id));
    }

    private User findUserById(Long userId) {
        return userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
    }

    private NotificationDTO mapToDTO(Notification notification) {
        NotificationDTO dto = modelMapper.map(notification, NotificationDTO.class);
        dto.setUserId(notification.getUser().getId());
        return dto;
    }

    private List<NotificationDTO> mapToDTOList(List<Notification> notifications) {
        List<NotificationDTO> dtos = modelMapper.map(notifications, new TypeToken<List<NotificationDTO>>(){}.getType());
        for (int i = 0; i < notifications.size(); i++) {
            dtos.get(i).setUserId(notifications.get(i).getUser().getId());
        }
        return dtos;
    }
}
