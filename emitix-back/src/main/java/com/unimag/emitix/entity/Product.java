package com.unimag.emitix.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "products",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_product_code",
        columnNames = {"company_id", "internal_code"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "internal_code", nullable = false, length = 100)
    private String internalCode;

    @Column(name = "description", nullable = false, length = 300)
    private String description;

    @Column(name = "unspsc_code", length = 8)
    private String unspscCode;

    @Column(name = "unit", nullable = false, length = 10)
    @Builder.Default
    private String unit = "UND";

    @Column(name = "unit_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "currency", nullable = false, length = 3)
    @Builder.Default
    private String currency = "COP";

    @Column(name = "tax_rate", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal taxRate = new BigDecimal("19.00");

    @Column(name = "is_iva_excluded", nullable = false)
    @Builder.Default
    private boolean isIvaExcluded = false;

    @Column(name = "is_service", nullable = false)
    @Builder.Default
    private boolean isService = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
    @Builder.Default
    private List<InvoiceItem> invoiceItems = new ArrayList<>();
}
