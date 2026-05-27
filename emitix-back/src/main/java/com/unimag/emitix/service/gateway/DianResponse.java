package com.unimag.emitix.service.gateway;

import java.time.LocalDateTime;

public record DianResponse(
        boolean success,
        String trackingId,
        String message,
        LocalDateTime timestamp
) {
    public static DianResponse success(String trackingId) {
        return new DianResponse(true, trackingId,
                "Factura aprobada por la DIAN exitosamente", LocalDateTime.now());
    }

    public static DianResponse failure(String message) {
        return new DianResponse(false, null, message, LocalDateTime.now());
    }
}
