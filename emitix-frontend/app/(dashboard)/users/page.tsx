"use client"

import { useEffect, useState } from "react"
import { Search, UserPlus, X, LogIn, KeyRound, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AppHeader } from "@/components/layout/app-header"
import { useAuth } from "@/hooks/useAuth"
import { RoleGate } from "@/components/auth/RoleGate"
import { usersApi } from "@/lib/api/users"
import type { UserResponse } from "@/lib/api/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN:       "Administrador",
  ACCOUNTANT:  "Contador",
  VIEWER:      "Solo Lectura",
}

const roleColor: Record<string, string> = {
  SUPER_ADMIN: "bg-coral/10 text-coral border-coral/30",
  ADMIN:       "bg-ocean/10 text-ocean border-ocean/30",
  ACCOUNTANT:  "bg-emerald/10 text-emerald border-emerald/30",
  VIEWER:      "bg-slate/10 text-slate border-slate/30",
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
}

export default function UsersPage() {
  const { companyId } = useAuth()

  const [users, setUsers]           = useState<UserResponse[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [search, setSearch]         = useState("")
  const [selected, setSelected]     = useState<UserResponse | null>(null)
  const [saving, setSaving]         = useState(false)

  // Invite states
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("VIEWER")
  const [inviting, setInviting]     = useState(false)

  const handleInviteUser = async () => {
    if (!companyId) return
    if (!inviteName || !inviteEmail) {
      alert("Por favor completa los campos obligatorios.")
      return
    }
    setInviting(true)
    try {
      const newUser = await usersApi.create({
        username: inviteEmail.split("@")[0] + "_" + Math.floor(Math.random() * 1000),
        fullName: inviteName,
        email: inviteEmail,
        password: "TempPassword123*",
        role: inviteRole as 'ADMIN' | 'ACCOUNTANT' | 'VIEWER',
      }, companyId)
      
      setUsers(prev => [newUser, ...prev])
      setInviteOpen(false)
      setInviteName("")
      setInviteEmail("")
      setInviteRole("VIEWER")
      alert(`Usuario invitado exitosamente.\nNombre: ${newUser.fullName}\nRol: ${roleLabel[newUser.role]}\nContraseña temporal: TempPassword123*`)
    } catch (err) {
      console.error(err)
      alert("Error al invitar al usuario. Por favor verifica los datos.")
    } finally {
      setInviting(false)
    }
  }

  const fetchUsers = () => {
    setLoading(true)
    usersApi.getAll({ companyId: companyId ?? undefined, size: 50 })
      .then(p => setUsers(p.content))
      .catch(() => setError("Error al cargar usuarios."))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [companyId])

  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleToggleActive = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const updated = await usersApi.update(selected.id, { isActive: !selected.isActive })
      setSelected(updated)
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
    } catch {
      setError("No se pudo actualizar el usuario.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className={selected ? "lg:col-span-2" : "lg:col-span-3"}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="font-display text-3xl font-bold text-ink">Gestión de usuarios</h1>
                <p className="text-slate mt-1">Administra los niveles de acceso y permisos del sistema.</p>
              </div>
              <RoleGate required="ADMIN">
                <Button className="bg-ink hover:bg-ink/90 text-white" onClick={() => setInviteOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invitar usuario
                </Button>
              </RoleGate>
            </div>

            <div className="flex gap-3 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
                <Input
                  placeholder="Buscar por nombre o correo"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-white border-mist"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-coral/10 border border-coral/30 text-coral text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="bg-white rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 text-label-caps text-slate font-medium">USUARIO</th>
                    <th className="text-left py-4 px-4 text-label-caps text-slate font-medium">ROL</th>
                    <th className="text-left py-4 px-4 text-label-caps text-slate font-medium">ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i} className="border-b border-border">
                        <td className="py-4 px-4" colSpan={3}><Skeleton className="h-10 w-full" /></td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-10 text-center text-slate">
                        {search ? "Sin resultados para esa búsqueda." : "No hay usuarios registrados."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((u) => (
                      <tr
                        key={u.id}
                        onClick={() => setSelected(u)}
                        className={`border-b border-border last:border-0 hover:bg-cloud/50 transition-colors cursor-pointer ${
                          selected?.id === u.id ? "bg-cloud/50" : ""
                        } ${!u.isActive ? "opacity-50" : ""}`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-ink text-white text-sm">
                                {initials(u.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-ink">{u.fullName}</p>
                              <p className="text-sm text-slate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className={roleColor[u.role] ?? ""}>
                            {roleLabel[u.role] ?? u.role}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className={u.isActive
                            ? "bg-emerald/10 text-emerald border-emerald/30"
                            : "bg-slate/10 text-slate border-slate/30"
                          }>
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-2" />
                            {u.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail Panel */}
          {selected && (
            <div>
              <Card className="sticky top-24">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="font-display text-lg font-bold text-ink">Detalles de Usuario</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
                    <X className="h-4 w-4 text-slate" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-20 w-20 mb-4">
                      <AvatarFallback className="bg-ink text-white text-2xl">
                        {initials(selected.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-display text-xl font-bold text-ink">{selected.fullName}</h3>
                    <p className="text-sm text-slate">{selected.email}</p>
                    <Badge variant="outline" className={`mt-3 ${selected.isActive
                      ? "bg-emerald/10 text-emerald border-emerald/30"
                      : "bg-slate/10 text-slate border-slate/30"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${selected.isActive ? "bg-emerald" : "bg-slate"}`} />
                      {selected.isActive ? "Cuenta Activa" : "Cuenta Inactiva"}
                    </Badge>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <p className="text-label-caps text-slate mb-3">ROL Y PERMISOS</p>
                    <Badge variant="outline" className={roleColor[selected.role] ?? ""}>
                      {roleLabel[selected.role] ?? selected.role}
                    </Badge>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <p className="text-label-caps text-slate mb-3">SEGURIDAD</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <LogIn className="h-4 w-4 text-slate" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-ink">Creado</p>
                        </div>
                        <span className="text-sm text-slate">
                          {new Date(selected.createdAt).toLocaleDateString("es-CO")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <KeyRound className="h-4 w-4 text-slate" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-ink">Método de login</p>
                        </div>
                        <span className="text-sm text-slate">Email / Password</span>
                      </div>
                    </div>
                  </div>

                  <RoleGate required="ADMIN">
                    <div className="pt-4 border-t border-border flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 border-mist"
                        onClick={handleToggleActive}
                        disabled={saving}
                      >
                        {selected.isActive ? "Suspender" : "Activar"}
                      </Button>
                    </div>
                  </RoleGate>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Invite User Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-ink">Invitar Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-slate text-xs font-semibold uppercase tracking-wider mb-2 block font-display">Nombre Completo</Label>
              <Input
                placeholder="Nombre y Apellidos"
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                className="bg-white border-mist"
              />
            </div>
            <div>
              <Label className="text-slate text-xs font-semibold uppercase tracking-wider mb-2 block font-display">Correo Electrónico</Label>
              <Input
                type="email"
                placeholder="ejemplo@empresa.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="bg-white border-mist"
              />
            </div>
            <div>
              <Label className="text-slate text-xs font-semibold uppercase tracking-wider mb-2 block font-display">Rol de Acceso</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="bg-white border-mist text-ink">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador (Control total)</SelectItem>
                  <SelectItem value="ACCOUNTANT">Contador (Facturación y reportes)</SelectItem>
                  <SelectItem value="VIEWER">Solo Lectura (Visualización)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-4">
              <Button
                onClick={handleInviteUser}
                disabled={inviting || !inviteName || !inviteEmail}
                className="w-full bg-ink hover:bg-ink/90 text-white font-medium"
              >
                {inviting ? "Enviando invitación..." : "Enviar Invitación"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
