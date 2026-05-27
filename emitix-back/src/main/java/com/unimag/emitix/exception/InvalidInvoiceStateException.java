package com.unimag.emitix.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class InvalidInvoiceStateException extends RuntimeException {

    public InvalidInvoiceStateException(String currentStatus, String operation) {
        super(String.format("No se puede realizar la operación '%s' en una factura con estado '%s'",
                operation, currentStatus));
    }
}
