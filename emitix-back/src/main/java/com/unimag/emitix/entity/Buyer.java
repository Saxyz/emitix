package com.unimag.emitix.entity;

import com.unimag.emitix.entity.enums.DocumentType;
import com.unimag.emitix.entity.enums.FiscalRegime;
import com.unimag.emitix.entity.enums.OrganizationType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "buyers",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_buyer_per_company",
        columnNames = {"company_id", "document_number"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Buyer extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "document_number", nullable = false, length = 20)
    private String documentNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 10)
    private DocumentType documentType;

    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(name = "organization_type", nullable = false, length = 10)
    private OrganizationType organizationType;

    @Enumerated(EnumType.STRING)
    @Column(name = "fiscal_regime", length = 10)
    private FiscalRegime fiscalRegime;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "address", length = 300)
    private String address;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "department", length = 100)
    private String department;

    @Column(name = "postal_code", length = 10)
    private String postalCode;

    @Column(name = "country", nullable = false, length = 2)
    @Builder.Default
    private String country = "CO";

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
