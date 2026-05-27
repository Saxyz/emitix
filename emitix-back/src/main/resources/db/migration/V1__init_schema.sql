-- ============================================================
-- EMITIX — DDL v3.3 (MVP Ampliado — Multi-empresa)
-- ============================================================
-- Basado en DDL v3.2. Cambios aplicados:
--
-- CHANGELOG v3.2 → v3.3:
--   #10 companies: renombra nit → document_number (consistencia con buyers).
--       Agrega organization_type VARCHAR(10) y document_type VARCHAR(10).
--       organization_type: 'JURIDICA' | 'NATURAL' (persona jurídica o natural).
--       document_type: tipo de documento del emisor.
--         - JURIDICA → siempre NIT (campo informativo, puede ser NULL)
--         - NATURAL  → CC | CE | PA (obligatorio para personas naturales)
--       Ambos nullable para no romper registros existentes.
--       CHECK constraints alineados con los de buyers.
--
-- CHANGELOG v3.1 → v3.2:
--   #1  Arquitectura: cambia de single-tenant a MULTI-EMPRESA.
--       Todas las tablas de negocio (buyers, products, resolutions,
--       invoices) ya tenían company_id NOT NULL — listas para multi-tenant.
--
--   #2  Nuevo rol SUPER_ADMIN en user_role enum (admin de plataforma,
--       puede operar transversalmente sin pertenecer a una empresa).
--
--   #3  users.company_id sigue nullable PERO con CHECK que enforza
--       la semántica: SOLO SUPER_ADMIN puede tener company_id NULL.
--       Cualquier otro rol DEBE tener company_id asignado.
--
--   #4  activity_logs.entity y entity_id ahora NOT NULL.
--       entity con CHECK contra valores válidos.
--       Refuerza integridad del log de auditoría.
--
--   #5  Documentado criterio ENUM vs CHECK en encabezado.
--
--   #6  buyers.organization_type: se quita DEFAULT 'JURIDICA'
--       (forzar decisión explícita en el backend).
--
--   #7  buyers.fiscal_regime: agrega CHECK (RES, NRES).
--
--   #8  CHECK de formato en country (ISO 3166-1) y currency (ISO 4217)
--       en companies, buyers, invoices, products.
--
--   #9  CHECK de rango razonable en tax_rate (0-100%).
--
-- ============================================================
-- CRITERIO ENUM vs CHECK CONSTRAINT
-- ============================================================
-- Cuando un campo tiene un conjunto cerrado de valores, usamos:
--
--   ENUM nativo de PostgreSQL: para valores del "core del dominio"
--     que cambian muy raramente y donde queremos type-safety estricto
--     a nivel de tipo. Modificarlos requiere ALTER TYPE (migración).
--     → user_role, invoice_status, invoice_type
--
--   CHECK constraint sobre VARCHAR: para valores que pueden evolucionar
--     con cambios regulatorios o de negocio (DIAN agrega tipos,
--     se agrega un método de pago nuevo, etc.). Modificarlos es trivial:
--     DROP CONSTRAINT + ADD CONSTRAINT.
--     → document_type, organization_type, actor_type, result,
--       payment_method, fiscal_regime, entity
--
-- Ambos cumplen la misma función conceptual (restringir dominio de
-- valores). La diferencia es cuán fácil cambiar el universo válido.
-- ============================================================


-- =========================
-- ENUMS
-- =========================

-- SUPER_ADMIN: admin de plataforma (sin company_id). Puede ver/modificar
--              datos de cualquier empresa. Solo se crea manualmente al
--              desplegar el sistema, NO se permite vía /register.
-- ADMIN:       admin de empresa (con company_id). Configuración total
--              dentro de su empresa.
-- ACCOUNTANT:  operador contable de empresa.
-- VIEWER:      solo lectura dentro de empresa.
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'VIEWER');

CREATE TYPE invoice_status AS ENUM (
    'DRAFT',       -- BORRADOR
    'ISSUED',      -- EMITIDA (numerada, XML generado)
    'SENT',        -- ENVIADA a DIAN (mock)
    'ACCEPTED',    -- APROBADA por DIAN
    'REJECTED',    -- RECHAZADA por DIAN
    'CANCELLED'    -- ANULADA
);

CREATE TYPE invoice_type AS ENUM ('SALE', 'CREDIT_NOTE', 'DEBIT_NOTE');


-- =========================
-- EMPRESAS EMISORAS
-- =========================

