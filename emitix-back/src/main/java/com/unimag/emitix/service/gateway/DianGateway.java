package com.unimag.emitix.service.gateway;

/**
 * Gateway interface for DIAN (Dirección de Impuestos y Aduanas Nacionales) integration.
 * This interface decouples the invoice processing from the actual DIAN communication,
 * allowing for easy replacement of the mock implementation with a real one.
 */
public interface DianGateway {

    /**
     * Sends an invoice XML to the DIAN for validation and approval.
     *
     * @param xmlContent The XML representation of the invoice
     * @param invoiceNumber The invoice number for tracking purposes
     * @return A DianResponse containing the result of the operation
     */
    DianResponse sendInvoice(String xmlContent, String invoiceNumber);
}
