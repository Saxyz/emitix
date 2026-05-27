import { api } from './client'
import type { CompanyResponse, CompanyRequest, ResolutionResponse, ResolutionRequest } from './types'

export const companyApi = {
  get: () =>
    api.get<CompanyResponse>('/api/company'),

  update: (body: CompanyRequest) =>
    api.put<CompanyResponse>('/api/company', body),

  // Resoluciones
  getResolutions: (companyId: string) =>
    api.get<ResolutionResponse[]>(`/api/company/resolutions?companyId=${companyId}`),

  createResolution: (body: ResolutionRequest, companyId: string) =>
    api.post<ResolutionResponse>(`/api/company/resolutions?companyId=${companyId}`, body),

  updateResolution: (id: string, body: ResolutionRequest) =>
    api.put<ResolutionResponse>(`/api/company/resolutions/${id}`, body),
}
