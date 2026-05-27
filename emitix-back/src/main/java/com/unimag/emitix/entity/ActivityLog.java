package com.unimag.emitix.entity;

import com.unimag.emitix.entity.enums.ActivityResult;
import com.unimag.emitix.entity.enums.ActorType;
import com.unimag.emitix.entity.enums.EntityType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "activity_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "username", length = 50)
    private String username;

    @Enumerated(EnumType.STRING)
    @Column(name = "actor_type", nullable = false, length = 20)
    @Builder.Default
    private ActorType actorType = ActorType.USUARIO;

    @Column(name = "action", nullable = false, length = 100)
    private String action;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity", nullable = false, length = 50)
    private EntityType entity;

    @Column(name = "entity_id", nullable = false, length = 36)
    private String entityId;

    @Column(name = "entity_ref", length = 100)
    private String entityRef;

    @Enumerated(EnumType.STRING)
    @Column(name = "result", nullable = false, length = 20)
    @Builder.Default
    private ActivityResult result = ActivityResult.EXITOSO;

    @Column(name = "error_detail", columnDefinition = "TEXT")
    private String errorDetail;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata")
    private String metadata;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;
}
