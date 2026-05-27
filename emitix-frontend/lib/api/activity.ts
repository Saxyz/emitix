import { api } from './client'
import type { ActivityResponse, PageResponse } from './types'

export const activityApi = {
  getAll: (params?: {
    username?: string
    action?: string
    entity?: string
    from?: string
    to?: string
    page?: number
    size?: number
  }) => {
    const qs = new URLSearchParams()
    if (params?.username) qs.set('username', params.username)
    if (params?.action) qs.set('action', params.action)
    if (params?.entity) qs.set('entity', params.entity)
    if (params?.from) qs.set('from', params.from)
    if (params?.to) qs.set('to', params.to)
    if (params?.page !== undefined) qs.set('page', String(params.page))
    if (params?.size !== undefined) qs.set('size', String(params.size))
    return api.get<PageResponse<ActivityResponse>>(`/api/activity?${qs}`)
  },
}
