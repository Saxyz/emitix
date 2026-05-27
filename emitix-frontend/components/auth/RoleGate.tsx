"use client"

import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/lib/api/types'

interface RoleGateProps {
  /** Rol mínimo requerido para ver el contenido */
  required: Role
  /** Contenido visible solo si el usuario tiene el rol */
  children: ReactNode
  /** Contenido alternativo si no tiene permiso (opcional) */
  fallback?: ReactNode
}

/**
 * Oculta children si el usuario no tiene el rol mínimo requerido.
 *
 * @example
 * <RoleGate required="ADMIN">
 *   <Button>Eliminar usuario</Button>
 * </RoleGate>
 */
export function RoleGate({ required, children, fallback = null }: RoleGateProps) {
  const { can, isLoading } = useAuth()

  if (isLoading) return null
  if (!can(required)) return <>{fallback}</>

  return <>{children}</>
}
