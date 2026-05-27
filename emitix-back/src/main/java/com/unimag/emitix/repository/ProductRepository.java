package com.unimag.emitix.repository;

import com.unimag.emitix.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    // Buscar productos activos de una empresa por descripción o código
    @Query("SELECT p FROM Product p WHERE p.company.id = :companyId AND p.isActive = true AND " +
           "(:search IS NULL OR LOWER(p.description) LIKE CAST(:search AS string) " +
           "OR LOWER(p.internalCode) LIKE CAST(:search AS string) " +
           "OR LOWER(p.unspscCode) LIKE CAST(:search AS string))")
    Page<Product> findActiveByCompanyAndSearch(
            @Param("companyId") UUID companyId,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<Product> findByCompanyIdAndInternalCode(UUID companyId, String internalCode);

    boolean existsByCompanyIdAndInternalCode(UUID companyId, String internalCode);
}
