package com.unimag.emitix.service;

import com.unimag.emitix.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceNumberService {

    private final InvoiceRepository invoiceRepository;

    @Value("${app.invoice.prefix:FE-}")
    private String prefix;

    /**
     * Generates the next invoice number using the DB sequence.
     * Format: FE-0001, FE-0002, ... FE-9999, FE-10000
     */
    public String generateNextNumber() {
        Long seq = invoiceRepository.getNextSequenceValue();
        String number = prefix + String.format("%04d", seq);
        log.info("Generated invoice number: {}", number);
        return number;
    }
}
