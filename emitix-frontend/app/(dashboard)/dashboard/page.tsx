"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle, FileText, CheckCircle, AlertCircle, Hash,
  TrendingUp, MoreVertical, ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AppHeader } from "@/components/layout/app-header"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { reportsApi } from "@/lib/api/reports"
import { invoicesApi } from "@/lib/api/invoices"
import type { ReportSummaryResponse, InvoiceResponse } from "@/lib/api/types"

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT:      { label: "Borrador",   className: "bg-slate/10 text-slate border-slate/30" },
  ISSUED:     { label: "Emitida",    className: "bg-gold/10 text-gold border-gold/30" },
  SENT:       { label: "Enviada",    className: "bg-gold/10 text-gold border-gold/30" },
  ACCEPTED:   { label: "Aprobada",   className: "bg-emerald/10 text-emerald border-emerald/30" },
  REJECTED:   { label: "Rechazada",  className: "bg-coral/10 text-coral border-coral/30" },
  CANCELLED:  { label: "Cancelada",  className: "bg-slate/10 text-slate border-slate/30" },
}

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n)

export default function DashboardPage() {
  const { companyId } = useAuth()
  const { toast } = useToast()

  const [summary, setSummary] = useState<ReportSummaryResponse | null>(null)
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const to   = new Date()
    const from = new Date(); from.setDate(from.getDate() - 30)
    const fmt  = (d: Date) => d.toISOString().replace(".000Z", "")

    Promise.all([
      reportsApi.summary(fmt(from), fmt(to)),
      invoicesApi.getAll({ size: 5 }),
    ]).then(([s, p]) => {
      setSummary(s)
      setInvoices(p.content)
    }).catch((err: any) => {
      console.error("Dashboard Load Error:", err)
      toast({
        title: "Error al cargar el resumen",
        description: err.message || "No se pudieron obtener los datos operativos actuales.",
        variant: "destructive"
      })
    }).finally(() => setLoading(false))
  }, [companyId, toast])

  const rejectedCount = summary?.rejectedInvoices ?? 0

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="p-6 space-y-6">
        {/* Alert Banner — solo si hay rechazos */}
        {rejectedCount > 0 && (
          <div className="bg-coral/5 border border-coral/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-coral mt-0.5" />
              <div>
                <p className="font-semibold text-coral">Atención Requerida: Facturas Rechazadas</p>
                <p className="text-sm text-coral/80 mt-1">
                  Existen {rejectedCount} factura{rejectedCount > 1 ? "s" : ""} con estado de rechazo por parte de la DIAN.
                  Por favor, revise el registro de contingencias.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Page Title */}
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Resumen Operativo</h1>
          <p className="text-slate mt-1">Estado actual de emisión electrónica</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total facturas */}
          <Card className="border-border">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-label-caps text-slate">FACTURAS (30 DÍAS)</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    {loading ? (
                      <Skeleton className="h-10 w-16" />
                    ) : (
                      <span className="text-4xl font-display font-bold text-ink">{summary?.totalInvoices ?? 0}</span>
                    )}
                  </div>
                </div>
                <div className="p-2 bg-cloud rounded-lg">
                  <FileText className="h-5 w-5 text-ink" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aprobadas */}
          <Card className="border-border">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-label-caps text-slate">APROBADAS DIAN</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    {loading ? (
                      <Skeleton className="h-10 w-16" />
                    ) : (
                      <>
                        <span className="text-4xl font-display font-bold text-ink">{summary?.acceptedInvoices ?? 0}</span>
                        <span className="text-sm text-slate">/ {summary?.totalInvoices ?? 0}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="p-2 bg-emerald/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-emerald" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rechazos */}
          <Card className={rejectedCount > 0 ? "border-gold/30 bg-gold/5" : "border-border"}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-label-caps ${rejectedCount > 0 ? "text-gold" : "text-slate"}`}>
                    RECHAZADAS / CANCELADAS
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    {loading ? (
                      <Skeleton className="h-10 w-16" />
                    ) : (
                      <span className="text-4xl font-display font-bold text-ink">{rejectedCount}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate mt-1">Requieren acción</p>
                </div>
                <div className={`p-2 rounded-lg ${rejectedCount > 0 ? "bg-gold/20" : "bg-cloud"}`}>
                  <AlertCircle className={`h-5 w-5 ${rejectedCount > 0 ? "text-gold" : "text-ink"}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasa de aceptación */}
          <Card className="border-border">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div className="w-full">
                  <p className="text-label-caps text-slate">TASA DE ACEPTACIÓN</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    {loading ? (
                      <Skeleton className="h-10 w-20" />
                    ) : (
                      <span className="text-4xl font-display font-bold text-ink">
                        {summary?.acceptanceRate?.toFixed(1) ?? "0.0"}%
                      </span>
                    )}
                  </div>
                  {!loading && (
                    <Progress value={summary?.acceptanceRate ?? 0} className="mt-3 h-2 bg-mist" />
                  )}
                </div>
                <div className="p-2 bg-cloud rounded-lg">
                  <TrendingUp className="h-5 w-5 text-ink" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Invoices Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="font-display text-xl font-bold text-ink">
              Últimas Facturas Emitidas
            </CardTitle>
            <Button variant="ghost" asChild className="text-ink">
              <Link href="/invoices">
                Ver todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : invoices.length === 0 ? (
              <p className="text-center text-slate py-8">No hay facturas aún.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-label-caps text-slate font-medium">NÚMERO</th>
                      <th className="text-left py-3 px-4 text-label-caps text-slate font-medium">FECHA</th>
                      <th className="text-left py-3 px-4 text-label-caps text-slate font-medium">CLIENTE</th>
                      <th className="text-left py-3 px-4 text-label-caps text-slate font-medium">TOTAL</th>
                      <th className="text-left py-3 px-4 text-label-caps text-slate font-medium">ESTADO</th>
                      <th className="text-left py-3 px-4 text-label-caps text-slate font-medium">ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => {
                      const st = statusConfig[inv.status] ?? { label: inv.status, className: "bg-slate/10 text-slate border-slate/30" }
                      return (
                        <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-cloud/50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="font-mono text-sm font-medium text-ink">
                              {inv.prefix}-{inv.number}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-slate">
                            {new Date(inv.createdAt).toLocaleDateString("es-CO")}
                          </td>
                          <td className="py-4 px-4 text-sm text-ink">{inv.buyerName}</td>
                          <td className="py-4 px-4 text-sm font-medium text-ink font-mono">
                            {formatCOP(inv.total)}
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant="outline" className={st.className}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current mr-2" />
                              {st.label}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4 text-slate" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/invoices/${inv.id}`}>Ver detalle</Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
