package com.unimag.emitix.service.gateway;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Mock implementation of DianGateway for development and testing.
 * Simulates the DIAN API response with a configurable delay.
 * Replace with a real implementation for production use.
 */
@Slf4j
@Component
public class MockDianGateway implements DianGateway {

    private static final long SIMULATED_DELAY_MS = 500;

    @Override
    public DianResponse sendInvoice(String xmlContent, String invoiceNumber) {
        log.info("[DIAN MOCK] Sending invoice {} to DIAN...", invoiceNumber);

        simulateNetworkDelay();

        String trackingId = "DIAN-MOCK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        log.info("[DIAN MOCK] Invoice {} approved. Tracking ID: {}", invoiceNumber, trackingId);

        return DianResponse.success(trackingId);
    }

    private void simulateNetworkDelay() {
        try {
            Thread.sleep(SIMULATED_DELAY_MS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("[DIAN MOCK] Simulated delay interrupted");
        }
    }
}