CREATE TABLE companies (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    document_number   VARCHAR(20)  NOT NULL UNIQUE,   -- NIT para jurídica, nº doc para natural
    legal_name        VARCHAR(255) NOT NULL,
    organization_type VARCHAR(10),                    -- JURIDICA | NATURAL
    document_type     VARCHAR(10),                    -- NIT (jurídica) | CC | CE | PA (natural)
    address           VARCHAR(255),
    city              VARCHAR(100),
    department        VARCHAR(100),
    country           VARCHAR(2)   NOT NULL DEFAULT 'CO',
    phone             VARCHAR(30),
    email             VARCHAR(255),
    logo_url          TEXT,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_companies_country   CHECK (country ~ '^[A-Z]{2}$'),
    CONSTRAINT chk_companies_org_type  CHECK (organization_type IS NULL OR organization_type IN ('JURIDICA', 'NATURAL')),
    CONSTRAINT chk_companies_doc_type  CHECK (document_type IS NULL OR document_type IN ('NIT', 'CC', 'CE', 'PA', 'TI', 'RC'))
);


-- =========================
-- USUARIOS
-- =========================
-- Password vive en la misma tabla (Spring Security UserDetails).
-- Arquitectura multi-empresa:
--   • SUPER_ADMIN: company_id = NULL (admin de plataforma)
--   • ADMIN / ACCOUNTANT / VIEWER: company_id NOT NULL (pertenecen a una empresa)
-- El CHECK chk_users_super_admin enforza esta semántica a nivel DB.

CREATE TABLE users (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID         REFERENCES companies(id),
    username    VARCHAR(50)  NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,                    -- BCrypt hash
    email       VARCHAR(100) NOT NULL UNIQUE,
    full_name   VARCHAR(150) NOT NULL,
    phone       VARCHAR(20),
    role        user_role    NOT NULL DEFAULT 'ACCOUNTANT',
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_users_super_admin CHECK (
        (role = 'SUPER_ADMIN' AND company_id IS NULL)
        OR
        (role != 'SUPER_ADMIN' AND company_id IS NOT NULL)
    )
);

CREATE INDEX idx_users_company  ON users(company_id);
CREATE INDEX idx_users_username ON users(username);


-- =========================
-- RESOLUCIONES DE NUMERACIÓN DIAN
-- =========================

CREATE TABLE resolutions (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id        UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    resolution_number VARCHAR(50),           -- nullable en dev/mock; obligatorio en producción
    resolution_date   DATE,                  -- fecha expedición resolución DIAN
    prefix            VARCHAR(10) NOT NULL,
    range_from        BIGINT      NOT NULL,
    range_to          BIGINT      NOT NULL,
    current_number    BIGINT      NOT NULL DEFAULT 0,
    valid_from        DATE        NOT NULL,
    valid_until       DATE        NOT NULL,
    is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_res_range   CHECK (range_to >= range_from),
    CONSTRAINT chk_res_current CHECK (current_number >= 0)
);

CREATE INDEX idx_resolutions_company ON resolutions(company_id);


-- =========================
-- COMPRADORES (CLIENTES)
-- =========================
-- document_number puede ser NIT, CC, CE, PA, TI o RC (document_type lo
-- discrimina). organization_type sin DEFAULT: el backend debe decidir.

CREATE TABLE buyers (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id        UUID         NOT NULL REFERENCES companies(id),
    document_number   VARCHAR(20)  NOT NULL,                    -- número de documento
    document_type     VARCHAR(10)  NOT NULL,                    -- tipo de documento DIAN
    full_name         VARCHAR(255) NOT NULL,                    -- razón social o nombre completo
    organization_type VARCHAR(10)  NOT NULL,                    -- JURIDICA | NATURAL
    fiscal_regime     VARCHAR(10),                              -- RES (responsable IVA) | NRES
    email             VARCHAR(255),
    phone             VARCHAR(30),
    address           VARCHAR(300),
    city              VARCHAR(100),
    department        VARCHAR(100),
    postal_code       VARCHAR(10),
    country           VARCHAR(2)   NOT NULL DEFAULT 'CO',
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_buyer_per_company UNIQUE (company_id, document_number),
    CONSTRAINT chk_buyer_org_type   CHECK (organization_type IN ('JURIDICA', 'NATURAL')),
    CONSTRAINT chk_buyer_doc_type   CHECK (document_type IN ('NIT', 'CC', 'CE', 'PA', 'TI', 'RC')),
    CONSTRAINT chk_buyer_fiscal     CHECK (fiscal_regime IS NULL OR fiscal_regime IN ('RES', 'NRES')),
    CONSTRAINT chk_buyer_country    CHECK (country ~ '^[A-Z]{2}$')
);

