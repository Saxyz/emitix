package com.unimag.emitix.service;

import com.unimag.emitix.dto.ActivityResponse;
import com.unimag.emitix.dto.PageResponse;
import com.unimag.emitix.entity.ActivityLog;
import com.unimag.emitix.entity.enums.ActivityResult;
import com.unimag.emitix.entity.enums.ActorType;
import com.unimag.emitix.entity.enums.EntityType;
import com.unimag.emitix.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final ActivityLogRepository activityLogRepository;

    @Lazy
    @Autowired
    private AuditLogService self;

    private String captureClientIp() {
        try {
            var attrs = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            HttpServletRequest req = attrs.getRequest();
            String forwarded = req.getHeader("X-Forwarded-For");
            return (forwarded != null && !forwarded.isBlank())
                    ? forwarded.split(",")[0].trim()
                    : req.getRemoteAddr();
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Registra una acción en el log de auditoría.
     * Usa propagation REQUIRES_NEW para que el log no dependa de la transacción llamante.
     */
    public void record(String username, String action, EntityType entity,
                       String entityId, String entityRef, String description) {
        String ip = captureClientIp();
        self.record(username, action, entity, entityId, entityRef, description,
                ActivityResult.EXITOSO, null, ip, null);
    }

    public void recordFailure(String username, String action, EntityType entity,
                              String entityId, String entityRef, String description,
                              String errorDetail) {
        String ip = captureClientIp();
        self.record(username, action, entity, entityId, entityRef, description,
                ActivityResult.FALLIDO, errorDetail, ip, null);
    }

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String username, String action, EntityType entity,
                       String entityId, String entityRef, String description,
                       ActivityResult result, String errorDetail,
                       String ipAddress, String userAgent) {
        try {
            ActivityLog entry = ActivityLog.builder()
                    .username(username)
                    .actorType(ActorType.USUARIO)
                    .action(action)
                    .entity(entity)
                    .entityId(entityId != null ? entityId : "N/A")
                    .entityRef(entityRef)
                    .description(description)
                    .result(result)
                    .errorDetail(errorDetail)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build();

            activityLogRepository.save(entry);
        } catch (Exception e) {
            // El log no debe tumbar el flujo principal
            log.error("Error guardando activity log: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<ActivityResponse> findAll(
            String username, String action, String entity,
            LocalDateTime from, LocalDateTime to, Pageable pageable) {

        EntityType entityType = null;
        if (entity != null && !entity.isBlank()) {
            try {
                entityType = EntityType.valueOf(entity.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Valor inválido → ignorar filtro
            }
        }

        String usernameParam = (username != null && !username.isBlank()) ? "%" + username.toLowerCase() + "%" : null;
        String actionParam = (action != null && !action.isBlank()) ? "%" + action.toLowerCase() + "%" : null;

        return PageResponse.of(
                activityLogRepository
                        .findByFilters(usernameParam, actionParam, entityType, from, to, pageable)
                        .map(this::toResponse)
        );
    }

    private ActivityResponse toResponse(ActivityLog a) {
        return new ActivityResponse(
                a.getId(),
                a.getUsername(),
                a.getActorType().name(),
                a.getAction(),
                a.getEntity().name(),
                a.getEntityId(),
                a.getEntityRef(),
                a.getDescription(),
                a.getResult().name(),
                a.getErrorDetail(),
                a.getIpAddress(),
                a.getCreatedAt()
        );
    }
}
