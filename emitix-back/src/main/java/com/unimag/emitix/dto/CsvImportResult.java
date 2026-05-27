package com.unimag.emitix.dto;

import java.util.List;

public record CsvImportResult(
        int imported,
        int skipped,
        List<String> errors
) {}
