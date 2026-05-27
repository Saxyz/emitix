"use client"

import { useEffect, useState, useRef } from "react"
import { Search, Plus, Pencil, UserX, Upload, Building2, AlertCircle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AppHeader } from "@/components/layout/app-header"
import { useAuth } from "@/hooks/useAuth"
import { useGeography } from "@/hooks/useGeography"
import { buyersApi } from "@/lib/api/buyers"
import type { BuyerResponse, BuyerRequest, CsvImportResult } from "@/lib/api/types"
import { Checkbox } from "@/components/ui/checkbox"
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const DOC_TYPES = ["NIT", "CC", "CE", "PA", "TI", "RC"] as const
const ORG_TYPES = [
  { value: "JURIDICA", label: "Persona Jurídica" },
  { value: "NATURAL",  label: "Persona Natural"  },
]
const FISCAL_REGIMES = [
  { value: "RES",  label: "Responsable de IVA" },
  { value: "NRES", label: "No Responsable de IVA" },
]

const EMPTY_FORM: BuyerRequest = {
  documentNumber: "",
  documentType: "NIT",
  fullName: "",
  organizationType: "JURIDICA",
  fiscalRegime: "RES",
  email: "",
  phone: "",
  address: "",
  city: "",
  department: "",
  postalCode: "",
  country: "CO",
}

