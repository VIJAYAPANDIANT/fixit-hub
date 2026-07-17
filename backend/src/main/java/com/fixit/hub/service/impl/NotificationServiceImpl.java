package com.fixit.hub.service.impl;

import com.fixit.hub.domain.entity.Notification;
import com.fixit.hub.domain.entity.User;
import com.fixit.hub.dto.NotificationResponse;
import com.fixit.hub.exception.ResourceNotFoundException;
import com.fixit.hub.repository.jpa.NotificationRepository;
import com.fixit.hub.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    public List<NotificationResponse> getUserNotifications(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(n -> new NotificationResponse(
                        n.getId(),
                        n.getType(),
                        n.getTitle(),
                        n.getMessage(),
                        n.isRead(),
                        n.getCreatedAt().toString()
                ))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void markAsRead(UUID id, User user) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with ID: " + id));
        if (notification.getUser().getId().equals(user.getId())) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }

    @Override
    @Transactional
    public void markAllAsRead(User user) {
        List<Notification> unread = notificationRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .filter(n -> !n.isRead())
                .collect(Collectors.toList());
        for (Notification n : unread) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unread);
    }
}
