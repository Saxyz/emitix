"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Search, Plus, MoreVertical, ChevronLeft, ChevronRight,
  Clock, Bell, Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { invoicesApi } from "@/lib/api/invoices"
import type { InvoiceResponse, InvoiceStatus } from "@/lib/api/types"

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT:     { label: "Borrador",  className: "bg-slate/10 text-slate border-slate/30" },
  ISSUED:    { label: "Emitida",   className: "bg-gold/10 text-gold border-gold/30" },
  SENT:      { label: "Enviada",   className: "bg-gold/10 text-gold border-gold/30" },
  ACCEPTED:  { label: "Aprobada",  className: "bg-emerald/10 text-emerald border-emerald/30" },
  REJECTED:  { label: "Rechazada", className: "bg-coral/10 text-coral border-coral/30" },
  CANCELLED: { label: "Cancelada", className: "bg-slate/10 text-slate border-slate/30" },
}

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n)

const PAGE_SIZE = 10

export default function InvoicesPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [invoices, setInvoices]       = useState<InvoiceResponse[]>([])
  const [total, setTotal]             = useState(0)
  const [totalPages, setTotalPages]   = useState(1)
  const [page, setPage]               = useState(0)
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  const fetchInvoices = (p = 0) => {
    setLoading(true)
    invoicesApi.getAll({
      invoiceNumber: search || undefined,
      status: statusFilter !== "ALL" ? (statusFilter as InvoiceStatus) : undefined,
      page: p,
      size: PAGE_SIZE,
    }).then(res => {
      setInvoices(res.content)
      setTotal(res.totalElements)
      setTotalPages(res.totalPages)
      setPage(p)
    }).catch((err: any) => {
      console.error("Invoices Fetch Error:", err)
      toast({
        title: "Error al cargar las facturas",
        description: err.message || "No se pudo obtener el listado de facturas del servidor.",
        variant: "destructive"
      })
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchInvoices(0) }, [statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchInvoices(0)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white px-6">
        <form onSubmit={handleSearch} className="flex items-center gap-4 flex-1">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
            <Input
              type="text"
              placeholder="Buscar por número de factura..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 bg-white border-mist"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 border-mist bg-white">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los estados</SelectItem>
              <SelectItem value="DRAFT">Borrador</SelectItem>
              <SelectItem value="SENT">Enviada</SelectItem>
              <SelectItem value="ACCEPTED">Aprobada</SelectItem>
              <SelectItem value="REJECTED">Rechazada</SelectItem>
              <SelectItem value="CANCELLED">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </form>

        <div className="flex items-center gap-3">
          <Button asChild className="bg-emerald hover:bg-emerald/90 text-white">
            <Link href="/invoices/new">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Factura
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-slate" />
          </Button>
          <Avatar className="h-9 w-9 border-2 border-emerald">
            <AvatarFallback className="bg-ink text-white text-xs">
              {user?.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() ?? "EM"}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">Listado de Facturas</h1>
            <p className="text-slate mt-1">Gestión y seguimiento de facturas electrónicas.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate">
            <Clock className="h-4 w-4" />
            {loading ? "Cargando..." : `Mostrando ${invoices.length} de ${total} facturas`}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-cloud/30">
                <th className="text-left py-4 px-4 text-label-caps text-slate font-medium">NÚMERO</th>
                <th className="text-left py-4 px-4 text-label-caps text-slate font-medium">ADQUIRENTE</th>
                <th className="text-left py-4 px-4 text-label-caps text-slate font-medium">FECHA EMISIÓN</th>
                <th className="text-left py-4 px-4 text-label-caps text-slate font-medium">TOTAL</th>
                <th className="text-left py-4 px-4 text-label-caps text-slate font-medium">ESTADO</th>
                <th className="text-left py-4 px-4 text-label-caps text-slate font-medium">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-4 px-4" colSpan={6}><Skeleton className="h-10 w-full" /></td>
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate">
                    No se encontraron facturas.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const st = statusConfig[inv.status] ?? { label: inv.status, className: "bg-slate/10 text-slate border-slate/30" }
                  return (
                    <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-cloud/30 transition-colors">
                      <td className="py-4 px-4">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="font-mono text-sm font-medium text-ink hover:text-emerald border border-mist rounded px-2 py-1 inline-block"
                        >
                          {inv.prefix}-{inv.number}
                        </Link>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-sm font-medium text-ink">{inv.buyerName}</p>
                          <p className="text-xs text-slate font-mono">{inv.buyerDocument}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate">
                        {new Date(inv.createdAt).toLocaleDateString("es-CO")}
                      </td>
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
                            {inv.status === "DRAFT" && (
                              <>
                                <DropdownMenuItem asChild>
                                  <Link href={`/invoices/${inv.id}`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-border">
              <p className="text-sm text-slate">Página {page + 1} de {totalPages}</p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => fetchInvoices(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                  <Button
                    key={i}
                    variant={page === i ? "default" : "outline"}
                    size="sm"
                    className={`h-8 w-8 ${page === i ? "bg-ink text-white" : ""}`}
                    onClick={() => fetchInvoices(i)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => fetchInvoices(page + 1)}>
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
