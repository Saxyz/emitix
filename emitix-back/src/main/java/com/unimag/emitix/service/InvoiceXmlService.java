package com.unimag.emitix.service;

import com.unimag.emitix.entity.Invoice;
import com.unimag.emitix.entity.InvoiceItem;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Slf4j
@Service
public class InvoiceXmlService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    /**
     * Generates a simplified XML representation of the invoice for internal use
     * and simulated DIAN submission. Not a real UBL 2.1 document.
     */
    public String generateXml(Invoice invoice) {
        String fullInvoiceNumber = invoice.getPrefix() + "-" + invoice.getNumber();
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<Invoice xmlns=\"urn:emitix:invoice:1.0\">\n");

        // Header
        xml.append("  <Header>\n");
        xml.append("    <InvoiceNumber>").append(esc(fullInvoiceNumber)).append("</InvoiceNumber>\n");
        xml.append("    <IssueDate>").append(invoice.getCreatedAt().format(DATE_FORMATTER)).append("</IssueDate>\n");
        xml.append("    <IssueTime>").append(invoice.getCreatedAt().format(DATETIME_FORMATTER)).append("</IssueTime>\n");
        xml.append("    <Status>").append(invoice.getStatus().name()).append("</Status>\n");
        xml.append("  </Header>\n");

        // Supplier
        xml.append("  <Supplier>\n");
        xml.append("    <DocumentNumber>").append(esc(invoice.getCompany().getDocumentNumber())).append("</DocumentNumber>\n");
        xml.append("    <Name>").append(esc(invoice.getCompany().getLegalName())).append("</Name>\n");
        xml.append("    <Address>").append(esc(invoice.getCompany().getAddress())).append("</Address>\n");
        xml.append("  </Supplier>\n");

        // Buyer
        xml.append("  <Buyer>\n");
        xml.append("    <DocumentType>").append(esc(invoice.getBuyer().getDocumentType().name())).append("</DocumentType>\n");
        xml.append("    <DocumentNumber>").append(esc(invoice.getBuyer().getDocumentNumber())).append("</DocumentNumber>\n");
        xml.append("    <Name>").append(esc(invoice.getBuyer().getFullName())).append("</Name>\n");
        xml.append("    <Email>").append(esc(invoice.getBuyer().getEmail())).append("</Email>\n");
        xml.append("  </Buyer>\n");

        // Items
        xml.append("  <InvoiceLines>\n");
        for (InvoiceItem item : invoice.getItems()) {
            java.math.BigDecimal itemTax = item.getSubtotal().multiply(item.getTaxRate()).setScale(2, java.math.RoundingMode.HALF_UP);
            java.math.BigDecimal itemTotal = item.getSubtotal().add(itemTax).setScale(2, java.math.RoundingMode.HALF_UP);

            xml.append("    <InvoiceLine>\n");
            xml.append("      <Description>").append(esc(item.getDescription())).append("</Description>\n");
            xml.append("      <Quantity>").append(item.getQuantity()).append("</Quantity>\n");
            xml.append("      <UnitPrice>").append(item.getUnitPrice()).append("</UnitPrice>\n");
            xml.append("      <TaxRate>").append(item.getTaxRate()).append("</TaxRate>\n");
            xml.append("      <TaxAmount>").append(itemTax).append("</TaxAmount>\n");
            xml.append("      <Subtotal>").append(item.getSubtotal()).append("</Subtotal>\n");
            xml.append("      <Total>").append(itemTotal).append("</Total>\n");
            xml.append("    </InvoiceLine>\n");
        }
        xml.append("  </InvoiceLines>\n");

        // Totals
        xml.append("  <LegalMonetaryTotal>\n");
        xml.append("    <Subtotal>").append(invoice.getSubtotal()).append("</Subtotal>\n");
        xml.append("    <TaxAmount>").append(invoice.getTaxTotal()).append("</TaxAmount>\n");
        xml.append("    <Total>").append(invoice.getTotal()).append("</Total>\n");
        xml.append("  </LegalMonetaryTotal>\n");

        xml.append("</Invoice>");

        log.debug("Generated XML for invoice {}", fullInvoiceNumber);
        return xml.toString();
    }

    private String esc(String value) {
        if (value == null) return "";
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
