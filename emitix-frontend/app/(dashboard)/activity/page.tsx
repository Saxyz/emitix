"use client"

import { useEffect, useState } from "react"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { AppHeader } from "@/components/layout/app-header"
import { activityApi } from "@/lib/api/activity"
import type { ActivityResponse } from "@/lib/api/types"
import { useToast } from "@/hooks/use-toast"

const PAGE_SIZE = 15

function initials(username: string) {
  const parts = username.split(/[\s._-]/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return username.slice(0, 2).toUpperCase()
}

export default function ActivityLogPage() {
  const { toast } = useToast()
  const [activities, setActivities] = useState<ActivityResponse[]>([])
  const [total, setTotal]           = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage]             = useState(0)
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState("")

  const fetchActivity = (p = 0) => {
    setLoading(true)
    activityApi.getAll({
      username: search || undefined,
      page: p,
      size: PAGE_SIZE,
    }).then(res => {
      setActivities(res.content)
      setTotal(res.totalElements)
      setTotalPages(res.totalPages)
      setPage(p)
    }).catch(err => {
      console.error("Error al cargar log de actividad:", err)
      toast({
        title: "Error de carga",
        description: err.message || "No se pudieron obtener los logs de actividad.",
        variant: "destructive",
      })
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchActivity(0) }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchActivity(0)
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">Log de actividad</h1>
            <p className="text-slate mt-1">Registro cronológico de acciones del sistema.</p>
          </div>
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
              <Input
                placeholder="Buscar por usuario..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-64 bg-white border-mist"
              />
            </div>
            <Button type="submit" variant="outline" className="border-mist">
              Buscar
            </Button>
          </form>
        </div>

        {/* Activity Table */}
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-cloud/30">
                <th className="text-left py-4 px-4 text-label-caps text-slate font-medium">TIMESTAMP</th>
                <th className="text-left py-4 px-4 text-label-caps text-slate font-medium">USUARIO</th>
                <th className="text-left py-4 px-4 text-label-caps text-slate font-medium">ACCIÓN</th>
                <th className="text-left py-4 px-4 text-label-caps text-slate font-medium">ENTIDAD</th>
                <th className="text-left py-4 px-4 text-label-caps text-slate font-medium">IP CLIENTE</th>
                <th className="text-left py-4 px-4 text-label-caps text-slate font-medium">RESULTADO</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-4 px-4" colSpan={6}>
                      <Skeleton className="h-10 w-full" />
                    </td>
                  </tr>
                ))
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate">
                    {search ? "Sin resultados para esa búsqueda." : "Sin actividad registrada."}
                  </td>
                </tr>
              ) : (
                activities.map((activity) => (
                  <tr
                    key={activity.id}
                    className={`border-b border-border last:border-0 hover:bg-cloud/30 transition-colors ${
                      activity.result !== "SUCCESS" ? "bg-coral/5" : ""
                    }`}
                  >
                    <td className="py-4 px-4">
                      <span className="font-mono text-sm text-slate">
                        {new Date(activity.createdAt).toLocaleString("es-CO")}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-ink text-white text-xs">
                            {initials(activity.username)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-ink">{activity.username}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-ink">{activity.action}</span>
                      {activity.description && (
                        <p className="text-xs text-slate mt-0.5">{activity.description}</p>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono text-xs px-2 py-1 rounded bg-cloud text-ink">
                        {activity.entity}
                        {activity.entityRef ? ` · ${activity.entityRef}` : ""}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono text-sm text-slate">
                        {activity.ipAddress ?? "—"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-xs font-semibold ${
                        activity.result === "SUCCESS" ? "text-emerald" : "text-coral"
                      }`}>
                        {activity.result === "SUCCESS" ? "OK" : "ERROR"}
                      </span>
                      {activity.errorDetail && (
                        <p className="text-xs text-coral mt-0.5 max-w-xs truncate" title={activity.errorDetail}>
                          {activity.errorDetail}
                        </p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-border">
              <p className="text-sm text-slate">
                Mostrando {activities.length} de {total} resultados
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page === 0}
                  onClick={() => fetchActivity(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                  <Button
                    key={i}
                    variant={page === i ? "default" : "outline"}
                    size="sm"
                    className={`h-8 w-8 ${page === i ? "bg-ink text-white" : ""}`}
                    onClick={() => fetchActivity(i)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages - 1}
                  onClick={() => fetchActivity(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
