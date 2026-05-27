"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Download, FileText, CheckCircle, Copy,
  Building2, User, Clock, Shield, FileCode, XCircle, Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { invoicesApi } from "@/lib/api/invoices"
import { RoleGate } from "@/components/auth/RoleGate"
import type { InvoiceResponse } from "@/lib/api/types"

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n)

const STATUS_BADGE: Record<string, React.ReactNode> = {
  ACCEPTED: (
    <Badge className="bg-emerald/10 text-emerald border-emerald/30 px-4 py-1.5">
      <CheckCircle className="h-4 w-4 mr-2" /> Aceptada DIAN
    </Badge>
  ),
  REJECTED: (
    <Badge className="bg-coral/10 text-coral border-coral/30 px-4 py-1.5">
      <XCircle className="h-4 w-4 mr-2" /> Rechazada
    </Badge>
  ),
  DRAFT: (
    <Badge className="bg-slate/10 text-slate border-slate/30 px-4 py-1.5">
      <FileText className="h-4 w-4 mr-2" /> Borrador
    </Badge>
  ),
  SENT: (
    <Badge className="bg-gold/10 text-gold border-gold/30 px-4 py-1.5">
      <Clock className="h-4 w-4 mr-2" /> Enviada
    </Badge>
  ),
  CANCELLED: (
    <Badge className="bg-slate/10 text-slate border-slate/30 px-4 py-1.5">
      <XCircle className="h-4 w-4 mr-2" /> Cancelada
    </Badge>
  ),
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [invoice, setInvoice]       = useState<InvoiceResponse | null>(null)
  const [loading, setLoading]       = useState(true)
  const [copiedCufe, setCopiedCufe] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    invoicesApi.getById(id)
      .then(setInvoice)
      .finally(() => setLoading(false))
  }, [id])

  const handleCopyCufe = () => {
    if (!invoice?.cufe) return
    navigator.clipboard.writeText(invoice.cufe)
    setCopiedCufe(true)
    toast.success("CUFE copiado al portapapeles")
    setTimeout(() => setCopiedCufe(false), 2000)
  }

  const handleDownloadPdf = async () => {
    const blob = await invoicesApi.downloadPdf(id)
    downloadBlob(blob, `factura-${invoice?.prefix}-${invoice?.number}.pdf`)
  }

  const handleDownloadXml = async () => {
    const blob = await invoicesApi.downloadXml(id)
    downloadBlob(blob, `factura-${invoice?.prefix}-${invoice?.number}.xml`)
  }

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      const updated = await invoicesApi.confirm(id)
      setInvoice(updated)
      toast.success("Factura confirmada y enviada a DIAN")
    } catch {
      toast.error("No se pudo confirmar la factura.")
    } finally {
      setConfirming(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm("¿Seguro que deseas cancelar esta factura? Esta acción no se puede deshacer.")) return
    setCancelling(true)
    try {
      const updated = await invoicesApi.cancel(id)
      setInvoice(updated)
      toast.success("Factura cancelada")
    } catch {
      toast.error("No se pudo cancelar la factura.")
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="p-6 text-center text-slate">
        <p>Factura no encontrada.</p>
        <Button asChild variant="link" className="mt-4"><Link href="/invoices">Volver al listado</Link></Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white px-6">
        <div className="flex items-center gap-4">
          <Link href="/invoices" className="flex items-center gap-2 text-slate hover:text-ink transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-lg font-bold text-ink">Factura Electrónica</h1>
            <p className="text-xs text-slate">{invoice.prefix}-{invoice.number}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {STATUS_BADGE[invoice.status]}
        </div>
      </header>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-label-caps text-slate mb-1">FACTURA DE VENTA ELECTRÓNICA</p>
                    <h2 className="font-display text-4xl font-bold text-ink">{invoice.prefix}-{invoice.number}</h2>
                    <div className="flex items-center gap-4 mt-2 text-slate">
                      <p className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Emisión: {new Date(invoice.createdAt).toLocaleString("es-CO")}
                      </p>
                      {invoice.dueDate && <p>Vence: {invoice.dueDate}</p>}
                    </div>
                  </div>
                </div>

                {/* Buyer */}
                <div className="p-4 rounded-lg border border-border bg-cloud/30 border-l-4 border-l-emerald">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-slate" />
                    <span className="text-sm font-medium text-slate">Adquiriente</span>
                  </div>
                  <p className="font-semibold text-ink">{invoice.buyerName}</p>
                  <p className="text-sm text-slate mt-1">Documento: {invoice.buyerDocument}</p>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="items">
              <TabsList className="w-full justify-start bg-white border border-border rounded-lg p-1">
                <TabsTrigger value="items" className="flex-1">Líneas de Detalle</TabsTrigger>
                <TabsTrigger value="taxes" className="flex-1">Impuestos y Totales</TabsTrigger>
                <TabsTrigger value="payment" className="flex-1">Pago</TabsTrigger>
              </TabsList>

              <TabsContent value="items" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-2 text-label-caps text-slate font-medium">DESCRIPCIÓN</th>
                          <th className="text-center py-3 px-2 text-label-caps text-slate font-medium">CANT</th>
                          <th className="text-right py-3 px-2 text-label-caps text-slate font-medium">VR. UNIT</th>
                          <th className="text-center py-3 px-2 text-label-caps text-slate font-medium">IVA %</th>
                          <th className="text-right py-3 px-2 text-label-caps text-slate font-medium">SUBTOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items.map((item, i) => (
                          <tr key={i} className="border-b border-border">
                            <td className="py-4 px-2">
                              <p className="text-sm text-ink">{item.description}</p>
                              {item.unspscCode && <p className="text-xs text-slate font-mono">UNSPSC: {item.unspscCode}</p>}
                            </td>
                            <td className="py-4 px-2 text-sm text-ink text-center font-mono">{item.quantity}</td>
                            <td className="py-4 px-2 text-sm text-ink text-right font-mono">{formatCOP(item.unitPrice)}</td>
                            <td className="py-4 px-2 text-sm text-ink text-center">
                              <Badge variant="outline" className="font-mono">{item.taxRate}%</Badge>
                            </td>
                            <td className="py-4 px-2 text-sm font-semibold text-ink text-right font-mono">
                              {formatCOP(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {invoice.notes && (
                      <div className="mt-6 pt-4 border-t border-border">
                        <p className="text-label-caps text-slate mb-2">OBSERVACIONES</p>
                        <p className="text-sm text-ink">{invoice.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="taxes" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="max-w-md ml-auto space-y-3">
                      <div className="flex justify-between py-2">
                        <span className="text-slate">Subtotal (sin impuestos):</span>
                        <span className="font-mono text-ink">{formatCOP(invoice.subtotal)}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-slate">IVA:</span>
                        <span className="font-mono text-ink">{formatCOP(invoice.taxTotal)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between py-3 bg-ink/5 rounded-lg px-3 -mx-3">
                        <span className="font-semibold text-ink text-lg">Total a Pagar:</span>
                        <span className="font-mono font-bold text-2xl text-ink">{formatCOP(invoice.total)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payment" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {invoice.paymentMethod && (
                        <div>
                          <p className="text-label-caps text-slate mb-2">MÉTODO DE PAGO</p>
                          <p className="text-ink font-medium">{invoice.paymentMethod}</p>
                        </div>
                      )}
                      {invoice.dueDate && (
                        <div>
                          <p className="text-label-caps text-slate mb-2">FECHA DE VENCIMIENTO</p>
                          <p className="text-ink font-medium">{invoice.dueDate}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* CUFE */}
            {invoice.cufe && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-label-caps text-slate">CUFE (CÓDIGO ÚNICO DE FACTURA ELECTRÓNICA)</p>
                    <Button variant="ghost" size="sm" className="text-slate" onClick={handleCopyCufe}>
                      {copiedCufe ? <Check className="h-4 w-4 mr-2 text-emerald" /> : <Copy className="h-4 w-4 mr-2" />}
                      {copiedCufe ? "Copiado" : "Copiar"}
                    </Button>
                  </div>
                  <div className="bg-cloud p-3 rounded-lg border border-mist">
                    <p className="font-mono text-xs text-ink break-all leading-relaxed">{invoice.cufe}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="space-y-3">
              <Button onClick={handleDownloadPdf} className="w-full bg-ink hover:bg-ink/90 text-white h-12">
                <Download className="mr-2 h-4 w-4" /> Descargar PDF
              </Button>
              <Button onClick={handleDownloadXml} variant="outline" className="w-full h-12 border-mist">
                <FileCode className="mr-2 h-4 w-4" /> Descargar XML
              </Button>

              {invoice.status === "DRAFT" && (
                <RoleGate required="ACCOUNTANT">
                  <Button
                    onClick={handleConfirm}
                    disabled={confirming}
                    className="w-full h-12 bg-emerald hover:bg-emerald/90 text-white"
                  >
                    {confirming ? "Confirmando..." : "Confirmar y Enviar a DIAN"}
                  </Button>
                </RoleGate>
              )}

              {invoice.status === "ACCEPTED" && (
                <RoleGate required="ADMIN">
                  <Button
                    onClick={handleCancel}
                    disabled={cancelling}
                    variant="outline"
                    className="w-full h-12 border-coral text-coral hover:bg-coral/5"
                  >
                    {cancelling ? "Cancelando..." : "Cancelar Factura"}
                  </Button>
                </RoleGate>
              )}
            </div>

            {/* Quick Summary */}
            <Card className="bg-ink text-white">
              <CardContent className="pt-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/70">Subtotal</span>
                  <span className="font-mono">{formatCOP(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">IVA</span>
                  <span className="font-mono">{formatCOP(invoice.taxTotal)}</span>
                </div>
                <Separator className="bg-white/20" />
                <div className="flex justify-between items-baseline">
                  <span className="text-emerald font-medium">Total</span>
                  <span className="font-mono text-2xl font-bold text-emerald">{formatCOP(invoice.total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-lg font-bold text-ink">Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate">Creado por</span>
                  <span className="text-ink font-medium">{invoice.createdBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate">Tipo</span>
                  <span className="text-ink font-medium">{invoice.invoiceType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate">Moneda</span>
                  <span className="text-ink font-mono">{invoice.currency}</span>
                </div>
                {invoice.issuedAt && (
                  <div className="flex justify-between">
                    <span className="text-slate">Enviado</span>
                    <span className="text-ink">{new Date(invoice.issuedAt).toLocaleDateString("es-CO")}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