CREATE INDEX idx_buyers_company  ON buyers(company_id);
CREATE INDEX idx_buyers_document ON buyers(company_id, document_number);


-- =========================
-- PRODUCTOS / SERVICIOS
-- =========================
-- Sin FK a unspsc_codes ni measurement_units (catálogos en CatalogService).
-- unspsc_code y unit son VARCHAR libres validados desde backend.

CREATE TABLE products (
    id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID           NOT NULL REFERENCES companies(id),
    internal_code   VARCHAR(100)   NOT NULL,
    description     VARCHAR(300)   NOT NULL,
    unspsc_code     VARCHAR(8),                            -- código UNSPSC (referencial, validado en backend)
    unit            VARCHAR(10)    NOT NULL DEFAULT 'UND', -- unidad de medida (validada en CatalogService)
    unit_price      DECIMAL(18,2)  NOT NULL,
    currency        VARCHAR(3)     NOT NULL DEFAULT 'COP',
    tax_rate        DECIMAL(5,2)   NOT NULL DEFAULT 19.00, -- tasa IVA principal
    is_iva_excluded BOOLEAN        NOT NULL DEFAULT FALSE,
    is_service      BOOLEAN        NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_product_code    UNIQUE (company_id, internal_code),
    CONSTRAINT chk_product_price  CHECK (unit_price >= 0),
    CONSTRAINT chk_product_currency CHECK (currency ~ '^[A-Z]{3}$'),
    CONSTRAINT chk_product_tax    CHECK (tax_rate BETWEEN 0 AND 100)
);

CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_products_code    ON products(internal_code);
CREATE INDEX idx_products_unspsc  ON products(unspsc_code);


-- =========================
-- FACTURAS
-- =========================
-- Simplificado vs v2: sin batch_id, operation_type FK, send_mode,
-- contingency_at, retry_count, download_token, discount_total.
-- payment_method con CHECK (sin FK a tabla catálogo).

CREATE TABLE invoices (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id       UUID           NOT NULL REFERENCES companies(id),
    buyer_id         UUID           NOT NULL REFERENCES buyers(id),
    resolution_id    UUID           REFERENCES resolutions(id),    -- nullable: DRAFT sin resolución asignada
    created_by       UUID           NOT NULL REFERENCES users(id),

    -- Numeración
    number           VARCHAR(20)    NOT NULL,
    prefix           VARCHAR(10)    NOT NULL,

    -- Tipo
    invoice_type     invoice_type   NOT NULL DEFAULT 'SALE',
    status           invoice_status NOT NULL DEFAULT 'DRAFT',

    -- Montos
    currency         VARCHAR(3)     NOT NULL DEFAULT 'COP',
    subtotal         DECIMAL(18,2)  NOT NULL DEFAULT 0,
    tax_total        DECIMAL(18,2)  NOT NULL DEFAULT 0,
    total            DECIMAL(18,2)  NOT NULL DEFAULT 0,

    -- Pago
    payment_method   VARCHAR(20),               -- método de pago (CASH | TRANSFER | CARD | CREDIT)
    due_date         DATE,                      -- fecha vencimiento si crédito

    -- DIAN / técnico
    cufe             VARCHAR(96),               -- CUFE SHA-384 hex (mock)
    qr_url           TEXT,                      -- URL QR
    pdf_url          TEXT,
    xml_url          TEXT,

    -- Observaciones
    notes            TEXT,

    -- Timestamps
    issued_at        TIMESTAMPTZ,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_invoice_number     UNIQUE (company_id, prefix, number),
    CONSTRAINT uq_cufe               UNIQUE (cufe),
    CONSTRAINT chk_invoice_currency  CHECK (currency ~ '^[A-Z]{3}$'),
    CONSTRAINT chk_payment_method    CHECK (
        payment_method IS NULL OR
        payment_method IN ('CASH', 'TRANSFER', 'CARD', 'CREDIT')
    )
);

CREATE INDEX idx_invoices_company   ON invoices(company_id);
CREATE INDEX idx_invoices_buyer     ON invoices(buyer_id);
CREATE INDEX idx_invoices_status    ON invoices(status);
CREATE INDEX idx_invoices_issued_at ON invoices(issued_at);
CREATE INDEX idx_invoices_cufe      ON invoices(cufe);


-- =========================
-- ÍTEMS DE FACTURA
-- =========================
-- product_id nullable: un ítem puede ingresarse a mano sin catálogo.
-- discount_pct: porcentaje de descuento (0-100), no monto.

