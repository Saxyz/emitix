package com.unimag.emitix.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ActivityResponse(
        UUID id,
        String username,
        String actorType,
        String action,
        String entity,
        String entityId,
        String entityRef,
        String description,
        String result,
        String errorDetail,
        String ipAddress,
        LocalDateTime createdAt
) {}
