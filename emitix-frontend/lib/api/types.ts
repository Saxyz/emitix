// ────────────────────────────────────────────────────────────────────────────
// Tipos alineados con los DTOs del backend (Spring Boot)
// Fuente de verdad: emitix-back/src/main/java/com/unimag/emitix/dto/
// ────────────────────────────────────────────────────────────────────────────

// ── Paginación ────────────────────────────────────────────────────────────────

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  username: string
  fullName: string
  role: Role
  companyId: string | null
}

export interface MeResponse {
  id: string
  companyId: string | null
  username: string
  email: string
  fullName: string
  phone: string | null
  role: Role
  isActive: boolean
}

export interface RegisterRequest {
  username: string
  password: string
  email: string
  fullName: string
  companyDocumentNumber: string
  companyLegalName: string
  organizationType?: 'JURIDICA' | 'NATURAL'
  documentType?: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  email: string
  otp: string
  newPassword: string
}

// ── Roles ─────────────────────────────────────────────────────────────────────

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'ACCOUNTANT' | 'VIEWER'

// ── Company ───────────────────────────────────────────────────────────────────

export interface CompanyResponse {
  id: string
  documentNumber: string
  legalName: string
  address: string | null
  city: string | null
  department: string | null
  country: string
  phone: string | null
  email: string | null
  logoUrl: string | null
}

export interface CompanyRequest {
  documentNumber: string
  legalName: string
  address?: string
  city?: string
  department?: string
  country?: string
  phone?: string
  email?: string
  logoUrl?: string
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface UserResponse {
  id: string
  companyId: string | null
  username: string
  email: string
  fullName: string
  phone: string | null
  role: Role
  isActive: boolean
  createdAt: string
}

export interface UserRequest {
  username: string
  password: string
  email: string
  fullName: string
  phone?: string
  role: 'ADMIN' | 'ACCOUNTANT' | 'VIEWER'
}

export interface UpdateUserRequest {
  email?: string
  fullName?: string
  phone?: string
  role?: 'ADMIN' | 'ACCOUNTANT' | 'VIEWER'
  isActive?: boolean
}

// ── Buyers ────────────────────────────────────────────────────────────────────

export type DocumentType = 'NIT' | 'CC' | 'CE' | 'PA' | 'TI' | 'RC'
export type OrganizationType = 'JURIDICA' | 'NATURAL'
export type FiscalRegime = 'RES' | 'NRES'

export interface BuyerResponse {
  id: string
  companyId: string
  documentNumber: string
  documentType: DocumentType
  fullName: string
  organizationType: OrganizationType
  fiscalRegime: FiscalRegime
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  department: string | null
  postalCode: string | null
  country: string
  isActive: boolean
}

export interface BuyerRequest {
  documentNumber: string
  documentType: DocumentType
  fullName: string
  organizationType: OrganizationType
  fiscalRegime: FiscalRegime
  email?: string
  phone?: string
  address?: string
  city?: string
  department?: string
  postalCode?: string
  country?: string
}

// ── Products ──────────────────────────────────────────────────────────────────

export interface ProductResponse {
  id: string
  companyId: string
  internalCode: string
  description: string
  unspscCode: string | null
  unit: string
  unitPrice: number
  currency: string
  taxRate: number
  isService: boolean
  isActive: boolean
}

export interface ProductRequest {
  internalCode: string
  description: string
  unspscCode?: string
  unit: string
  unitPrice: number
  currency?: string
  taxRate?: number
  isService?: boolean
  isActive?: boolean
}

// ── Invoices ──────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'
export type InvoiceType = 'SALE' | 'CREDIT_NOTE' | 'DEBIT_NOTE'
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CARD' | 'CREDIT'

export interface InvoiceItemResponse {
  id: string
  lineNumber: number
  productId: string | null
  description: string
  unspscCode: string | null
  unit: string
  quantity: number
  unitPrice: number
  discountPct: number
  taxRate: number
  taxType: string
  subtotal: number
  taxTotal: number
}

export interface InvoiceItemRequest {
  productId?: string
  description: string
  unspscCode?: string
  unit: string
  quantity: number
  unitPrice: number
  discountPct?: number
  taxRate?: number
  taxType?: string
}

export interface InvoiceResponse {
  id: string
  prefix: string
  number: string
  invoiceType: InvoiceType
  status: InvoiceStatus
  currency: string
  paymentMethod: PaymentMethod | null
  dueDate: string | null
  notes: string | null
  subtotal: number
  taxTotal: number
  total: number
  cufe: string | null
  qrUrl: string | null
  buyerId: string
  buyerName: string
  buyerDocument: string
  createdBy: string
  createdAt: string
  issuedAt: string | null
  items: InvoiceItemResponse[]
}

export interface CreateInvoiceRequest {
  buyerId: string
  invoiceType?: InvoiceType
  paymentMethod?: PaymentMethod
  dueDate?: string
  notes?: string
  items: InvoiceItemRequest[]
}

export interface UpdateInvoiceRequest {
  buyerId?: string
  paymentMethod?: PaymentMethod
  dueDate?: string
  notes?: string
  items?: InvoiceItemRequest[]
}

// ── Reports ───────────────────────────────────────────────────────────────────

export interface ReportSummaryResponse {
  totalInvoices: number
  acceptedInvoices: number
  rejectedInvoices: number
  draftInvoices: number
  totalAmount: number
  totalTax: number
  acceptanceRate: number
}

export interface ReportInvoiceRow {
  id: string
  number: string
  status: string
  invoiceType: string
  buyerName: string
  subtotal: number
  taxTotal: number
  total: number
  createdAt: string
}

// ── Activity ──────────────────────────────────────────────────────────────────

export interface ActivityResponse {
  id: string
  username: string
  actorType: string
  action: string
  entity: string
  entityId: string
  entityRef: string | null
  description: string | null
  result: string
  errorDetail: string | null
  ipAddress: string | null
  createdAt: string
}

// ── Resolutions ───────────────────────────────────────────────────────────────

export interface ResolutionResponse {
  id: string
  companyId: string
  prefix: string
  resolutionNumber: string | null
  resolutionDate: string | null
  rangeFrom: number
  rangeTo: number
  currentNumber: number
  validFrom: string
  validUntil: string
  isActive: boolean
  createdAt: string
}

export interface ResolutionRequest {
  prefix: string
  resolutionNumber?: string
  resolutionDate?: string
  rangeFrom: number
  rangeTo: number
  validFrom: string
  validUntil: string
}

// ── Catalogs ──────────────────────────────────────────────────────────────────

export interface CatalogItem {
  code: string
  label: string
}

// ── Errores API ───────────────────────────────────────────────────────────────

export interface ApiError {
  status: number
  error: string
  message: string
  timestamp: string
}
