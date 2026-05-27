package com.unimag.emitix.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        String type,
        String title,
        String message,
        LocalDateTime createdAt,
        boolean unread
) {}