export default function ClientsPage() {
  const { companyId } = useAuth()
  const { departments, cities, loadingDepts, loadingCities, loadCities } = useGeography()

  const [clients, setClients]     = useState<BuyerResponse[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [search, setSearch]       = useState("")
  const [page, setPage]           = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal]         = useState(0)

  // Form dialog
  const [formOpen, setFormOpen]   = useState(false)
  const [editing, setEditing]     = useState<BuyerResponse | null>(null)
  const [form, setForm]           = useState<BuyerRequest>(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // CSV import dialog
  const [csvOpen, setCsvOpen]     = useState(false)
  const [csvFile, setCsvFile]     = useState<File | null>(null)
  const [csvResult, setCsvResult] = useState<CsvImportResult | null>(null)
  const [csvLoading, setCsvLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const PAGE_SIZE = 15

  const fetchClients = (p = 0, q = search) => {
    if (!companyId) return
    setLoading(true)
    buyersApi.getAll({ companyId, search: q || undefined, page: p, size: PAGE_SIZE })
      .then(res => {
        setClients(res.content)
        setTotal(res.totalElements)
        setTotalPages(res.totalPages)
        setPage(p)
      })
      .catch(() => setError("Error al cargar los clientes."))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchClients(0) }, [companyId])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    loadCities(null)
    setFormOpen(true)
  }

  const openEdit = (b: BuyerResponse) => {
    setEditing(b)
    setForm({
      documentNumber:   b.documentNumber,
      documentType:     b.documentType,
      fullName:         b.fullName,
      organizationType: b.organizationType,
      fiscalRegime:     b.fiscalRegime ?? "RES",
      email:            b.email ?? "",
      phone:            b.phone ?? "",
      address:          b.address ?? "",
      city:             b.city ?? "",
      department:       b.department ?? "",
      postalCode:       b.postalCode ?? "",
      country:          b.country ?? "CO",
    })
    setFormErrors({})
    if (b.department) {
      const dept = departments.find(d => d.name === b.department)
      if (dept) loadCities(dept.id)
    }
    setFormOpen(true)
  }

  const handleDeptChange = (deptName: string) => {
    setForm(f => ({ ...f, department: deptName, city: "" }))
    const dept = departments.find(d => d.name === deptName)
    loadCities(dept?.id ?? null)
  }

  const validateEmail = (email: string) =>
    !email || EMAIL_RE.test(email)

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.documentNumber.trim()) errs.documentNumber = "Número de documento requerido"
    if (!form.fullName.trim())       errs.fullName = "Nombre / razón social requerido"
    if (form.email && !validateEmail(form.email)) errs.email = "Formato de email inválido"
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const saveClient = async () => {
    if (!companyId || !validateForm()) return
    setSaving(true)
    try {
      const body: BuyerRequest = {
        ...form,
        email:      form.email?.trim()      || undefined,
        phone:      form.phone?.trim()      || undefined,
        address:    form.address?.trim()    || undefined,
        city:       form.city?.trim()       || undefined,
        department: form.department?.trim() || undefined,
        postalCode: form.postalCode?.trim() || undefined,
        country:    form.country?.trim()    || "CO",
      }
      if (editing) {
        const updated = await buyersApi.update(editing.id, body)
        setClients(prev => prev.map(c => c.id === updated.id ? updated : c))
      } else {
        const created = await buyersApi.create(body, companyId)
        setClients(prev => [created, ...prev])
        setTotal(t => t + 1)
      }
      setFormOpen(false)
    } catch (e: any) {
      setFormErrors({ submit: e?.body?.message ?? "Error al guardar el cliente" })
    } finally {
      setSaving(false)
    }
  }

  const deleteClient = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar permanentemente "${name}"? Esta acción no se puede deshacer.\n\nSi tiene facturas asociadas, deberás desactivarlo desde Editar.`)) return
    try {
      await buyersApi.delete(id)
      setClients(prev => prev.filter(c => c.id !== id))
      setTotal(t => t - 1)
    } catch (e: any) {
      setError(e?.body?.message ?? "No se pudo eliminar el cliente.")
    }
  }

  const importCsv = async () => {
    if (!csvFile || !companyId) return
    setCsvLoading(true)
    setCsvResult(null)
    try {
      const result = await buyersApi.importCsv(csvFile, companyId)
      setCsvResult(result)
      fetchClients(0)
    } catch {
      setCsvResult({ imported: 0, skipped: 0, errors: ["Error al procesar el archivo CSV"] })
    } finally {
      setCsvLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchClients(0, search)
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Clientes" />

      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">Directorio de Clientes</h1>
            <p className="text-slate mt-1">Gestiona los compradores registrados en tu empresa.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-mist" onClick={() => { setCsvFile(null); setCsvResult(null); setCsvOpen(true) }}>
              <Upload className="mr-2 h-4 w-4" />
              Importar CSV
            </Button>
            <Button className="bg-emerald hover:bg-emerald/90 text-white" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo cliente
            </Button>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
            <Input
              placeholder="Buscar por nombre o documento…"
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

        {/* Clients table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-cloud/30">
                    <th className="text-left px-4 py-3 text-slate font-medium text-xs uppercase tracking-wide">Documento</th>
                    <th className="text-left px-4 py-3 text-slate font-medium text-xs uppercase tracking-wide">Nombre / Razón Social</th>
                    <th className="text-center px-4 py-3 text-slate font-medium text-xs uppercase tracking-wide">Tipo</th>
                    <th className="text-center px-4 py-3 text-slate font-medium text-xs uppercase tracking-wide">Régimen</th>
                    <th className="text-left px-4 py-3 text-slate font-medium text-xs uppercase tracking-wide">Ciudad</th>
                    <th className="text-left px-4 py-3 text-slate font-medium text-xs uppercase tracking-wide">Email</th>
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
                  ) : clients.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate">
                        <Building2 className="h-8 w-8 mx-auto mb-2 text-mist" />
                        <p>No hay clientes. Crea uno o importa un CSV.</p>
                      </td>
                    </tr>
                  ) : (
                    clients.map(c => (
                      <tr key={c.id} className="border-b border-border hover:bg-cloud/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate">
                          <span className="text-slate/60 mr-1">{c.documentType}</span>{c.documentNumber}
                        </td>
                        <td className="px-4 py-3 font-medium text-ink max-w-[200px] truncate">{c.fullName}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className={c.organizationType === "JURIDICA" ? "bg-ocean/10 text-ocean border-ocean/30" : "bg-gold/10 text-gold border-gold/30"}>
                            {c.organizationType === "JURIDICA" ? "Jurídica" : "Natural"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-slate">
                          {c.fiscalRegime === "RES" ? "Resp. IVA" : "No Resp."}
                        </td>
                        <td className="px-4 py-3 text-slate text-xs">{c.city ?? "—"}</td>
                        <td className="px-4 py-3 text-slate text-xs max-w-[160px] truncate">{c.email ?? "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className={c.isActive ? "bg-emerald/10 text-emerald border-emerald/30" : "bg-slate/10 text-slate border-slate/30"}>
                            {c.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-coral hover:text-coral hover:bg-coral/10" onClick={() => deleteClient(c.id, c.fullName)}>
                              <UserX className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-sm text-slate">{total} clientes</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-mist" disabled={page === 0} onClick={() => fetchClients(page - 1)}>Anterior</Button>
                  <span className="text-sm text-slate px-2 py-1">Pág. {page + 1} / {totalPages}</span>
                  <Button variant="outline" size="sm" className="border-mist" disabled={page >= totalPages - 1} onClick={() => fetchClients(page + 1)}>Siguiente</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Document */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate uppercase tracking-wide mb-1.5 block">Número de documento *</Label>
                <Input
                  placeholder="900123456-7"
                  value={form.documentNumber}
                  onChange={e => setForm(f => ({ ...f, documentNumber: e.target.value }))}
                  disabled={!!editing}
                  className={`border-mist ${formErrors.documentNumber ? "border-coral" : ""}`}
                />
                {formErrors.documentNumber && <p className="text-xs text-coral mt-1">{formErrors.documentNumber}</p>}
              </div>
              <div>
                <Label className="text-xs text-slate uppercase tracking-wide mb-1.5 block">Tipo de documento *</Label>
                <Select value={form.documentType} onValueChange={v => setForm(f => ({ ...f, documentType: v as BuyerRequest["documentType"] }))} disabled={!!editing}>
                  <SelectTrigger className="border-mist"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Full name */}
            <div>
              <Label className="text-xs text-slate uppercase tracking-wide mb-1.5 block">Nombre completo / Razón social *</Label>
              <Input
                placeholder="Acme S.A.S"
                value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                className={`border-mist ${formErrors.fullName ? "border-coral" : ""}`}
              />
              {formErrors.fullName && <p className="text-xs text-coral mt-1">{formErrors.fullName}</p>}
            </div>

            {/* Org type + fiscal regime */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate uppercase tracking-wide mb-1.5 block">Tipo de organización *</Label>
                <Select value={form.organizationType} onValueChange={v => setForm(f => ({ ...f, organizationType: v as BuyerRequest["organizationType"] }))}>
                  <SelectTrigger className="border-mist"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORG_TYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate uppercase tracking-wide mb-1.5 block">Régimen fiscal *</Label>
                <Select value={form.fiscalRegime ?? "RES"} onValueChange={v => setForm(f => ({ ...f, fiscalRegime: v as BuyerRequest["fiscalRegime"] }))}>
                  <SelectTrigger className="border-mist"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FISCAL_REGIMES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Email + phone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate uppercase tracking-wide mb-1.5 block">Email</Label>
                <Input
                  type="email"
                  placeholder="contacto@empresa.co"
                  value={form.email ?? ""}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  onBlur={e => {
                    if (e.target.value && !validateEmail(e.target.value))
                      setFormErrors(prev => ({ ...prev, email: "Formato de email inválido" }))
                    else
                      setFormErrors(prev => { const { email: _, ...rest } = prev; return rest })
                  }}
                  className={`border-mist ${formErrors.email ? "border-coral" : ""}`}
                />
                {formErrors.email && <p className="text-xs text-coral mt-1">{formErrors.email}</p>}
              </div>
              <div>
                <Label className="text-xs text-slate uppercase tracking-wide mb-1.5 block">Teléfono</Label>
                <Input
                  placeholder="6013456789"
                  value={form.phone ?? ""}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="border-mist"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <Label className="text-xs text-slate uppercase tracking-wide mb-1.5 block">Dirección</Label>
              <Input
                placeholder="Cra 7 # 32-16 Piso 2"
                value={form.address ?? ""}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="border-mist"
              />
            </div>

            {/* Department + city */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate uppercase tracking-wide mb-1.5 block">Departamento</Label>
                <Select
                  value={form.department ?? ""}
                  onValueChange={handleDeptChange}
                  disabled={loadingDepts}
                >
                  <SelectTrigger className="border-mist">
                    <SelectValue placeholder={loadingDepts ? "Cargando…" : "Seleccionar"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate uppercase tracking-wide mb-1.5 block">Ciudad</Label>
                <Select
                  value={form.city ?? ""}
                  onValueChange={v => setForm(f => ({ ...f, city: v }))}
                  disabled={!form.department || loadingCities}
                >
                  <SelectTrigger className="border-mist">
                    <SelectValue placeholder={
                      !form.department ? "Elige departamento primero"
                      : loadingCities ? "Cargando…"
                      : "Seleccionar"
                    } />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {cities.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editing && (
              <div className="flex items-center gap-2 pt-1 border-t border-mist">
                <Checkbox
                  id="isActive"
                  checked={form.isActive !== false}
                  onCheckedChange={v => setForm(f => ({ ...f, isActive: !!v }))}
                />
                <label htmlFor="isActive" className="text-sm text-ink cursor-pointer select-none">
                  Cliente activo — si se desactiva no podrá ser seleccionado en nuevas facturas
                </label>
              </div>
            )}

            {formErrors.submit && <p className="text-sm text-coral">{formErrors.submit}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="border-mist" onClick={() => setFormOpen(false)}>Cancelar</Button>
              <Button className="bg-emerald hover:bg-emerald/90 text-white" onClick={saveClient} disabled={saving}>
                {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear cliente"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CSV import dialog */}
      <Dialog open={csvOpen} onOpenChange={v => { if (!csvLoading) setCsvOpen(v) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Importar clientes desde CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed border-mist bg-cloud/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink text-sm">Formato del archivo CSV</p>
                <a
                  href="/samples/clientes-muestra.csv"
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
                  { col: "documentNumber",   tipo: "Texto",   req: true,  desc: "Número de documento. NIT con guión: 900123456-7", ej: "900100001-1" },
                  { col: "documentType",     tipo: "Texto",   req: true,  desc: "Tipo de documento: NIT, CC, CE, PA, TI, RC", ej: "NIT" },
                  { col: "fullName",         tipo: "Texto",   req: true,  desc: "Nombre completo o razón social", ej: "Joyería Orión S.A.S" },
                  { col: "organizationType", tipo: "Texto",   req: true,  desc: "JURIDICA o NATURAL", ej: "JURIDICA" },
                  { col: "fiscalRegime",     tipo: "Texto",   req: false, desc: "RES (Responsable IVA) o NRES. Default: RES", ej: "RES" },
                  { col: "email",            tipo: "Texto",   req: false, desc: "Email válido. Si el formato es inválido se omite sin fallar la fila", ej: "info@empresa.co" },
                  { col: "phone",            tipo: "Texto",   req: false, desc: "Teléfono (máx. 30 caracteres)", ej: "6013456789" },
                  { col: "address",          tipo: "Texto",   req: false, desc: "Dirección física (máx. 300 caracteres)", ej: "Cra 15 # 93-47 Of. 201" },
                  { col: "city",             tipo: "Texto",   req: false, desc: "Nombre de la ciudad", ej: "Bogotá" },
                  { col: "department",       tipo: "Texto",   req: false, desc: "Nombre del departamento", ej: "Cundinamarca" },
                  { col: "country",          tipo: "Texto",   req: false, desc: "Código de país ISO-2. Default: CO", ej: "CO" },
                ].map(({ col, tipo, req, desc, ej }) => (
                  <div key={col} className="grid grid-cols-[130px_1fr] gap-x-3 items-start py-1 border-b border-mist/40 last:border-0">
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
                  900100001-1,NIT,Joyería Orión S.A.S,JURIDICA,RES,info@joyeriaorion.co,6013456789,Cra 15 # 93-47,Bogotá,Cundinamarca,CO
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
                <p className="text-emerald">✓ {csvResult.imported} clientes importados</p>
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
