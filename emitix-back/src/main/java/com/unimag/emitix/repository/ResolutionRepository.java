package com.unimag.emitix.repository;

import com.unimag.emitix.entity.Resolution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResolutionRepository extends JpaRepository<Resolution, UUID> {

    List<Resolution> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);

    // Resolución activa más reciente de la empresa (para asignar numeración)
    Optional<Resolution> findFirstByCompanyIdAndIsActiveTrueOrderByCreatedAtDesc(UUID companyId);
}
