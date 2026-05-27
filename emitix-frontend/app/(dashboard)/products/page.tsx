"use client"

import { useEffect, useState, useRef } from "react"
import { Search, Plus, Pencil, Trash2, Upload, Package, AlertCircle, Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AppHeader } from "@/components/layout/app-header"
import { useAuth } from "@/hooks/useAuth"
import { productsApi, type CsvImportResult } from "@/lib/api/products"
import type { ProductResponse, ProductRequest } from "@/lib/api/types"
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
import { Checkbox } from "@/components/ui/checkbox"

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n)

const EMPTY_FORM: ProductRequest = {
  internalCode: "",
  description: "",
  unspscCode: "",
  unit: "UND",
  unitPrice: 0,
  currency: "COP",
  taxRate: 19,
  isService: false,
  isIvaExcluded: false,
}

export default function ProductsPage() {
  const { companyId } = useAuth()

  const [products, setProducts]     = useState<ProductResponse[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [search, setSearch]         = useState("")
  const [page, setPage]             = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal]           = useState(0)

  // Product form dialog
  const [formOpen, setFormOpen]     = useState(false)
  const [editing, setEditing]       = useState<ProductResponse | null>(null)
  const [form, setForm]             = useState<ProductRequest>(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // CSV import dialog
  const [csvOpen, setCsvOpen]       = useState(false)
  const [csvFile, setCsvFile]       = useState<File | null>(null)
  const [csvResult, setCsvResult]   = useState<CsvImportResult | null>(null)
  const [csvLoading, setCsvLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const PAGE_SIZE = 15

  const fetchProducts = (p = 0, q = search) => {
    if (!companyId) return
    setLoading(true)
    productsApi.getAll({ companyId, search: q || undefined, page: p, size: PAGE_SIZE, includeInactive: true })
      .then(res => {
        setProducts(res.content)
        setTotal(res.totalElements)
        setTotalPages(res.totalPages)
        setPage(p)
      })
      .catch(() => setError("Error al cargar los productos."))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProducts(0) }, [companyId])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setFormOpen(true)
  }

  const openEdit = (p: ProductResponse) => {
    setEditing(p)
    setForm({
      internalCode: p.internalCode,
      description: p.description,
      unspscCode: p.unspscCode ?? "",
      unit: p.unit,
      unitPrice: p.unitPrice,
      currency: p.currency,
      taxRate: p.taxRate,
      isService: p.isService,
      isIvaExcluded: false,
      isActive: p.isActive,
    })
    setFormErrors({})
    setFormOpen(true)
  }

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.internalCode.trim()) errs.internalCode = "Código requerido"
    if (!form.description.trim()) errs.description = "Descripción requerida"
    if (form.unitPrice < 0) errs.unitPrice = "El precio no puede ser negativo"
    if (form.taxRate === undefined || form.taxRate < 0 || form.taxRate > 100)
      errs.taxRate = "Tasa debe estar entre 0 y 100"
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const saveProduct = async () => {
    if (!companyId || !validateForm()) return
    setSaving(true)
    try {
      const body: ProductRequest = {
        ...form,
        unspscCode: form.unspscCode?.trim() || undefined,
        taxRate: Number(form.taxRate),
        unitPrice: Number(form.unitPrice),
      }
      if (editing) {
        const updated = await productsApi.update(editing.id, body)
        setProducts(prev => prev.map(p => p.id === updated.id ? updated : p))
      } else {
        const created = await productsApi.create(body, companyId)
        setProducts(prev => [created, ...prev])
        setTotal(t => t + 1)
      }
      setFormOpen(false)
    } catch (e: any) {
      setFormErrors({ submit: e?.body?.message ?? "Error al guardar el producto" })
    } finally {
      setSaving(false)
    }
  }

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar permanentemente "${name}"? Esta acción no se puede deshacer.\n\nSi tiene facturas asociadas, deberás desactivarlo desde Editar.`)) return
    try {
      await productsApi.delete(id)
      setProducts(prev => prev.filter(p => p.id !== id))
      setTotal(t => t - 1)
    } catch (e: any) {
      setError(e?.body?.message ?? "No se pudo eliminar el producto.")
    }
  }

  const importCsv = async () => {
    if (!csvFile || !companyId) return
    setCsvLoading(true)
    setCsvResult(null)
    try {
      const result = await productsApi.importCsv(csvFile, companyId)
      setCsvResult(result)
      fetchProducts(0)
    } catch {
      setCsvResult({ imported: 0, skipped: 0, errors: ["Error al procesar el archivo CSV"] })
    } finally {
      setCsvLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchProducts(0, search)
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Productos" />

      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">Catálogo de Productos</h1>
            <p className="text-slate mt-1">Gestiona los productos y servicios de tu empresa.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-mist" onClick={() => { setCsvFile(null); setCsvResult(null); setCsvOpen(true) }}>
              <Upload className="mr-2 h-4 w-4" />
              Importar CSV
            </Button>
            <Button className="bg-emerald hover:bg-emerald/90 text-white" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo producto
            </Button>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
            <Input
              placeholder="Buscar por descripción o código…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-white border-mist"
            />
          </div>
          <Button type="submit" variant="outline" className="border-mist">Buscar</Button>
        </form>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-coral/10 border border-coral/30 text-coral text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Products table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-cloud/30">
                    <th className="text-left px-4 py-3 text-slate font-medium text-xs uppercase tracking-wide">Código</th>
                    <th className="text-left px-4 py-3 text-slate font-medium text-xs uppercase tracking-wide">Descripción</th>
                    <th className="text-left px-4 py-3 text-slate font-medium text-xs uppercase tracking-wide">Unidad</th>
                    <th className="text-right px-4 py-3 text-slate font-medium text-xs uppercase tracking-wide">Precio</th>
                    <th className="text-center px-4 py-3 text-slate font-medium text-xs uppercase tracking-wide">IVA %</th>
                    <th className="text-center px-4 py-3 text-slate font-medium text-xs uppercase tracking-wide">Tipo</th>
                    <th className="text-center px-4 py-3 text-slate font-medium text-xs uppercase tracking-wide">Estado</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-border">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate">
                        <Package className="h-8 w-8 mx-auto mb-2 text-mist" />
                        <p>No hay productos. Crea uno o importa un CSV.</p>
                      </td>
                    </tr>
                  ) : (
                    products.map(p => (
                      <tr key={p.id} className="border-b border-border hover:bg-cloud/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate">{p.internalCode}</td>
                        <td className="px-4 py-3 font-medium text-ink max-w-xs truncate">{p.description}</td>
                        <td className="px-4 py-3 text-slate">{p.unit}</td>
                        <td className="px-4 py-3 text-right font-mono text-ink">{formatCOP(p.unitPrice)}</td>
                        <td className="px-4 py-3 text-center text-slate">{p.taxRate}%</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className={p.isService ? "bg-ocean/10 text-ocean border-ocean/30" : "bg-emerald/10 text-emerald border-emerald/30"}>
                            {p.isService ? "Servicio" : "Producto"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className={p.isActive ? "bg-emerald/10 text-emerald border-emerald/30" : "bg-slate/10 text-slate border-slate/30"}>
                            {p.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-coral hover:text-coral hover:bg-coral/10" onClick={() => deleteProduct(p.id, p.description)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-sm text-slate">{total} productos</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-mist" disabled={page === 0} onClick={() => fetchProducts(page - 1)}>Anterior</Button>
                  <span className="text-sm text-slate px-2 py-1">Pág. {page + 1} / {totalPages}</span>
                  <Button variant="outline" size="sm" className="border-mist" disabled={page >= totalPages - 1} onClick={() => fetchProducts(page + 1)}>Siguiente</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create / Edit product dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate uppercase tracking-wide mb-1.5 block">Código interno *</Label>
                <Input
                  placeholder="PROD-001"
                  value={form.internalCode}
                  onChange={e => setForm(f => ({ ...f, internalCode: e.target.value }))}
                  disabled={!!editing}
                  className={`border-mist ${formErrors.internalCode ? "border-coral" : ""}`}
                />
                {formErrors.internalCode && <p className="text-xs text-coral mt-1">{formErrors.internalCode}</p>}
              </div>
              <div>
                <Label className="text-xs text-slate uppercase tracking-wide mb-1.5 block">Unidad</Label>
                <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                  <SelectTrigger className="border-mist"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["UND", "KG", "LT", "MT", "HRS", "MES", "SRV"].map(u => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs text-slate uppercase tracking-wide mb-1.5 block">Descripción *</Label>
              <Input
                placeholder="Descripción del producto o servicio"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className={`border-mist ${formErrors.description ? "border-coral" : ""}`}
              />
              {formErrors.description && <p className="text-xs text-coral mt-1">{formErrors.description}</p>}
            </div>

            <div>
              <Label className="text-xs text-slate uppercase tracking-wide mb-1.5 block">Código UNSPSC</Label>
              <Input
                placeholder="12345678"
                value={form.unspscCode ?? ""}
                onChange={e => setForm(f => ({ ...f, unspscCode: e.target.value }))}
                className="border-mist"
                maxLength={8}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate uppercase tracking-wide mb-1.5 block">Precio unitario *</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.unitPrice}
                  onChange={e => setForm(f => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))}
                  className={`border-mist ${formErrors.unitPrice ? "border-coral" : ""}`}
                />
                {formErrors.unitPrice && <p className="text-xs text-coral mt-1">{formErrors.unitPrice}</p>}
              </div>
              <div>
                <Label className="text-xs text-slate uppercase tracking-wide mb-1.5 block">IVA %</Label>
                <Select value={String(form.taxRate)} onValueChange={v => setForm(f => ({ ...f, taxRate: Number(v) }))}>
                  <SelectTrigger className="border-mist"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="19">19%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={!!form.isService}
                  onCheckedChange={v => setForm(f => ({ ...f, isService: !!v }))}
                />
                <span className="text-sm text-ink">Es un servicio</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={!!form.isIvaExcluded}
                  onCheckedChange={v => setForm(f => ({ ...f, isIvaExcluded: !!v }))}
                />
                <span className="text-sm text-ink">IVA excluido</span>
              </label>
              {editing && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={form.isActive !== false}
                    onCheckedChange={v => setForm(f => ({ ...f, isActive: !!v }))}
                  />
                  <span className="text-sm text-ink">Activo</span>
                </label>
              )}
            </div>

            {formErrors.submit && (
              <p className="text-sm text-coral">{formErrors.submit}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="border-mist" onClick={() => setFormOpen(false)}>Cancelar</Button>
              <Button className="bg-emerald hover:bg-emerald/90 text-white" onClick={saveProduct} disabled={saving}>
                {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear producto"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CSV import dialog */}
      <Dialog open={csvOpen} onOpenChange={v => { if (!csvLoading) setCsvOpen(v) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Importar productos desde CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed border-mist bg-cloud/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink text-sm">Formato del archivo CSV</p>
                <a
                  href="/samples/perfumes-muestra.csv"
                  download
                  className="flex items-center gap-1 text-xs text-emerald hover:underline"
                >
                  <Download className="h-3 w-3" />
                  Descargar plantilla de ejemplo
                </a>
              </div>
              <p className="text-xs text-slate/70">La primera fila es el encabezado y se omite automáticamente. Las columnas marcadas con <span className="text-coral font-semibold">*</span> son obligatorias.</p>
              <div className="space-y-1.5 text-xs">
                {[
                  { col: "internalCode",  tipo: "Texto",   req: true,  desc: "Código único del producto en tu empresa", ej: "PERF-001" },
                  { col: "description",   tipo: "Texto",   req: true,  desc: "Nombre o descripción del producto/servicio", ej: "Chanel No. 5 EDP 100ml" },
                  { col: "unspscCode",    tipo: "Texto",   req: false, desc: "Código UNSPSC de clasificación (8 dígitos)", ej: "53131600" },
                  { col: "unit",          tipo: "Texto",   req: false, desc: "Unidad de medida. Default: UND. Opciones: UND, KG, LT, MT, HRS, MES, SRV", ej: "UND" },
                  { col: "unitPrice",     tipo: "Número",  req: true,  desc: "Precio unitario en COP sin puntos ni comas", ej: "350000" },
                  { col: "taxRate",       tipo: "Número",  req: false, desc: "Porcentaje de IVA. Default: 19. Opciones: 0, 5, 19", ej: "19" },
                  { col: "isService",     tipo: "Boolean", req: false, desc: "true si es un servicio, false si es un bien físico. Default: false", ej: "false" },
                ].map(({ col, tipo, req, desc, ej }) => (
                  <div key={col} className="grid grid-cols-[120px_1fr] gap-x-3 items-start py-1 border-b border-mist/40 last:border-0">
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="font-mono text-ink">{col}</span>
                      {req && <span className="text-coral font-semibold">*</span>}
                    </div>
                    <div>
                      <span className="text-slate/60 mr-1.5">[{tipo}]</span>
                      <span className="text-slate">{desc}</span>
                      <span className="ml-1.5 font-mono text-slate/50">ej: {ej}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-1">
                <p className="text-xs text-slate/60 mb-1">Ejemplo de fila completa:</p>
                <p className="font-mono text-xs text-ink bg-white/60 rounded px-2 py-1 break-all">
                  PERF-001,Chanel No. 5 EDP 100ml,53131600,UND,350000,19,false
                </p>
              </div>
            </div>

            <div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={e => { setCsvFile(e.target.files?.[0] ?? null); setCsvResult(null) }}
              />
              <Button variant="outline" className="w-full border-mist border-dashed" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                {csvFile ? csvFile.name : "Seleccionar archivo .csv"}
              </Button>
            </div>

            {csvResult && (
              <div className={`rounded-lg p-3 text-sm space-y-1 ${csvResult.errors.length > 0 ? "bg-gold/10 border border-gold/30" : "bg-emerald/10 border border-emerald/30"}`}>
                <p className="font-medium text-ink">Resultado de importación:</p>
                <p className="text-emerald">✓ {csvResult.imported} productos importados</p>
                {csvResult.skipped > 0 && <p className="text-slate">{csvResult.skipped} filas omitidas</p>}
                {csvResult.errors.map((e, i) => (
                  <p key={i} className="text-coral text-xs">• {e}</p>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" className="border-mist" onClick={() => setCsvOpen(false)} disabled={csvLoading}>Cerrar</Button>
              <Button
                className="bg-emerald hover:bg-emerald/90 text-white"
                onClick={importCsv}
                disabled={!csvFile || csvLoading}
              >
                {csvLoading ? "Importando…" : "Importar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
