// ────────────────────────────────────────────────────────────────────────────
// Cliente HTTP base para todos los módulos de la API
// Gestiona: token JWT, errores, redirección en 401
// ────────────────────────────────────────────────────────────────────────────

import type { ApiError } from './types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

// ── Helpers de token (localStorage solo en el cliente) ────────────────────────

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('emitix_token')
}

export function setToken(token: string): void {
  localStorage.setItem('emitix_token', token)
}

export function removeToken(): void {
  localStorage.removeItem('emitix_token')
}

// ── Error tipado ──────────────────────────────────────────────────────────────

export class ApiException extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiError,
  ) {
    super(body.message ?? `HTTP ${status}`)
    this.name = 'ApiException'
  }
}

// ── Fetch central ─────────────────────────────────────────────────────────────

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  /** Si es true, no añade el header Authorization aunque haya token */
  public?: boolean
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, public: isPublic, ...rest } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string>),
  }

  const token = getToken()
  if (token && !isPublic) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // 401 → token expirado o inválido → limpiar y redirigir al login
  // Si la petición es pública (ej. login), no redirigir — dejar que el catch del caller muestre el error
  if (response.status === 401 && !isPublic) {
    removeToken()
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
    throw new ApiException(401, {
      status: 401,
      error: 'Unauthorized',
      message: 'Sesión expirada. Inicia sesión nuevamente.',
      timestamp: new Date().toISOString(),
    })
  }

  // Sin contenido (204)
  if (response.status === 204) {
    return undefined as T
  }

  let data: unknown
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    data = await response.json()
  } else if (
    contentType.includes('application/pdf') ||
    contentType.includes('application/xml') ||
    contentType.includes('text/xml')
  ) {
    data = await response.blob()
  } else {
    data = await response.text()
  }

  if (!response.ok) {
    throw new ApiException(response.status, data as ApiError)
  }

  return data as T
}

// ── Atajos semánticos ─────────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { method: 'GET', ...options }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { method: 'POST', body, ...options }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { method: 'PUT', body, ...options }),

  delete: <T>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { method: 'DELETE', ...options }),
}
