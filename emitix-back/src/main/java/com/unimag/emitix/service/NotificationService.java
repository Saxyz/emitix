package com.unimag.emitix.service;

import com.unimag.emitix.dto.NotificationResponse;
import com.unimag.emitix.entity.ActivityLog;
import com.unimag.emitix.entity.User;
import com.unimag.emitix.entity.enums.ActivityResult;
import com.unimag.emitix.entity.enums.EntityType;
import com.unimag.emitix.exception.ResourceNotFoundException;
import com.unimag.emitix.repository.ActivityLogRepository;
import com.unimag.emitix.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<NotificationResponse> getRecentNotifications(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "username", username));

        UUID companyId = user.getCompany() != null ? user.getCompany().getId() : null;
        if (companyId == null) return List.of();

        List<ActivityLog> logs = activityLogRepository
                .findRecentByCompanyId(companyId, Pageable.ofSize(20));

        return logs.stream().map(this::toNotification).toList();
    }

    private NotificationResponse toNotification(ActivityLog log) {
        String type = switch (log.getResult()) {
            case FALLIDO -> "warning";
            case EXITOSO -> log.getEntity() == EntityType.FACTURA ? "success" : "default";
            case PARCIAL -> "info";
        };

        String title = buildTitle(log);
        String message = log.getDescription() != null ? log.getDescription() : log.getAction();

        return new NotificationResponse(
                log.getId(), type, title, message, log.getCreatedAt(), true
        );
    }

    private String buildTitle(ActivityLog log) {
        String ref = log.getEntityRef() != null ? " " + log.getEntityRef() : "";
        return switch (log.getEntity()) {
            case FACTURA -> "Factura" + ref;
            case USUARIO -> "Usuario" + ref;
            case EMPRESA -> "Empresa" + ref;
            case COMPRADOR -> "Comprador" + ref;
            case PRODUCTO -> "Producto" + ref;
            case RESOLUCION -> "Resolución" + ref;
            case AUTH -> "Sesión" + ref;
        };
    }
}
