import { useAuthContext, hasRole } from '@/contexts/AuthContext'
import type { Role } from '@/lib/api/types'

/**
 * Hook principal para consumir el contexto de autenticación.
 *
 * @example
 * const { user, login, logout, isLoading, can } = useAuth()
 * if (can('ADMIN')) { ... }
 */
export function useAuth() {
  const ctx = useAuthContext()

  /**
   * Verifica si el usuario actual tiene al menos el rol indicado.
   * La jerarquía es: VIEWER < ACCOUNTANT < ADMIN < SUPER_ADMIN
   */
  const can = (required: Role): boolean => {
    if (!ctx.user) return false
    return hasRole(ctx.user.role, required)
  }

  return {
    ...ctx,
    can,
    companyId: ctx.user?.companyId ?? null,
    role: ctx.user?.role ?? null,
  }
}
