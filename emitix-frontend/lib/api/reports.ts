import { api } from './client'
import type {
  ReportSummaryResponse,
  ReportInvoiceRow,
  InvoiceStatus,
  InvoiceType,
  PageResponse,
} from './types'

export const reportsApi = {
  summary: (from: string, to: string) =>
    api.get<ReportSummaryResponse>(`/api/reports/summary?from=${from}&to=${to}`),

  invoices: (params?: {
    from?: string
    to?: string
    status?: InvoiceStatus
    invoiceType?: InvoiceType
    page?: number
    size?: number
  }) => {
    const qs = new URLSearchParams()
    if (params?.from) qs.set('from', params.from)
    if (params?.to) qs.set('to', params.to)
    if (params?.status) qs.set('status', params.status)
    if (params?.invoiceType) qs.set('invoiceType', params.invoiceType)
    if (params?.page !== undefined) qs.set('page', String(params.page))
    if (params?.size !== undefined) qs.set('size', String(params.size))
    return api.get<PageResponse<ReportInvoiceRow>>(`/api/reports/invoices?${qs}`)
  },
}