CREATE TABLE invoice_items (
    id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id   UUID           NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id   UUID           REFERENCES products(id),
    line_number  INT            NOT NULL,
    description  VARCHAR(500)   NOT NULL,
    unspsc_code  VARCHAR(8),                       -- referencial si no hay product_id
    unit         VARCHAR(10)    NOT NULL,
    quantity     DECIMAL(12,4)  NOT NULL,
    unit_price   DECIMAL(18,2)  NOT NULL,
    discount_pct DECIMAL(5,2)   NOT NULL DEFAULT 0,  -- porcentaje de descuento (0-100)
    tax_type     VARCHAR(10),                        -- IVA, INC, RETE... (validado en backend)
    tax_rate     DECIMAL(5,2)   NOT NULL DEFAULT 0,
    tax_total    DECIMAL(18,2)  NOT NULL DEFAULT 0,
    subtotal     DECIMAL(18,2)  NOT NULL,
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_quantity     CHECK (quantity > 0),
    CONSTRAINT chk_unit_price   CHECK (unit_price >= 0),
    CONSTRAINT chk_discount_pct CHECK (discount_pct BETWEEN 0 AND 100),
    CONSTRAINT chk_item_tax     CHECK (tax_rate BETWEEN 0 AND 100)
);

CREATE INDEX idx_invoice_items_inv     ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product ON invoice_items(product_id);


-- =========================
-- LOG DE ACTIVIDAD (AUDITORÍA)
-- =========================
-- entity y entity_id NOT NULL: todo log debe referenciar una entidad
-- concreta (refuerza integridad y utilidad del índice).
-- entity_id es VARCHAR(36) y no UUID intencionalmente: permite registrar
-- referencias a entidades externas o futuras que no usen UUID.
-- metadata es JSONB para permitir queries nativos PostgreSQL
-- (ej: WHERE metadata->>'campo' = 'valor').

CREATE TABLE activity_logs (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         REFERENCES users(id) ON DELETE SET NULL,
    username     VARCHAR(50),                              -- copia para trazabilidad si user se elimina
    actor_type   VARCHAR(20)  NOT NULL DEFAULT 'USUARIO',
    action       VARCHAR(100) NOT NULL,                    -- ej: FACTURA_CREADA, LOGIN_EXITOSO, USUARIO_ELIMINADO
    description  TEXT,
    entity       VARCHAR(50)  NOT NULL,                    -- tipo de entidad afectada (CHECK abajo)
    entity_id    VARCHAR(36)  NOT NULL,                    -- PK de la entidad (UUID en string)
    entity_ref   VARCHAR(100),                             -- ref legible para UI: "FE-0001"
    result       VARCHAR(20)  NOT NULL DEFAULT 'EXITOSO',
    error_detail TEXT,
    ip_address   VARCHAR(45),
    user_agent   TEXT,
    metadata     JSONB,                                    -- datos extra consultables con operadores JSON
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_actor_type CHECK (actor_type IN ('USUARIO', 'SISTEMA')),
    CONSTRAINT chk_result     CHECK (result IN ('EXITOSO', 'FALLIDO', 'PARCIAL')),
    CONSTRAINT chk_entity     CHECK (entity IN (
        'FACTURA', 'COMPRADOR', 'PRODUCTO', 'USUARIO',
        'EMPRESA', 'RESOLUCION', 'AUTH'
    ))
);

CREATE INDEX idx_activity_logs_user       ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action     ON activity_logs(action);
CREATE INDEX idx_activity_logs_entity     ON activity_logs(entity, entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);


-- =========================
-- TOKENS DE RESET DE CONTRASEÑA
-- =========================
-- Sin FK a users.email intencionalmente: permite no revelar si
-- el email existe en el sistema (seguridad anti-enumeración).

