import { api } from './client'
import type {
  InvoiceResponse,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  InvoiceStatus,
  PageResponse,
} from './types'

export const invoicesApi = {
  getAll: (params?: {
    status?: InvoiceStatus
    buyerName?: string
    invoiceNumber?: string
    page?: number
    size?: number
  }) => {
    const qs = new URLSearchParams()
    if (params?.status) qs.set('status', params.status)
    if (params?.buyerName) qs.set('buyerName', params.buyerName)
    if (params?.invoiceNumber) qs.set('invoiceNumber', params.invoiceNumber)
    if (params?.page !== undefined) qs.set('page', String(params.page))
    if (params?.size !== undefined) qs.set('size', String(params.size))
    return api.get<PageResponse<InvoiceResponse>>(`/api/invoices?${qs}`)
  },

  getById: (id: string) =>
    api.get<InvoiceResponse>(`/api/invoices/${id}`),

  create: (body: CreateInvoiceRequest) =>
    api.post<InvoiceResponse>('/api/invoices', body),

  update: (id: string, body: UpdateInvoiceRequest) =>
    api.put<InvoiceResponse>(`/api/invoices/${id}`, body),

  confirm: (id: string) =>
    api.post<InvoiceResponse>(`/api/invoices/${id}/confirm`),

  cancel: (id: string) =>
    api.post<InvoiceResponse>(`/api/invoices/${id}/cancel`),

  downloadPdf: (id: string) =>
    api.get<Blob>(`/api/invoices/${id}/pdf`),

  downloadXml: (id: string) =>
    api.get<Blob>(`/api/invoices/${id}/xml`),
}
