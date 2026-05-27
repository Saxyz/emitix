package com.unimag.emitix.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.unimag.emitix.dto.CreateInvoiceRequest;
import com.unimag.emitix.dto.InvoiceItemRequest;
import com.unimag.emitix.entity.*;
import com.unimag.emitix.entity.enums.DocumentType;
import com.unimag.emitix.entity.enums.InvoiceStatus;
import com.unimag.emitix.entity.enums.OrganizationType;
import com.unimag.emitix.repository.CompanyRepository;
import com.unimag.emitix.repository.BuyerRepository;
import com.unimag.emitix.repository.InvoiceRepository;
import com.unimag.emitix.repository.UserRepository;
import com.unimag.emitix.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;


import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class InvoiceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BuyerRepository buyerRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private String jwtToken;
    private Buyer testCustomer;
    private Company testCompany;

    @BeforeEach
    void setUp() {
        invoiceRepository.deleteAll();
        buyerRepository.deleteAll();
        companyRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Save User and generate JWT
        User user = User.builder()
                .username("admin")
                .password(passwordEncoder.encode("admin123"))
                .email("admin@emitix.com")
                .fullName("Admin Test")
                .role(com.unimag.emitix.entity.enums.Role.ADMIN)
                .isActive(true)
                .build();
        User savedUser = userRepository.save(user);
        jwtToken = "Bearer " + jwtTokenProvider.generateToken(savedUser);

        // 2. Save Company
        Company company = Company.builder()
                .documentNumber("900.123.456-7")
                .legalName("Emitix S.A.S")
                .address("Calle 1 # 2 - 3")
                .build();
        testCompany = companyRepository.save(company);

        // 3. Save Buyer
        Buyer customer = Buyer.builder()
                .documentType(DocumentType.CC)
                .documentNumber("1012345678")
                .organizationType(OrganizationType.NATURAL)
                .fullName("Juan Perez")
                .email("juan@gmail.com")
                .address("Calle Falsa 123")
                .company(testCompany)
                .build();
        testCustomer = buyerRepository.save(customer);
    }

    @Test
    void getInvoices_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/invoices"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getInvoices_Authorized() throws Exception {
        mockMvc.perform(get("/api/invoices")
                        .header("Authorization", jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)));
    }

    @Test
    void createInvoice_Successful() throws Exception {
        InvoiceItemRequest itemRequest = new InvoiceItemRequest("Celular Samsung", BigDecimal.ONE, new BigDecimal("1500000.00"), new BigDecimal("19.00"), null, "UND", null, null, null);
        CreateInvoiceRequest request = new CreateInvoiceRequest(testCustomer.getId(), null, null, null, "Test notes", List.of(itemRequest));

        mockMvc.perform(post("/api/invoices")
                        .header("Authorization", jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.number", notNullValue()))
                .andExpect(jsonPath("$.prefix", notNullValue()))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.buyer.fullName").value("Juan Perez"))
                .andExpect(jsonPath("$.company.legalName").value("Emitix S.A.S"))
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].description").value("Celular Samsung"));
    }

    @Test
    void confirmInvoice_Successful() throws Exception {
        // Create draft invoice
        Invoice invoice = Invoice.builder()
                .prefix("DRAFT")
                .number("123456")
                .buyer(testCustomer)
                .company(testCompany)
                .status(InvoiceStatus.DRAFT)
                .createdBy(userRepository.findByUsername("admin").orElse(null))
                .build();
        invoice.setCreatedAt(java.time.LocalDateTime.now());
        InvoiceItem item = InvoiceItem.builder()
                .description("Laptop Asus")
                .quantity(BigDecimal.ONE)
                .unitPrice(new BigDecimal("3000000.00"))
                .taxRate(new BigDecimal("19.00"))
                .unit("UND")
                .discountPct(BigDecimal.ZERO)
                .taxType("IVA")
                .subtotal(new BigDecimal("3000000.00"))
                .build();
        invoice.addItem(item);
        Invoice savedInvoice = invoiceRepository.save(invoice);

        // Confirm
        mockMvc.perform(post("/api/invoices/" + savedInvoice.getId() + "/confirm")
                        .header("Authorization", jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.prefix").value("FE"))
                .andExpect(jsonPath("$.number").value("0001"))
                .andExpect(jsonPath("$.subtotal").value(3000000.00))
                .andExpect(jsonPath("$.taxTotal").value(570000.00))
                .andExpect(jsonPath("$.total").value(3570000.00));
    }

    @Test
    void downloadPdf_Successful() throws Exception {
        // Create draft/confirmed invoice
        Invoice invoice = Invoice.builder()
                .prefix("FE")
                .number("0001")
                .buyer(testCustomer)
                .company(testCompany)
                .status(InvoiceStatus.ACCEPTED)
                .createdBy(userRepository.findByUsername("admin").orElse(null))
                .build();
        invoice.setCreatedAt(java.time.LocalDateTime.now());
        InvoiceItem item = InvoiceItem.builder()
                .description("Laptop Asus")
                .quantity(BigDecimal.ONE)
                .unitPrice(new BigDecimal("3000000.00"))
                .taxRate(new BigDecimal("19.00"))
                .unit("UND")
                .discountPct(BigDecimal.ZERO)
                .taxType("IVA")
                .subtotal(new BigDecimal("3000000.00"))
                .build();
        invoice.addItem(item);
        Invoice savedInvoice = invoiceRepository.save(invoice);

        mockMvc.perform(get("/api/invoices/" + savedInvoice.getId() + "/pdf")
                        .header("Authorization", jwtToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"factura-FE-0001.pdf\""));
    }
}
