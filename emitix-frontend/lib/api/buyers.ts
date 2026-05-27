import { api } from './client'
import type { BuyerResponse, BuyerRequest, PageResponse } from './types'

export const buyersApi = {
  getAll: (params: { companyId: string; search?: string; page?: number; size?: number }) => {
    const qs = new URLSearchParams({ companyId: params.companyId })
    if (params.search) qs.set('search', params.search)
    if (params.page !== undefined) qs.set('page', String(params.page))
    if (params.size !== undefined) qs.set('size', String(params.size))
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
}
