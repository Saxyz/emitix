package com.unimag.emitix.service;

import com.unimag.emitix.dto.CreateInvoiceRequest;
import com.unimag.emitix.dto.InvoiceResponse;
import com.unimag.emitix.dto.PageResponse;
import com.unimag.emitix.dto.UpdateInvoiceRequest;
import com.unimag.emitix.entity.*;
import com.unimag.emitix.entity.enums.InvoiceStatus;
import com.unimag.emitix.entity.enums.PaymentMethod;
import com.unimag.emitix.exception.BusinessException;
import com.unimag.emitix.exception.InvalidInvoiceStateException;
import com.unimag.emitix.exception.ResourceNotFoundException;
import com.unimag.emitix.mapper.InvoiceMapper;
import com.unimag.emitix.repository.CompanyRepository;
import com.unimag.emitix.repository.BuyerRepository;
import com.unimag.emitix.repository.InvoiceRepository;
import com.unimag.emitix.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final BuyerRepository buyerRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final InvoiceMapper invoiceMapper;

    @Transactional(readOnly = true)
    public PageResponse<InvoiceResponse> findAll(InvoiceStatus status, String buyerName,
                                                 String invoiceNumber, Pageable pageable) {
        String buyerNameParam = (buyerName != null && !buyerName.isBlank()) ? "%" + buyerName.toLowerCase() + "%" : null;
        String invoiceNumberParam = (invoiceNumber != null && !invoiceNumber.isBlank()) ? "%" + invoiceNumber + "%" : null;
        Page<Invoice> page = invoiceRepository.findByFilters(status, buyerNameParam, invoiceNumberParam, pageable);
        return PageResponse.of(page.map(invoiceMapper::toResponse));
    }

    @Transactional(readOnly = true)
    public InvoiceResponse findById(UUID id) {
        Invoice invoice = getInvoiceOrThrow(id);
        return invoiceMapper.toResponse(invoice);
    }

    @Transactional
    public InvoiceResponse create(CreateInvoiceRequest request, String createdBy) {
        Buyer buyer = buyerRepository.findById(request.buyerId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", request.buyerId()));

        User user = userRepository.findByUsername(createdBy)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "username", createdBy));

        Company company = user.getCompany();
        if (company == null) {
            throw new BusinessException("El usuario no tiene una empresa asignada para emitir facturas");
        }

        Invoice invoice = Invoice.builder()
                .prefix("DRAFT")
                .number(UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .buyer(buyer)
                .company(company)
                .status(InvoiceStatus.DRAFT)
                .createdBy(user)
                .build();

        List<InvoiceItem> items = buildItems(request.items());
        items.forEach(invoice::addItem);

        Invoice saved = invoiceRepository.save(invoice);
        log.info("Invoice created: {} by {}", saved.getId(), createdBy);
        return invoiceMapper.toResponse(saved);
    }

    @Transactional
    public InvoiceResponse update(UUID id, UpdateInvoiceRequest request) {
        Invoice invoice = getInvoiceOrThrow(id);

        if (invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw new InvalidInvoiceStateException(invoice.getStatus().name(), "editar");
        }

        Buyer buyer = buyerRepository.findById(request.buyerId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", request.buyerId()));

        invoice.setBuyer(buyer);
        if (request.paymentMethod() != null) {
            invoice.setPaymentMethod(PaymentMethod.valueOf(request.paymentMethod()));
        }
        invoice.setDueDate(request.dueDate());
        invoice.setNotes(request.notes());

        // Reemplazar ítems
        invoice.getItems().clear();
        buildItems(request.items()).forEach(invoice::addItem);

        Invoice saved = invoiceRepository.save(invoice);
        log.info("Invoice {} updated", saved.getId());
        return invoiceMapper.toResponse(saved);
    }

    @Transactional
    public InvoiceResponse cancel(UUID id) {
        Invoice invoice = getInvoiceOrThrow(id);

        if (invoice.getStatus() != InvoiceStatus.ACCEPTED) {
            throw new InvalidInvoiceStateException(invoice.getStatus().name(), "cancelar");
        }

        invoice.setStatus(InvoiceStatus.CANCELLED);
        Invoice saved = invoiceRepository.save(invoice);
        log.info("Invoice {} cancelled", saved.getId());
        return invoiceMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Invoice getInvoiceOrThrow(UUID id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Factura", "id", id));
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private List<InvoiceItem> buildItems(
            List<com.unimag.emitix.dto.InvoiceItemRequest> itemReqs) {
        return itemReqs.stream().map(itemReq -> {
            BigDecimal qty      = itemReq.quantity();
            BigDecimal price    = itemReq.unitPrice();
            BigDecimal subtotal = qty.multiply(price).setScale(2, RoundingMode.HALF_UP);
            // taxRate stored as percentage (19.00 = 19%), matching DDL DECIMAL(5,2)
            BigDecimal taxRate  = itemReq.taxRate() != null ? itemReq.taxRate() : BigDecimal.valueOf(19.00);

            return InvoiceItem.builder()
                    .description(itemReq.description())
                    .quantity(qty)
                    .unitPrice(price)
                    .taxRate(taxRate)
                    .unit(itemReq.unit() != null ? itemReq.unit() : "UND")
                    .discountPct(itemReq.discountPct() != null ? itemReq.discountPct() : BigDecimal.ZERO)
                    .taxType(itemReq.taxType() != null ? itemReq.taxType() : "IVA")
                    .unspscCode(itemReq.unspscCode())
                    .subtotal(subtotal)
                    .build();
        }).toList();
    }
}
