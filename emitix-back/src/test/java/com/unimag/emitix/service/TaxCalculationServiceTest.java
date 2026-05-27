package com.unimag.emitix.service;

import com.unimag.emitix.entity.Invoice;
import com.unimag.emitix.entity.InvoiceItem;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class TaxCalculationServiceTest {

    private TaxCalculationService taxCalculationService;

    @BeforeEach
    void setUp() {
        taxCalculationService = new TaxCalculationService();
        // Inyectar el @Value manualmente (19.00 = 19%)
        ReflectionTestUtils.setField(taxCalculationService, "defaultTaxRate", new BigDecimal("19.00"));
    }

    // ── calculateItemAmounts ──────────────────────────────────────────────────

    @Test
    void calculateItemAmounts_noDiscount_correctSubtotalAndTax() {
        InvoiceItem item = InvoiceItem.builder()
                .quantity(new BigDecimal("2"))
                .unitPrice(new BigDecimal("100000.00"))
                .taxRate(new BigDecimal("19.00"))
                .discountPct(BigDecimal.ZERO)
                .build();

        taxCalculationService.calculateItemAmounts(item);

        // subtotal = 2 × 100 000 = 200 000
        assertEquals(new BigDecimal("200000.00"), item.getSubtotal());
        // taxTotal = 200 000 × 0.19 = 38 000
        assertEquals(new BigDecimal("38000.00"), item.getTaxTotal());
    }

    @Test
    void calculateItemAmounts_withDiscount_reducesSubtotalBeforeTax() {
        InvoiceItem item = InvoiceItem.builder()
                .quantity(new BigDecimal("1"))
                .unitPrice(new BigDecimal("100000.00"))
                .taxRate(new BigDecimal("19.00"))
                .discountPct(new BigDecimal("10.00")) // 10% descuento
                .build();

        taxCalculationService.calculateItemAmounts(item);

        // subtotal = 100 000 × (1 - 0.10) = 90 000
        assertEquals(new BigDecimal("90000.00"), item.getSubtotal());
        // taxTotal = 90 000 × 0.19 = 17 100
        assertEquals(new BigDecimal("17100.00"), item.getTaxTotal());
    }

    @Test
    void calculateItemAmounts_nullTaxRate_usesDefault19() {
        InvoiceItem item = InvoiceItem.builder()
                .quantity(BigDecimal.ONE)
                .unitPrice(new BigDecimal("100000.00"))
                .taxRate(null)
                .discountPct(BigDecimal.ZERO)
                .build();

        taxCalculationService.calculateItemAmounts(item);

        // taxRate por defecto 19%
        assertEquals(new BigDecimal("19.00"), item.getTaxRate());
        assertEquals(new BigDecimal("19000.00"), item.getTaxTotal());
    }

    @Test
    void calculateItemAmounts_zeroTaxRate_noTax() {
        InvoiceItem item = InvoiceItem.builder()
                .quantity(new BigDecimal("3"))
                .unitPrice(new BigDecimal("50000.00"))
                .taxRate(BigDecimal.ZERO)
                .discountPct(BigDecimal.ZERO)
                .build();

        taxCalculationService.calculateItemAmounts(item);

        assertEquals(new BigDecimal("150000.00"), item.getSubtotal());
        assertEquals(new BigDecimal("0.00"), item.getTaxTotal());
    }

    // ── calculateInvoiceTotals ────────────────────────────────────────────────

    @Test
    void calculateInvoiceTotals_multipleItems_aggregatesCorrectly() {
        InvoiceItem item1 = InvoiceItem.builder()
                .quantity(new BigDecimal("2"))
                .unitPrice(new BigDecimal("100000.00"))
                .taxRate(new BigDecimal("19.00"))
                .discountPct(BigDecimal.ZERO)
                .build();

        InvoiceItem item2 = InvoiceItem.builder()
                .quantity(new BigDecimal("1"))
                .unitPrice(new BigDecimal("50000.00"))
                .taxRate(new BigDecimal("19.00"))
                .discountPct(BigDecimal.ZERO)
                .build();

        Invoice invoice = new Invoice();
        invoice.setItems(List.of(item1, item2));
        invoice.setSubtotal(BigDecimal.ZERO);
        invoice.setTaxTotal(BigDecimal.ZERO);
        invoice.setTotal(BigDecimal.ZERO);

        taxCalculationService.calculateInvoiceTotals(invoice);

        // item1: subtotal=200 000, tax=38 000
        // item2: subtotal=50 000, tax=9 500
        assertEquals(new BigDecimal("250000.00"), invoice.getSubtotal());
        assertEquals(new BigDecimal("47500.00"),  invoice.getTaxTotal());
        assertEquals(new BigDecimal("297500.00"), invoice.getTotal());
    }

    @Test
    void calculateInvoiceTotals_singleItem_isConsistent() {
        InvoiceItem item = InvoiceItem.builder()
                .quantity(BigDecimal.ONE)
                .unitPrice(new BigDecimal("3000000.00"))
                .taxRate(new BigDecimal("19.00"))
                .discountPct(BigDecimal.ZERO)
                .build();

        Invoice invoice = new Invoice();
        invoice.setItems(List.of(item));
        invoice.setSubtotal(BigDecimal.ZERO);
        invoice.setTaxTotal(BigDecimal.ZERO);
        invoice.setTotal(BigDecimal.ZERO);

        taxCalculationService.calculateInvoiceTotals(invoice);

        assertEquals(new BigDecimal("3000000.00"), invoice.getSubtotal());
        assertEquals(new BigDecimal("570000.00"),  invoice.getTaxTotal());
        assertEquals(new BigDecimal("3570000.00"), invoice.getTotal());
        // Verificar coherencia: total = subtotal + taxTotal
        assertEquals(invoice.getSubtotal().add(invoice.getTaxTotal()), invoice.getTotal());
    }
}
