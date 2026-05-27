import { api } from './client'
import type { CatalogItem } from './types'

export const catalogsApi = {
  documentTypes: () =>
    api.get<CatalogItem[]>('/api/catalogs/document-types', { public: true }),

  organizationTypes: () =>
    api.get<CatalogItem[]>('/api/catalogs/organization-types', { public: true }),

  fiscalRegimes: () =>
    api.get<CatalogItem[]>('/api/catalogs/fiscal-regimes', { public: true }),

  paymentMethods: () =>
    api.get<CatalogItem[]>('/api/catalogs/payment-methods', { public: true }),

  taxTypes: () =>
    api.get<CatalogItem[]>('/api/catalogs/tax-types', { public: true }),

  measurementUnits: () =>
    api.get<CatalogItem[]>('/api/catalogs/measurement-units', { public: true }),
}
