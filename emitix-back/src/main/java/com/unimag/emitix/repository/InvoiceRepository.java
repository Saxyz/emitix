package com.unimag.emitix.repository;

import com.unimag.emitix.entity.Invoice;
import com.unimag.emitix.entity.enums.InvoiceStatus;
import com.unimag.emitix.entity.enums.InvoiceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    Page<Invoice> findAll(Pageable pageable);

    Page<Invoice> findByBuyerId(UUID buyerId, Pageable pageable);

    @Query("SELECT i FROM Invoice i WHERE " +
           "(:status IS NULL OR i.status = :status) AND " +
           "(:buyerName IS NULL OR LOWER(i.buyer.fullName) LIKE CAST(:buyerName AS string)) AND " +
           "(:invoiceNumber IS NULL OR i.number LIKE CAST(:invoiceNumber AS string) OR CONCAT(i.prefix, i.number) LIKE CAST(:invoiceNumber AS string))")
    Page<Invoice> findByFilters(
            @Param("status") InvoiceStatus status,
            @Param("buyerName") String buyerName,
            @Param("invoiceNumber") String invoiceNumber,
            Pageable pageable
    );

    @Query(value = "SELECT NEXTVAL('invoice_number_seq')", nativeQuery = true)
    Long getNextSequenceValue();

    long countByStatus(InvoiceStatus status);

    @Query("SELECT COALESCE(SUM(i.total), 0) FROM Invoice i WHERE i.issuedAt BETWEEN :from AND :to")
    BigDecimal sumTotalBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COALESCE(SUM(i.taxTotal), 0) FROM Invoice i WHERE i.issuedAt BETWEEN :from AND :to")
    BigDecimal sumTaxBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT i FROM Invoice i WHERE " +
           "(CAST(:from AS LocalDateTime) IS NULL OR i.issuedAt >= :from) AND " +
           "(CAST(:to AS LocalDateTime) IS NULL OR i.issuedAt <= :to) AND " +
           "(CAST(:status AS string) IS NULL OR i.status = :status) AND " +
           "(CAST(:invoiceType AS string) IS NULL OR i.invoiceType = :invoiceType)")
    Page<Invoice> findByReportFilters(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("status") InvoiceStatus status,
            @Param("invoiceType") InvoiceType invoiceType,
            Pageable pageable
    );
}