CREATE TABLE password_reset_tokens (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(100) NOT NULL,
    otp_hash   VARCHAR(255) NOT NULL,       -- BCrypt del OTP de 6 dígitos
    expires_at TIMESTAMPTZ  NOT NULL,
    used       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prt_email      ON password_reset_tokens(user_email);
CREATE INDEX idx_prt_expires_at ON password_reset_tokens(expires_at);


-- ============================================================
-- DIAGRAMA DE RELACIONES (MVP Multi-empresa)
-- ============================================================
--
--  companies ──┬── 1:N ──→ users (company_id NULL solo si role=SUPER_ADMIN)
--              ├── 1:N ──→ resolutions (CASCADE)
--              ├── 1:N ──→ buyers
--              ├── 1:N ──→ products
--              └── 1:N ──→ invoices
--
--  users ────────── 1:N ──→ invoices (created_by)
--                   1:N ──→ activity_logs (user_id, SET NULL on delete)
--
--  resolutions ──── 1:N ──→ invoices (resolution_id, nullable en DRAFT)
--
--  buyers ───────── 1:N ──→ invoices (buyer_id)
--
--  products ─────── 1:N ──→ invoice_items (product_id, nullable)
--
--  invoices ─────── 1:N ──→ invoice_items (CASCADE delete)
--
--  password_reset_tokens: independiente (ref por email, sin FK)
--
-- ============================================================


-- ============================================================
-- SEED DATA
-- ============================================================

-- Empresa demo
INSERT INTO companies (id, document_number, legal_name, organization_type, document_type, address, city, department, country, phone, email)
VALUES (
    gen_random_uuid(),
    '900123456-7',
    'Empresa Demo S.A.S.',
    'JURIDICA',
    'NIT',
    'Calle 123 # 45-67',
    'Bogotá D.C.',
    'Cundinamarca',
    'CO',
    '+57 601 234 5678',
    'contacto@empresademo.com'
);

-- Super-admin de PLATAFORMA (company_id = NULL)
-- password = superadmin123 (BCrypt)
INSERT INTO users (id, company_id, username, password, email, full_name, phone, role, is_active)
VALUES (
    gen_random_uuid(),
    NULL,
    'SUPERADMIN',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'superadmin@emitix.com',
    'Super Administrador de Plataforma',
    '+57 300 000 0000',
    'SUPER_ADMIN',
    TRUE
);

-- Admin de la EMPRESA DEMO (con company_id)
-- password = admin123 (BCrypt)
INSERT INTO users (id, company_id, username, password, email, full_name, phone, role, is_active)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM companies WHERE document_number = '900123456-7'),
    'ADMIN_DEMO',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'admin@empresademo.com',
    'Administrador Empresa Demo',
    '+57 300 111 2222',
    'ADMIN',
    TRUE
);

-- Contador de empresa demo: password = operador123 (BCrypt)
INSERT INTO users (id, company_id, username, password, email, full_name, phone, role, is_active)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM companies WHERE document_number = '900123456-7'),
    'ACCOUNTANT_DEMO',
    '$2a$10$8K1p/a0dR1xqM8eeXLO1W.g8N2dU5mhHMWuHLV6a8O39EZGRqDhLe',
    'operador@empresademo.com',
    'Operador de Facturación',
    '+57 300 111 1111',
    'ACCOUNTANT',
    TRUE
);

-- Resolución de numeración demo
INSERT INTO resolutions (id, company_id, resolution_number, resolution_date, prefix,
                         range_from, range_to, current_number, valid_from, valid_until, is_active)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM companies WHERE document_number = '900123456-7'),
    '18764060073461',
    CURRENT_DATE,
    'FE-',
    1, 5000, 0,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '2 years',
    TRUE
);

-- Comprador demo (persona jurídica)
INSERT INTO buyers (id, company_id, document_number, document_type, full_name, organization_type, fiscal_regime, email, address, city, country)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM companies WHERE document_number = '900123456-7'),
    '800987654-3',
    'NIT',
    'Cliente Ejemplo Ltda.',
    'JURIDICA',
    'RES',
    'compras@clienteejemplo.com',
    'Carrera 10 # 20-30',
    'Medellín',
    'CO'
);

-- Comprador demo (persona natural)
INSERT INTO buyers (id, company_id, document_number, document_type, full_name, organization_type, fiscal_regime, email, address, city, country)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM companies WHERE document_number = '900123456-7'),
    '1234567890',
    'CC',
    'Juan Pérez García',
    'NATURAL',
    'NRES',
    'juan.perez@gmail.com',
    'Calle 50 # 30-15',
    'Bogotá D.C.',
    'CO'
);

-- Productos demo
INSERT INTO products (id, company_id, internal_code, description, unspsc_code, unit, unit_price, currency, tax_rate, is_service, is_active)
VALUES
    (gen_random_uuid(), (SELECT id FROM companies WHERE document_number = '900123456-7'), 'SERV-DEV-001', 'Desarrollo de software a medida',  '81112200', 'HRA', 500000.00,  'COP', 19.00, TRUE,  TRUE),
    (gen_random_uuid(), (SELECT id FROM companies WHERE document_number = '900123456-7'), 'SERV-CON-001', 'Consultoría tecnológica',          '81112100', 'HRA', 250000.00,  'COP', 19.00, TRUE,  TRUE),
    (gen_random_uuid(), (SELECT id FROM companies WHERE document_number = '900123456-7'), 'PROD-LIC-001', 'Licencia de software empresarial', '43230000', 'UND', 1200000.00, 'COP', 19.00, FALSE, TRUE);
