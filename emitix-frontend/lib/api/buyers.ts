import { api, getToken } from './client'
import type { BuyerResponse, BuyerRequest, PageResponse, CsvImportResult } from './types'

export const buyersApi = {
  getAll: (params: { companyId: string; search?: string; page?: number; size?: number; activeOnly?: boolean }) => {
    const qs = new URLSearchParams({ companyId: params.companyId })
    if (params.search) qs.set('search', params.search)
    if (params.page !== undefined) qs.set('page', String(params.page))
    if (params.size !== undefined) qs.set('size', String(params.size))
    if (params.activeOnly) qs.set('activeOnly', 'true')
    return api.get<PageResponse<BuyerResponse>>(`/api/buyers?${qs}`)
  },

  getById: (id: string) =>
    api.get<BuyerResponse>(`/api/buyers/${id}`),

  verifyDocument: (companyId: string, documentNumber: string) =>
    api.get<BuyerResponse>(`/api/buyers/verify-document?companyId=${companyId}&documentNumber=${documentNumber}`),

  create: (body: BuyerRequest, companyId: string) =>
    api.post<BuyerResponse>(`/api/buyers?companyId=${companyId}`, body),

  update: (id: string, body: BuyerRequest) =>
    api.put<BuyerResponse>(`/api/buyers/${id}`, body),

  delete: (id: string) =>
    api.delete<void>(`/api/buyers/${id}`),

  importCsv: (file: File, companyId: string): Promise<CsvImportResult> => {
    const formData = new FormData()
    formData.append('file', file)
    const token = getToken()
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
    return fetch(`${BASE_URL}/api/buyers/import-csv?companyId=${companyId}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(r => r.json())
  },
}
