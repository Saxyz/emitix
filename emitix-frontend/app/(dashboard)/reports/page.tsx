"use client"

import { useEffect, useState } from "react"
import {
  Zap, FileSpreadsheet, Code2, FileText, TrendingUp, CheckCircle,
  MoreVertical, Copy, AlertTriangle, ChevronLeft, ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { AppHeader } from "@/components/layout/app-header"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { reportsApi } from "@/lib/api/reports"
import type { ReportSummaryResponse, ReportInvoiceRow } from "@/lib/api/types"
import { useToast } from "@/components/ui/use-toast"

const statusBadge: Record<string, string> = {
  ACCEPTED:  "bg-emerald/10 text-emerald border-emerald/30",
  REJECTED:  "bg-coral/10 text-coral border-coral/30",
  DRAFT:     "bg-slate/10 text-slate border-slate/30",
  SENT:      "bg-gold/10 text-gold border-gold/30",
  CANCELLED: "bg-slate/10 text-slate border-slate/30",
}

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n)

const PAGE_SIZE = 10

function daysAgo(days: number) {
  const d = new Date(); d.setDate(d.getDate() - days)
  return d.toISOString().replace(".000Z", "")
}

export default function ReportsPage() {
  const { toast } = useToast()
  const [period, setPeriod]     = useState("30")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [summary, setSummary]   = useState<ReportSummaryResponse | null>(null)
  const [rows, setRows]         = useState<ReportInvoiceRow[]>([])
  const [total, setTotal]       = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage]         = useState(0)
  const [loadingS, setLoadingS] = useState(true)
  const [loadingR, setLoadingR] = useState(true)

  const fetchData = async (p = 0) => {
    const to   = new Date().toISOString().replace(".000Z", "")
    const from = daysAgo(Number(period))

    // Cargar resumen
    setLoadingS(true)
    try {
      const summaryData = await reportsApi.summary(from, to)
      setSummary(summaryData)
    } catch (err: any) {
      console.error("Error fetching report summary:", err)
      toast({
        variant: "destructive",
        title: "Error al cargar el resumen",
        description: err.message || "No se pudo obtener la información de resumen de facturación.",
      })
    } finally {
      setLoadingS(false)
    }

    // Cargar facturas
    setLoadingR(true)
    try {
      const res = await reportsApi.invoices({
        from, to,
        status: statusFilter !== "ALL" ? (statusFilter as any) : undefined,
        page: p, size: PAGE_SIZE,
      })
      setRows(res.content)
      setTotal(res.totalElements)
      setTotalPages(res.totalPages)
      setPage(p)
    } catch (err: any) {
      console.error("Error fetching report invoices:", err)
      toast({
        variant: "destructive",
        title: "Error al cargar listado de facturas",
        description: err.message || "Ocurrió un problema de base de datos o conexión al consultar las facturas.",
      })
    } finally {
      setLoadingR(false)
    }
  }

  const handleExportCSV = () => {
    if (rows.length === 0) {
      alert("No hay datos disponibles para exportar.")
      return
    }
    const headers = ["Numero", "Fecha Emision", "Adquiriente", "Total COP", "Estado"]
    const csvRows = [
      headers.join(","),
      ...rows.map(row => [
        `"${row.number}"`,
        `"${new Date(row.createdAt).toLocaleDateString("es-CO")}"`,
        `"${row.buyerName.replace(/"/g, '""')}"`,
        row.total,
        `"${row.status}"`
      ].join(","))
    ]
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `emitix_reporte_${period}_dias.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportJSON = () => {
    if (rows.length === 0) {
      alert("No hay datos disponibles para exportar.")
      return
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      summary,
      periodDays: period,
      statusFilter,
      generatedAt: new Date().toISOString(),
      invoices: rows
    }, null, 2))
    const link = document.createElement("a")
    link.setAttribute("href", dataStr)
    link.setAttribute("download", `emitix_reporte_${period}_dias.json`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  useEffect(() => { fetchData(0) }, [period, statusFilter])

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Generador de Reportes</h1>
          <p className="text-slate mt-1">Configure los parámetros para extraer la información fiscal de su facturación electrónica.</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <p className="text-label-caps text-slate mb-2">PERIODO FISCAL</p>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="bg-white border-mist">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 días</SelectItem>
                    <SelectItem value="30">Últimos 30 días</SelectItem>
                    <SelectItem value="90">Últimos 90 días</SelectItem>
                    <SelectItem value="365">Último año</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-label-caps text-slate mb-2">ESTADO DIAN</p>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-white border-mist">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los estados</SelectItem>
                    <SelectItem value="ACCEPTED">Aprobados</SelectItem>
                    <SelectItem value="REJECTED">Rechazados</SelectItem>
                    <SelectItem value="DRAFT">Borradores</SelectItem>
                    <SelectItem value="CANCELLED">Cancelados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-start-4">
                <Button onClick={() => fetchData(0)} className="w-full bg-ink hover:bg-ink/90 text-white h-10">
                  <Zap className="mr-2 h-4 w-4" />
                  Generar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5">
              <p className="text-label-caps text-slate">TOTAL EMITIDO</p>
              {loadingS ? <Skeleton className="h-10 w-32 mt-2" /> : (
                <>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-display font-bold text-ink">{formatCOP(summary?.totalAmount ?? 0)}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-emerald text-sm">
                    <TrendingUp className="h-4 w-4" />
                    {summary?.totalInvoices ?? 0} facturas
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <p className="text-label-caps text-slate">APROBADO DIAN</p>
              {loadingS ? <Skeleton className="h-10 w-32 mt-2" /> : (
                <>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-display font-bold text-ink">{summary?.acceptedInvoices ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-emerald text-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald" />
                    documentos
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <p className="text-label-caps text-slate">RECHAZOS</p>
              {loadingS ? <Skeleton className="h-10 w-32 mt-2" /> : (
                <>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-display font-bold text-ink">{summary?.rejectedInvoices ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-coral text-sm">
                    <span className="w-2 h-2 rounded-full bg-coral" />
                    documentos
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-emerald text-white">
            <CardContent className="pt-5">
              <p className="text-xs text-white/70 uppercase tracking-wider">TASA DE ÉXITO</p>
              {loadingS ? <Skeleton className="h-10 w-24 mt-2 bg-white/20" /> : (
                <>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-display font-bold">{summary?.acceptanceRate?.toFixed(1) ?? "0.0"}%</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-white/80">{(summary?.acceptanceRate ?? 0) >= 95 ? "Óptimo" : "Requiere atención"}</span>
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Table */}
        <Card>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 pb-2 border-b border-border gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Resultados del Reporte</h2>
              <p className="text-sm text-slate">Detalle de facturación correspondiente a los filtros aplicados.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="border-mist text-ink hover:text-emerald">
                <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald" />
                Exportar CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportJSON} className="border-mist text-ink hover:text-ocean">
                <Code2 className="mr-2 h-4 w-4 text-ocean" />
                Exportar JSON
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} className="border-mist text-ink hover:text-coral">
                <FileText className="mr-2 h-4 w-4 text-coral" />
                Imprimir
              </Button>
            </div>
          </div>
          <CardContent className="pt-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-label-caps text-slate font-medium">PREFIJO / FOLIO</th>
                  <th className="text-left py-3 px-4 text-label-caps text-slate font-medium">FECHA EMISIÓN</th>
                  <th className="text-left py-3 px-4 text-label-caps text-slate font-medium">ADQUIRIENTE</th>
                  <th className="text-left py-3 px-4 text-label-caps text-slate font-medium">TOTAL (COP)</th>
                  <th className="text-left py-3 px-4 text-label-caps text-slate font-medium">ESTADO</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {loadingR ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="py-4 px-4" colSpan={6}><Skeleton className="h-10 w-full" /></td>
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate">Sin facturas para este período y filtros.</td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="border-b border-border last:border-0 hover:bg-cloud/30">
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm font-medium text-ink">{row.number}</span>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate">
                        {new Date(row.createdAt).toLocaleDateString("es-CO")}
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-medium text-ink">{row.buyerName}</p>
                      </td>
                      <td className="py-4 px-4 text-sm font-medium text-ink font-mono">
                        {formatCOP(row.total)}
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="outline" className={statusBadge[row.status] ?? "bg-slate/10 text-slate border-slate/30"}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-2" />
                          {row.status}
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
                              <a href={`/invoices/${row.id}`}>Ver detalle</a>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {!loadingR && totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                <p className="text-sm text-slate">Mostrando {rows.length} de {total} resultados</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => fetchData(page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                    <Button key={i} variant={page === i ? "default" : "outline"} size="sm" className={`h-8 w-8 ${page === i ? "bg-ink text-white" : ""}`} onClick={() => fetchData(i)}>
                      {i + 1}
                    </Button>
                  ))}
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => fetchData(page + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
