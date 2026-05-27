package com.unimag.emitix.repository;

import com.unimag.emitix.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    Optional<PasswordResetToken> findFirstByUserEmailAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            String userEmail,
            LocalDateTime now
    );

    @Modifying
    @Query("UPDATE PasswordResetToken t SET t.used = true WHERE t.userEmail = :email AND t.used = false")
    void invalidatePreviousTokens(@Param("email") String email);
}
