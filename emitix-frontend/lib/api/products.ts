import { api, getToken } from './client'
import type { ProductResponse, ProductRequest, PageResponse, CsvImportResult } from './types'

export type { CsvImportResult }

export const productsApi = {
  getAll: (params: { companyId: string; search?: string; page?: number; size?: number; includeInactive?: boolean }) => {
    const qs = new URLSearchParams({ companyId: params.companyId })
    if (params.search) qs.set('search', params.search)
    if (params.page !== undefined) qs.set('page', String(params.page))
    if (params.size !== undefined) qs.set('size', String(params.size))
    if (params.includeInactive) qs.set('includeInactive', 'true')
    return api.get<PageResponse<ProductResponse>>(`/api/products?${qs}`)
  },

  getById: (id: string) =>
    api.get<ProductResponse>(`/api/products/${id}`),

  create: (body: ProductRequest, companyId: string) =>
    api.post<ProductResponse>(`/api/products?companyId=${companyId}`, body),

  update: (id: string, body: ProductRequest) =>
    api.put<ProductResponse>(`/api/products/${id}`, body),

  delete: (id: string) =>
    api.delete<void>(`/api/products/${id}`),

  importCsv: (file: File, companyId: string): Promise<CsvImportResult> => {
    const formData = new FormData()
    formData.append('file', file)
    const token = getToken()
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
    return fetch(`${BASE_URL}/api/products/import-csv?companyId=${companyId}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(r => r.json())
  },
}
