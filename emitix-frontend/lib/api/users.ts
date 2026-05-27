import { api } from './client'
import type { UserResponse, UserRequest, UpdateUserRequest, PageResponse } from './types'

export const usersApi = {
  getAll: (params?: { companyId?: string; page?: number; size?: number }) => {
    const qs = new URLSearchParams()
    if (params?.companyId) qs.set('companyId', params.companyId)
    if (params?.page !== undefined) qs.set('page', String(params.page))
    if (params?.size !== undefined) qs.set('size', String(params.size))
    return api.get<PageResponse<UserResponse>>(`/api/users?${qs}`)
  },

  getById: (id: string) =>
    api.get<UserResponse>(`/api/users/${id}`),

  create: (body: UserRequest, companyId?: string) => {
    const qs = companyId ? `?companyId=${companyId}` : ''
    return api.post<UserResponse>(`/api/users${qs}`, body)
  },

  update: (id: string, body: UpdateUserRequest) =>
    api.put<UserResponse>(`/api/users/${id}`, body),

  delete: (id: string) =>
    api.delete<void>(`/api/users/${id}`),
}
