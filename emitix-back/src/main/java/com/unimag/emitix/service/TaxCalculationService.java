package com.unimag.emitix.service;

import com.unimag.emitix.entity.Invoice;
import com.unimag.emitix.entity.InvoiceItem;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Slf4j
@Service
public class TaxCalculationService {

    @Value("${app.invoice.tax-rate:19.00}")
    private BigDecimal defaultTaxRate;

    /**
     * Calculates and updates all monetary fields for each item in the invoice,
     * then recalculates invoice totals.
     */
    public void calculateInvoiceTotals(Invoice invoice) {
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;

        for (InvoiceItem item : invoice.getItems()) {
            calculateItemAmounts(item);
            subtotal = subtotal.add(item.getSubtotal());
            totalTax = totalTax.add(item.getTaxTotal());
        }

        invoice.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
        invoice.setTaxTotal(totalTax.setScale(2, RoundingMode.HALF_UP));
        invoice.setTotal(subtotal.add(totalTax).setScale(2, RoundingMode.HALF_UP));

        log.debug("Invoice totals calculated — subtotal: {}, taxTotal: {}, total: {}",
                invoice.getSubtotal(), invoice.getTaxTotal(), invoice.getTotal());
    }

    /**
     * Calculates subtotal and taxTotal for a single invoice item.
     * taxRate is stored as a percentage (e.g. 19.00 = 19%), matching DDL DECIMAL(5,2).
     */
    public void calculateItemAmounts(InvoiceItem item) {
        BigDecimal taxRate = (item.getTaxRate() != null) ? item.getTaxRate() : defaultTaxRate;
        BigDecimal qty = item.getQuantity();
        BigDecimal unitPrice = item.getUnitPrice();
        BigDecimal discountPct = (item.getDiscountPct() != null) ? item.getDiscountPct() : BigDecimal.ZERO;

        BigDecimal baseAmount = qty.multiply(unitPrice);
        BigDecimal discountAmount = baseAmount.multiply(discountPct.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
        BigDecimal itemSubtotal = baseAmount.subtract(discountAmount).setScale(2, RoundingMode.HALF_UP);
        BigDecimal itemTax = itemSubtotal.multiply(taxRate.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP))
                .setScale(2, RoundingMode.HALF_UP);

        item.setTaxRate(taxRate);
        item.setSubtotal(itemSubtotal);
        item.setTaxTotal(itemTax);
    }
}
