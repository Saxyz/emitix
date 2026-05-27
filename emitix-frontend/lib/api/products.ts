import { api } from './client'
import type { ProductResponse, ProductRequest, PageResponse } from './types'

export const productsApi = {
  getAll: (params: { companyId: string; search?: string; page?: number; size?: number }) => {
    const qs = new URLSearchParams({ companyId: params.companyId })
    if (params.search) qs.set('search', params.search)
    if (params.page !== undefined) qs.set('page', String(params.page))
    if (params.size !== undefined) qs.set('size', String(params.size))
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
}
