"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { authApi } from '@/lib/api/auth'
import { getToken, setToken, removeToken, apiFetch } from '@/lib/api/client'
import type { MeResponse, LoginRequest, Role } from '@/lib/api/types'

// ────────────────────────────────────────────────────────────────────────────
// Tipos del contexto
// ────────────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** Datos del usuario autenticado. null mientras carga o si no hay sesión. */
  user: MeResponse | null
  /** true durante la hidratación inicial (llamada a /me) */
  isLoading: boolean
  /** true si hay un usuario autenticado */
  isAuthenticated: boolean
  /** Inicia sesión y almacena el token */
  login: (credentials: LoginRequest) => Promise<void>
  /** Cierra sesión (invalida el token en backend y limpia localStorage) */
  logout: () => Promise<void>
  /** Refresca los datos del usuario desde /api/auth/me */
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ────────────────────────────────────────────────────────────────────────────
// Provider
// ────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Hidratación: al montar, si hay token válido cargamos el usuario
  const refresh = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }
    try {
      const me = await authApi.me()
      setUser(me)
    } catch {
      // Token inválido o expirado: limpiar
      removeToken()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(async (credentials: LoginRequest) => {
    const response = await authApi.login(credentials)
    setToken(response.token)
    // Cookie ligera para que el middleware de Next.js pueda verificar la sesión
    document.cookie = 'emitix_session=1; path=/; SameSite=Lax'
    // Cargamos los datos completos del usuario vía /me
    const me = await authApi.me()
    setUser(me)
  }, [])

  const logout = useCallback(async () => {
    const currentToken = getToken()
    // Limpiar estado local PRIMERO para evitar requests con token ya blacklisteado
    removeToken()
    document.cookie = 'emitix_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    setUser(null)
    // Invalidar en backend con el token capturado (best-effort)
    if (currentToken) {
      try {
        await apiFetch<void>('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${currentToken}` },
        })
      } catch {
        // Ignorar — sesión local ya cerrada
      }
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Hook interno (uso interno; usa useAuth para consumir)
// ────────────────────────────────────────────────────────────────────────────

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext debe usarse dentro de <AuthProvider>')
  }
  return ctx
}

// ── Helper de roles ───────────────────────────────────────────────────────────

/** Jerarquía de roles: cuanto mayor el índice, más privilegios */
const ROLE_RANK: Record<Role, number> = {
  VIEWER: 0,
  ACCOUNTANT: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
}

export function hasRole(userRole: Role, required: Role): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[required]
}
