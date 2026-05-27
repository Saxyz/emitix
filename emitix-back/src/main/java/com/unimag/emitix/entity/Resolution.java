package com.unimag.emitix.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "resolutions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resolution extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "resolution_number", length = 50)
    private String resolutionNumber;

    @Column(name = "resolution_date")
    private LocalDate resolutionDate;

    @Column(name = "prefix", nullable = false, length = 10)
    private String prefix;

    @Column(name = "range_from", nullable = false)
    private long rangeFrom;

    @Column(name = "range_to", nullable = false)
    private long rangeTo;

    @Column(name = "current_number", nullable = false)
    @Builder.Default
    private long currentNumber = 0L;

    @Column(name = "valid_from", nullable = false)
    private LocalDate validFrom;

    @Column(name = "valid_until", nullable = false)
    private LocalDate validUntil;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @OneToMany(mappedBy = "resolution", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Invoice> invoices = new ArrayList<>();
}
