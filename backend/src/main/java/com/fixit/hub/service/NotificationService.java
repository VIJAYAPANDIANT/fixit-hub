package com.fixit.hub.service;

import com.fixit.hub.domain.entity.User;
import com.fixit.hub.dto.NotificationResponse;
import java.util.List;
import java.util.UUID;

public interface NotificationService {
    List<NotificationResponse> getUserNotifications(User user);
    void markAsRead(UUID id, User user);
    void markAllAsRead(User user);
}
