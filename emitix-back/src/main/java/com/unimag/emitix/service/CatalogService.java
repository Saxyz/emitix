package com.unimag.emitix.service;

import com.unimag.emitix.entity.enums.DocumentType;
import com.unimag.emitix.entity.enums.FiscalRegime;
import com.unimag.emitix.entity.enums.OrganizationType;
import com.unimag.emitix.entity.enums.PaymentMethod;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Datos estáticos (catálogos) derivados del DDL v3.2.
 * No tienen tabla propia — se validan en backend / DIAN.
 */
@Service
public class CatalogService {

    public List<Map<String, String>> documentTypes() {
        return Arrays.stream(DocumentType.values())
                .map(d -> Map.of("code", d.name(), "label", documentTypeLabel(d)))
                .toList();
    }

    public List<Map<String, String>> organizationTypes() {
        return Arrays.stream(OrganizationType.values())
                .map(o -> Map.of("code", o.name(), "label", organizationTypeLabel(o)))
                .toList();
    }

    public List<Map<String, String>> fiscalRegimes() {
        return Arrays.stream(FiscalRegime.values())
                .map(f -> Map.of("code", f.name(), "label", fiscalRegimeLabel(f)))
                .toList();
    }

    public List<Map<String, String>> paymentMethods() {
        return Arrays.stream(PaymentMethod.values())
                .map(p -> Map.of("code", p.name(), "label", paymentMethodLabel(p)))
                .toList();
    }

    public List<Map<String, String>> taxTypes() {
        return List.of(
                Map.of("code", "IVA",  "label", "Impuesto al Valor Agregado"),
                Map.of("code", "INC",  "label", "Impuesto Nacional al Consumo"),
                Map.of("code", "RETE", "label", "Retención en la Fuente"),
                Map.of("code", "EXENTO", "label", "Exento de IVA")
        );
    }

    public List<Map<String, String>> measurementUnits() {
        return List.of(
                Map.of("code", "UND",  "label", "Unidad"),
                Map.of("code", "HRA",  "label", "Hora"),
                Map.of("code", "KGM",  "label", "Kilogramo"),
                Map.of("code", "LTR",  "label", "Litro"),
                Map.of("code", "MTR",  "label", "Metro"),
                Map.of("code", "MTK",  "label", "Metro cuadrado"),
                Map.of("code", "MTQ",  "label", "Metro cúbico"),
                Map.of("code", "GRM",  "label", "Gramo"),
                Map.of("code", "TNE",  "label", "Tonelada"),
                Map.of("code", "DAY",  "label", "Día")
        );
    }

    // ── labels ───────────────────────────────────────────────────────────────

    private String documentTypeLabel(DocumentType d) {
        return switch (d) {
            case NIT -> "NIT";
            case CC  -> "Cédula de Ciudadanía";
            case CE  -> "Cédula de Extranjería";
            case PA  -> "Pasaporte";
            case TI  -> "Tarjeta de Identidad";
            case RC  -> "Registro Civil";
        };
    }

    private String organizationTypeLabel(OrganizationType o) {
        return switch (o) {
            case JURIDICA -> "Persona Jurídica";
            case NATURAL  -> "Persona Natural";
        };
    }

    private String fiscalRegimeLabel(FiscalRegime f) {
        return switch (f) {
            case RES  -> "Responsable de IVA";
            case NRES -> "No Responsable de IVA";
        };
    }

    private String paymentMethodLabel(PaymentMethod p) {
        return switch (p) {
            case CASH     -> "Efectivo";
            case TRANSFER -> "Transferencia Bancaria";
            case CARD     -> "Tarjeta";
            case CREDIT   -> "Crédito";
        };
    }
}
