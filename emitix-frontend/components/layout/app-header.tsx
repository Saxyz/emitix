"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, LogOut, User, Settings, Shield, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { companyApi } from "@/lib/api/company"
import { notificationsApi, type NotificationItem } from "@/lib/api/notifications"
import type { CompanyResponse } from "@/lib/api/types"

interface AppHeaderProps {
  title?: string
  children?: React.ReactNode
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "Ahora"
  if (diffMin < 60) return `Hace ${diffMin} min`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `Hace ${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return "Ayer"
  return `Hace ${diffDays} días`
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrador',
  ACCOUNTANT: 'Contador',
  VIEWER: 'Visualizador',
}

export function AppHeader({ title, children }: AppHeaderProps) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [company, setCompany] = useState<CompanyResponse | null>(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationList, setNotificationList] = useState<NotificationItem[]>([])
  const unreadCount = notificationList.filter((n) => n.unread).length

  useEffect(() => {
    if (user?.companyId) {
      companyApi.get().then(setCompany).catch(() => {})
      notificationsApi.getRecent().then(setNotificationList).catch(() => {})
    }
  }, [user?.companyId])

  const initials = user?.fullName
    ? user.fullName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const markAsRead = (id: string) => {
    setNotificationList(prev =>
      prev.map(n => n.id === id ? { ...n, unread: false } : n)
    )
  }

  const markAllAsRead = () => {
    setNotificationList(prev =>
      prev.map(n => ({ ...n, unread: false }))
    )
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white px-6">
      <div className="flex items-center gap-4">
        {title && (
          <h1 className="font-display text-xl font-bold text-ink">{title}</h1>
        )}
        {children}
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications Popover */}
        <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-slate" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-coral" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="end">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-display font-semibold text-ink">Notificaciones</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs h-auto p-1 px-2 text-emerald hover:text-emerald/80 font-medium hover:bg-emerald/5 rounded"
                    >
                      Marcar todas
                    </Button>
                    <Badge variant="secondary" className="bg-coral/10 text-coral font-mono text-xs">
                      {unreadCount}
                    </Badge>
                  </>
                )}
              </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {notificationList.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`px-4 py-3 border-b border-border last:border-0 hover:bg-cloud/50 cursor-pointer transition-colors ${
                    notification.unread ? "bg-cloud/30" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        notification.type === "warning"
                          ? "bg-coral"
                          : notification.type === "success"
                          ? "bg-emerald"
                          : notification.type === "info"
                          ? "bg-gold"
                          : "bg-slate"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium text-ink ${notification.unread ? "font-semibold" : ""}`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-slate whitespace-nowrap">{formatTimeAgo(notification.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-border bg-cloud/30">
              <Link
                href="/activity"
                className="text-sm text-emerald hover:text-emerald/80 font-medium flex items-center justify-center gap-1"
              >
                Ver todas las notificaciones
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
              <Avatar className="h-9 w-9 border-2 border-emerald cursor-pointer hover:border-emerald/70 transition-colors">
                <AvatarFallback className="bg-ink text-white text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-3 py-2">
                <Avatar className="h-12 w-12 border-2 border-emerald">
                  <AvatarFallback className="bg-ink text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="font-display font-semibold text-ink">{user?.fullName ?? '...'}</p>
                  <p className="text-sm text-slate">{user?.email ?? ''}</p>
                  <Badge variant="outline" className="mt-1 w-fit bg-emerald/10 text-emerald border-emerald/30 text-xs">
                    {user?.role ? ROLE_LABELS[user.role] ?? user.role : ''}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {company && (
              <div className="px-2 py-2">
                <div className="rounded-lg bg-cloud/50 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-slate" />
                    <span className="text-slate">Empresa:</span>
                    <span className="text-ink font-medium truncate">{company.legalName}</span>
                  </div>
                </div>
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/users" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Mi Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Configuración</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-coral focus:text-coral focus:bg-coral/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
