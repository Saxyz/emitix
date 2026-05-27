package com.unimag.emitix.repository;

import com.unimag.emitix.entity.Buyer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BuyerRepository extends JpaRepository<Buyer, UUID> {

    // Buscar comprador por número de documento dentro de una empresa
    Optional<Buyer> findByCompanyIdAndDocumentNumber(UUID companyId, String documentNumber);

    // Verificar existencia por número de documento en empresa
    boolean existsByCompanyIdAndDocumentNumber(UUID companyId, String documentNumber);

    // Búsqueda paginada por número de documento o nombre dentro de una empresa (todos)
    @Query("SELECT b FROM Buyer b WHERE b.company.id = :companyId AND " +
           "(:search IS NULL OR LOWER(b.documentNumber) LIKE CAST(:search AS string) " +
           "OR LOWER(b.fullName) LIKE CAST(:search AS string))")
    Page<Buyer> findByCompanyAndSearch(
            @Param("companyId") UUID companyId,
            @Param("search") String search,
            Pageable pageable
    );

    // Búsqueda paginada solo de compradores activos (para selección en facturas)
    @Query("SELECT b FROM Buyer b WHERE b.company.id = :companyId AND b.isActive = true AND " +
           "(:search IS NULL OR LOWER(b.documentNumber) LIKE CAST(:search AS string) " +
           "OR LOWER(b.fullName) LIKE CAST(:search AS string))")
    Page<Buyer> findActiveByCompanyAndSearch(
            @Param("companyId") UUID companyId,
            @Param("search") String search,
            Pageable pageable
    );
}
