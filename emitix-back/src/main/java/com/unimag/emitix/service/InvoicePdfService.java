package com.unimag.emitix.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.*;
import com.unimag.emitix.entity.Invoice;
import com.unimag.emitix.entity.InvoiceItem;
import com.unimag.emitix.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.Color;
import com.lowagie.text.pdf.draw.LineSeparator;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
public class InvoicePdfService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Color PRIMARY_COLOR = new Color(30, 64, 175);
    private static final Color HEADER_BG = new Color(239, 246, 255);
    private static final Color TABLE_HEADER_BG = new Color(30, 64, 175);

    public byte[] generatePdf(Invoice invoice) {
        String fullInvoiceNumber = invoice.getPrefix() + "-" + invoice.getNumber();
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 54, 36);
            PdfWriter.getInstance(document, baos);
            document.open();

            addTitle(document, invoice);
            addCompanyAndBuyerInfo(document, invoice);
            addItemsTable(document, invoice);
            addTotals(document, invoice);
            addFooter(document, invoice);

            document.close();
            log.info("PDF generated for invoice {}", fullInvoiceNumber);
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error generating PDF for invoice {}: {}", fullInvoiceNumber, e.getMessage());
            throw new BusinessException("No se pudo generar el PDF de la factura: " + e.getMessage());
        }
    }

    private void addTitle(Document doc, Invoice invoice) throws DocumentException {
        String fullInvoiceNumber = invoice.getPrefix() + "-" + invoice.getNumber();
        Font titleFont = new Font(Font.HELVETICA, 20, Font.BOLD, PRIMARY_COLOR);
        Font subtitleFont = new Font(Font.HELVETICA, 10, Font.NORMAL, Color.DARK_GRAY);

        Paragraph title = new Paragraph("FACTURA ELECTRÓNICA", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(4);
        doc.add(title);

        Paragraph number = new Paragraph("N° " + fullInvoiceNumber, subtitleFont);
        number.setAlignment(Element.ALIGN_CENTER);
        number.setSpacingAfter(2);
        doc.add(number);

        Paragraph status = new Paragraph("Estado: " + invoice.getStatus().name(), subtitleFont);
        status.setAlignment(Element.ALIGN_CENTER);
        status.setSpacingAfter(16);
        doc.add(status);

        doc.add(new LineSeparator(1f, 100f, PRIMARY_COLOR, Element.ALIGN_CENTER, -1));
        doc.add(Chunk.NEWLINE);
    }

    private void addCompanyAndBuyerInfo(Document doc, Invoice invoice) throws DocumentException {
        PdfPTable infoTable = new PdfPTable(2);
        infoTable.setWidthPercentage(100);
        infoTable.setSpacingBefore(8);
        infoTable.setSpacingAfter(16);

        // Company cell
        PdfPCell companyCell = new PdfPCell();
        companyCell.setBorder(Rectangle.BOX);
        companyCell.setPadding(10);
        companyCell.setBackgroundColor(HEADER_BG);
        Font labelFont = new Font(Font.HELVETICA, 8, Font.BOLD, PRIMARY_COLOR);
        Font valueFont = new Font(Font.HELVETICA, 9, Font.NORMAL, Color.DARK_GRAY);
        companyCell.addElement(new Phrase("EMISOR", labelFont));
        companyCell.addElement(new Phrase(invoice.getCompany().getLegalName(), new Font(Font.HELVETICA, 10, Font.BOLD)));
        companyCell.addElement(new Phrase("Doc: " + invoice.getCompany().getDocumentNumber(), valueFont));
        if (invoice.getCompany().getAddress() != null)
            companyCell.addElement(new Phrase(invoice.getCompany().getAddress(), valueFont));

        // Buyer cell
        PdfPCell BuyerCell = new PdfPCell();
        BuyerCell.setBorder(Rectangle.BOX);
        BuyerCell.setPadding(10);
        BuyerCell.setBackgroundColor(HEADER_BG);
        BuyerCell.addElement(new Phrase("RECEPTOR", labelFont));
        BuyerCell.addElement(new Phrase(invoice.getBuyer().getFullName(), new Font(Font.HELVETICA, 10, Font.BOLD)));
        BuyerCell.addElement(new Phrase(invoice.getBuyer().getDocumentType() + ": " + invoice.getBuyer().getDocumentNumber(), valueFont));
        if (invoice.getBuyer().getEmail() != null)
            BuyerCell.addElement(new Phrase(invoice.getBuyer().getEmail(), valueFont));
        if (invoice.getBuyer().getAddress() != null)
            BuyerCell.addElement(new Phrase(invoice.getBuyer().getAddress(), valueFont));

        infoTable.addCell(companyCell);
        infoTable.addCell(BuyerCell);
        doc.add(infoTable);

        // Date
        Font dateFont = new Font(Font.HELVETICA, 9, Font.ITALIC, Color.GRAY);
        Paragraph datePara = new Paragraph("Fecha de emisión: " + invoice.getCreatedAt().format(DATE_FMT), dateFont);
        datePara.setSpacingAfter(12);
        doc.add(datePara);
    }

    private void addItemsTable(Document doc, Invoice invoice) throws DocumentException {
        Font headerFont = new Font(Font.HELVETICA, 9, Font.BOLD, Color.WHITE);
        Font cellFont = new Font(Font.HELVETICA, 9, Font.NORMAL, Color.DARK_GRAY);

        PdfPTable table = new PdfPTable(new float[]{4f, 1.2f, 1.5f, 1.2f, 1.3f, 1.5f});
        table.setWidthPercentage(100);
        table.setSpacingBefore(4);

        String[] headers = {"Descripción", "Cantidad", "Precio Unit.", "IVA %", "IVA $", "Total"};
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
            cell.setBackgroundColor(TABLE_HEADER_BG);
            cell.setPadding(6);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(cell);
        }

        for (InvoiceItem item : invoice.getItems()) {
            BigDecimal itemTax = item.getSubtotal().multiply(item.getTaxRate().divide(BigDecimal.valueOf(100), 4, java.math.RoundingMode.HALF_UP)).setScale(2, java.math.RoundingMode.HALF_UP);
            BigDecimal itemTotal = item.getSubtotal().add(itemTax).setScale(2, java.math.RoundingMode.HALF_UP);

            table.addCell(createCell(item.getDescription(), cellFont, Element.ALIGN_LEFT));
            table.addCell(createCell(item.getQuantity().toPlainString(), cellFont, Element.ALIGN_CENTER));
            table.addCell(createCell("$ " + formatAmount(item.getUnitPrice()), cellFont, Element.ALIGN_RIGHT));
            table.addCell(createCell(item.getTaxRate().stripTrailingZeros().toPlainString() + "%", cellFont, Element.ALIGN_CENTER));
            table.addCell(createCell("$ " + formatAmount(itemTax), cellFont, Element.ALIGN_RIGHT));
            table.addCell(createCell("$ " + formatAmount(itemTotal), cellFont, Element.ALIGN_RIGHT));
        }

        doc.add(table);
    }

    private void addTotals(Document doc, Invoice invoice) throws DocumentException {
        Font labelFont = new Font(Font.HELVETICA, 10, Font.BOLD, Color.DARK_GRAY);
        Font totalFont = new Font(Font.HELVETICA, 12, Font.BOLD, PRIMARY_COLOR);

        PdfPTable totalsTable = new PdfPTable(2);
        totalsTable.setWidthPercentage(50);
        totalsTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totalsTable.setSpacingBefore(12);

        addTotalRow(totalsTable, "Subtotal:", "$ " + formatAmount(invoice.getSubtotal()), labelFont, labelFont, false);
        addTotalRow(totalsTable, "IVA:", "$ " + formatAmount(invoice.getTaxTotal()), labelFont, labelFont, false);
        addTotalRow(totalsTable, "TOTAL:", "$ " + formatAmount(invoice.getTotal()), totalFont, totalFont, true);

        doc.add(totalsTable);
    }

    private void addTotalRow(PdfPTable table, String label, String value,
                             Font labelFont, Font valueFont, boolean highlight) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPadding(4);
        if (highlight) labelCell.setBackgroundColor(HEADER_BG);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, valueFont));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPadding(4);
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        if (highlight) valueCell.setBackgroundColor(HEADER_BG);

        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private void addFooter(Document doc, Invoice invoice) throws DocumentException {
        if (invoice.getNotes() != null && !invoice.getNotes().isBlank()) {
            doc.add(Chunk.NEWLINE);
            Font notesLabelFont = new Font(Font.HELVETICA, 9, Font.BOLD, Color.DARK_GRAY);
            Font notesValueFont = new Font(Font.HELVETICA, 9, Font.NORMAL, Color.DARK_GRAY);
            Paragraph notesLabel = new Paragraph("Observaciones:", notesLabelFont);
            notesLabel.setSpacingBefore(8);
            doc.add(notesLabel);
            Paragraph notesText = new Paragraph(invoice.getNotes(), notesValueFont);
            notesText.setSpacingBefore(2);
            notesText.setSpacingAfter(8);
            doc.add(notesText);
        }

        doc.add(Chunk.NEWLINE);
        doc.add(new LineSeparator(0.5f, 100f, Color.LIGHT_GRAY, Element.ALIGN_CENTER, -1));
        Font footerFont = new Font(Font.HELVETICA, 8, Font.ITALIC, Color.GRAY);
        Paragraph footer = new Paragraph(
                "Documento generado por Emitix — Sistema de Facturación Electrónica\n" +
                "Este documento es una simulación para entornos de desarrollo.", footerFont);
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.setSpacingBefore(6);
        doc.add(footer);
    }

    private PdfPCell createCell(String content, Font font, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(content, font));
        cell.setPadding(5);
        cell.setHorizontalAlignment(alignment);
        return cell;
    }

    private String formatAmount(BigDecimal amount) {
        if (amount == null) return "0.00";
        return String.format("%,.2f", amount);
    }
}
