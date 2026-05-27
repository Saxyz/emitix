"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  X,
  Check,
  Search,
  Plus,
  Trash2,
  GripVertical,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  Save,
  FileText,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Eye,
  Send,
  Hash,
  Shield,
  QrCode,
  FileCode,
  User,
  CreditCard,
  Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { useAuth } from "@/hooks/useAuth"
import { buyersApi } from "@/lib/api/buyers"
import { productsApi } from "@/lib/api/products"
import { invoicesApi } from "@/lib/api/invoices"
import { companyApi } from "@/lib/api/company"
import type { ProductResponse, PaymentMethod, InvoiceType, CompanyResponse } from "@/lib/api/types"

// ── Local types ───────────────────────────────────────────────────────────────

interface LineItem {
  localId: number          // client-side unique key
  productId?: string       // real product UUID if from catalog
  description: string
  unspscCode: string
  quantity: number
  unitPrice: number
  taxRate: number
  subtotal: number         // quantity * unitPrice (without tax)
}

interface BuyerData {
  type: "empresa" | "persona" | "consumidor_final"
  razonSocial: string
  tipoDocumento: string
  numeroDocumento: string
  email: string
  telefono: string
  direccion: string
  ciudad: string
}

interface PaymentData {
  metodoPago: string       // contado | credito
  medioPago: string        // efectivo | transferencia | tarjeta_credito | …
  fechaVencimiento: string
}

type StepId = 1 | 2 | 3 | 4 | 5

// ── Helpers ───────────────────────────────────────────────────────────────────

const documentTypeOptions = [
  { value: "factura_venta",     label: "Factura de Venta Nacional",  invoiceType: "SALE" as InvoiceType },
  { value: "factura_exportacion", label: "Factura de Exportación",   invoiceType: "SALE" as InvoiceType },
  { value: "nota_credito",      label: "Nota Crédito",               invoiceType: "CREDIT_NOTE" as InvoiceType },
  { value: "nota_debito",       label: "Nota Débito",                invoiceType: "DEBIT_NOTE" as InvoiceType },
]

const paymentMethods = [
  { value: "contado", label: "Contado" },
  { value: "credito", label: "Crédito" },
]

const paymentMediums = [
  { value: "efectivo",      label: "Efectivo",                 apiValue: "CASH" as PaymentMethod },
  { value: "transferencia", label: "Transferencia Bancaria",   apiValue: "TRANSFER" as PaymentMethod },
  { value: "tarjeta",       label: "Tarjeta",                  apiValue: "CARD" as PaymentMethod },
]

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n)

// ── Component ─────────────────────────────────────────────────────────────────

export default function NewInvoicePage() {
  const router    = useRouter()
  const { companyId } = useAuth()

  const [company, setCompany] = useState<CompanyResponse | null>(null)

  useEffect(() => {
    if (companyId) {
      companyApi.get().then(setCompany).catch(() => {})
    }
  }, [companyId])

  // Step state
  const [currentStep, setCurrentStep]   = useState<StepId>(1)
  const [documentType, setDocumentType] = useState("factura_venta")
  const [errors, setErrors]             = useState<Record<string, string>>({})

  // Buyer state
  const [buyerData, setBuyerData] = useState<BuyerData>({
    type: "empresa",
    razonSocial: "",
    tipoDocumento: "NIT",
    numeroDocumento: "",
    email: "",
    telefono: "",
    direccion: "",
    ciudad: "",
  })
  const [foundBuyerId, setFoundBuyerId]     = useState<string | null>(null)
  const [isVerifyingNit, setIsVerifyingNit] = useState(false)
  const [nitVerified, setNitVerified]       = useState(false)

  // Products state
  const [items, setItems]               = useState<LineItem[]>([])
  const [searchQuery, setSearchQuery]   = useState("")
  const [searchResults, setSearchResults] = useState<ProductResponse[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [notes, setNotes]               = useState("")

  // Payment state
  const [paymentData, setPaymentData] = useState<PaymentData>({
    metodoPago: "contado",
    medioPago:  "transferencia",
    fechaVencimiento: "",
  })

  // Emission dialog state
  const [showPreview, setShowPreview]           = useState(false)
  const [isEmitting, setIsEmitting]             = useState(false)
  const [emissionStep, setEmissionStep]         = useState(0)
  const [emissionComplete, setEmissionComplete] = useState(false)
  const [emissionError, setEmissionError]       = useState<string | null>(null)
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null)
  const [generatedRef, setGeneratedRef]         = useState<{ label: string; cufe: string } | null>(null)

  // Draft saving
  const [isSavingDraft, setIsSavingDraft] = useState(false)

  const steps = [
    { id: 1 as const, name: "TIPO",      icon: FileText },
    { id: 2 as const, name: "COMPRADOR", icon: User },
    { id: 3 as const, name: "PRODUCTOS", icon: Building2 },
    { id: 4 as const, name: "PAGO",      icon: CreditCard },
    { id: 5 as const, name: "REVISIÓN",  icon: CheckCircle },
  ]

  const emissionSteps = [
    { id: 1, name: "Validando datos del adquiriente…" },
    { id: 2, name: "Verificando resolución DIAN…" },
    { id: 3, name: "Generando XML UBL 2.1…",           icon: FileCode },
    { id: 4, name: "Calculando CUFE (SHA-384)…",        icon: Hash },
    { id: 5, name: "Aplicando firma digital XAdES-BES…",icon: Shield },
    { id: 6, name: "Generando código QR…",              icon: QrCode },
    { id: 7, name: "Enviando a WebService DIAN…",       icon: Send },
    { id: 8, name: "Procesando respuesta…",             icon: Loader2 },
  ]

  // Totals
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0)
  const iva      = items.reduce((s, i) => s + i.subtotal * (i.taxRate / 100), 0)
  const total    = subtotal + iva

  // ── Product search (debounced via useEffect) ────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim() || !companyId) {
      setSearchResults([])
      return
    }
    setSearchLoading(true)
    productsApi.getAll({ companyId, search: searchQuery, size: 8 })
      .then(res => setSearchResults(res.content))
      .catch(() => setSearchResults([]))
      .finally(() => setSearchLoading(false))
  }, [searchQuery, companyId])

  // ── Buyer verification ──────────────────────────────────────────────────────
  const verifyNit = async () => {
    if (!buyerData.numeroDocumento || !companyId) return
    setIsVerifyingNit(true)
    setNitVerified(false)
    setFoundBuyerId(null)
    try {
      const buyer = await buyersApi.verifyDocument(companyId, buyerData.numeroDocumento)
      setFoundBuyerId(buyer.id)
      setNitVerified(true)
      setBuyerData(prev => ({
        ...prev,
        razonSocial: buyer.fullName,
        email:       buyer.email    ?? prev.email,
        telefono:    buyer.phone    ?? prev.telefono,
        direccion:   buyer.address  ?? prev.direccion,
        ciudad:      buyer.city     ?? prev.ciudad,
      }))
    } catch {
      setErrors({ numeroDocumento: "Comprador no encontrado en el sistema — complete el formulario para registrarlo" })
    } finally {
      setIsVerifyingNit(false)
    }
  }

  // ── Line item helpers ───────────────────────────────────────────────────────
  const addItem = (product?: ProductResponse) => {
    const newItem: LineItem = product ? {
      localId:     Date.now(),
      productId:   product.id,
      description: product.description,
      unspscCode:  product.unspscCode ?? "",
      quantity:    1,
      unitPrice:   product.unitPrice,
      taxRate:     product.taxRate,
      subtotal:    product.unitPrice,
    } : {
      localId:     Date.now(),
      description: "",
      unspscCode:  "",
      quantity:    1,
      unitPrice:   0,
      taxRate:     19,
      subtotal:    0,
    }
    setItems(prev => [...prev, newItem])
    setSearchQuery("")
    setSearchResults([])
  }

  const updateItem = (localId: number, field: keyof LineItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.localId !== localId) return item
      const updated = { ...item, [field]: value }
      updated.subtotal = updated.quantity * updated.unitPrice
      return updated
    }))
  }

  const removeItem = (localId: number) => {
    setItems(prev => prev.filter(i => i.localId !== localId))
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateStep = (step: StepId): boolean => {
    const errs: Record<string, string> = {}
    if (step === 2 && buyerData.type !== "consumidor_final") {
      if (!buyerData.razonSocial)      errs.razonSocial      = "Razón social requerida"
      if (!buyerData.numeroDocumento)  errs.numeroDocumento  = "Número de documento requerido"
      if (!buyerData.email)            errs.email            = "Email requerido"
    }
    if (step === 3 && items.length === 0) errs.items = "Agregue al menos un producto o servicio"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) setCurrentStep(prev => Math.min(prev + 1, 5) as StepId)
  }
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1) as StepId)

  // ── Build API payload ───────────────────────────────────────────────────────
  const buildItems = () => items.map(i => ({
    productId:   i.productId,
    description: i.description,
    unspscCode:  i.unspscCode || undefined,
    unit:        "UND",
    quantity:    i.quantity,
    unitPrice:   i.unitPrice,
    taxRate:     i.taxRate,
  }))

  const resolvedPaymentMethod = (): PaymentMethod => {
    if (paymentData.metodoPago === "credito") return "CREDIT"
    return (paymentMediums.find(m => m.value === paymentData.medioPago)?.apiValue) ?? "CASH"
  }

  const resolvedInvoiceType = (): InvoiceType =>
    documentTypeOptions.find(d => d.value === documentType)?.invoiceType ?? "SALE"

  /** Ensures a buyer exists and returns its ID */
  const resolveOrCreateBuyer = async (): Promise<string> => {
    if (foundBuyerId) return foundBuyerId

    if (buyerData.type === "consumidor_final") {
      // Try to find or auto-create the generic consumidor final buyer
      try {
        const existing = await buyersApi.verifyDocument(companyId!, "222222222")
        return existing.id
      } catch {
        const created = await buyersApi.create({
          documentNumber:   "222222222",
          documentType:     "NIT",
          fullName:         "Consumidor Final",
          organizationType: "NATURAL",
          fiscalRegime:     "NRES",
        }, companyId!)
        return created.id
      }
    }

    // Create buyer from form
    const created = await buyersApi.create({
      documentNumber:   buyerData.numeroDocumento,
      documentType:     buyerData.tipoDocumento as any,
      fullName:         buyerData.razonSocial,
      organizationType: buyerData.type === "empresa" ? "JURIDICA" : "NATURAL",
      fiscalRegime:     "RES",
      email:            buyerData.email     || undefined,
      phone:            buyerData.telefono  || undefined,
      address:          buyerData.direccion || undefined,
      city:             buyerData.ciudad    || undefined,
    }, companyId!)
    setFoundBuyerId(created.id)
    return created.id
  }

  // ── Save as draft ───────────────────────────────────────────────────────────
  const saveDraft = async () => {
    if (items.length === 0) {
      setErrors({ items: "Agregue al menos un producto antes de guardar" })
      return
    }
    setIsSavingDraft(true)
    try {
      const buyerId = await resolveOrCreateBuyer()
      const invoice = await invoicesApi.create({
        buyerId,
        invoiceType:   resolvedInvoiceType(),
        paymentMethod: resolvedPaymentMethod(),
        dueDate:       paymentData.fechaVencimiento || undefined,
        notes:         notes || undefined,
        items:         buildItems(),
      })
      router.push(`/invoices/${invoice.id}`)
    } catch (err: any) {
      setErrors({ submit: err?.body?.message ?? "Error al guardar el borrador." })
    } finally {
      setIsSavingDraft(false)
    }
  }

  // ── Emit (create DRAFT → confirm) ───────────────────────────────────────────
  const startEmission = async () => {
    setShowPreview(true)
    setIsEmitting(true)
    setEmissionStep(1)
    setEmissionError(null)
    setEmissionComplete(false)

    try {
      // Step 1 — resolve buyer
      const buyerId = await resolveOrCreateBuyer()

      // Step 2 — create as DRAFT
      setEmissionStep(2)
      const draft = await invoicesApi.create({
        buyerId,
        invoiceType:   resolvedInvoiceType(),
        paymentMethod: resolvedPaymentMethod(),
        dueDate:       paymentData.fechaVencimiento || undefined,
        notes:         notes || undefined,
        items:         buildItems(),
      })

      // Steps 3-7 — animated progress (server-side processing)
      for (let s = 3; s <= 7; s++) {
        setEmissionStep(s)
        await new Promise(r => setTimeout(r, 650))
      }

      // Step 8 — confirm (sends to DIAN)
      setEmissionStep(8)
      const confirmed = await invoicesApi.confirm(draft.id)

      setCreatedInvoiceId(confirmed.id)
      setGeneratedRef({
        label: `${confirmed.prefix}-${confirmed.number}`,
        cufe:  confirmed.cufe ?? "",
      })
      setIsEmitting(false)
      setEmissionComplete(true)

    } catch (err: any) {
      setEmissionError(err?.body?.message ?? "Error al procesar la factura.")
      setIsEmitting(false)
    }
  }

  // ── Step content ─────────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {
      // ── Step 1: Tipo de documento ─────────────────────────────────────────
      case 1:
        return (
          <div className="space-y-6">
            {company && (
              <Card className="border-emerald/30 bg-emerald/5 shadow-sm">
                <CardContent className="pt-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald/10 rounded-lg">
                      <Shield className="h-5 w-5 text-emerald" />
                    </div>
                    <div>
                      <p className="text-xs text-emerald font-semibold uppercase tracking-wider">Empresa Emisora (Facturador)</p>
                      <h3 className="font-display font-bold text-ink text-lg mt-0.5">{company.legalName}</h3>
                      <p className="text-sm text-slate font-mono">NIT: {company.documentNumber} - Responsable de IVA</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald text-white hover:bg-emerald/90 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Verificado DIAN
                  </Badge>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display text-ink">Tipo de Documento Electrónico</CardTitle>
                <p className="text-sm text-slate">Seleccione el tipo de documento que desea generar</p>
              </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documentTypeOptions.map(type => (
                  <div
                    key={type.value}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      documentType === type.value ? "border-emerald bg-emerald/5" : "border-mist hover:border-slate"
                    }`}
                    onClick={() => setDocumentType(type.value)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        documentType === type.value ? "border-emerald" : "border-mist"
                      }`}>
                        {documentType === type.value && <div className="w-3 h-3 rounded-full bg-emerald" />}
                      </div>
                      <span className="font-medium text-ink">{type.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          </div>
        )

      // ── Step 2: Comprador ─────────────────────────────────────────────────
      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display text-ink">Datos del Adquiriente</CardTitle>
              <p className="text-sm text-slate">Ingrese la información del comprador o receptor de la factura</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Buyer type selector */}
              <div>
                <Label className="text-label-caps text-slate mb-3 block">TIPO DE ADQUIRIENTE</Label>
                <div className="flex gap-4">
                  {[
                    { value: "empresa",          label: "Empresa" },
                    { value: "persona",          label: "Persona Natural" },
                    { value: "consumidor_final", label: "Consumidor Final" },
                  ].map(t => (
                    <Button
                      key={t.value}
                      variant={buyerData.type === t.value ? "default" : "outline"}
                      className={buyerData.type === t.value ? "bg-ink hover:bg-ink/90" : "border-mist"}
                      onClick={() => {
                        setBuyerData(prev => ({ ...prev, type: t.value as BuyerData["type"] }))
                        setFoundBuyerId(null)
                        setNitVerified(false)
                      }}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>

              {buyerData.type === "consumidor_final" ? (
                <Alert className="bg-cloud border-mist">
                  <CheckCircle className="h-4 w-4 text-emerald" />
                  <AlertTitle>Consumidor Final</AlertTitle>
                  <AlertDescription>
                    Se asignará automáticamente el NIT genérico 222222222 para este documento.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label className="text-label-caps text-slate mb-2 block">RAZÓN SOCIAL / NOMBRES</Label>
                    <Input
                      placeholder="Nombre de la empresa o persona"
                      value={buyerData.razonSocial}
                      onChange={e => setBuyerData(prev => ({ ...prev, razonSocial: e.target.value }))}
                      className={`bg-white border-mist ${errors.razonSocial ? "border-coral" : ""}`}
                    />
                    {errors.razonSocial && <p className="text-xs text-coral mt-1">{errors.razonSocial}</p>}
                  </div>

                  <div>
                    <Label className="text-label-caps text-slate mb-2 block">TIPO DE DOCUMENTO</Label>
                    <Select
                      value={buyerData.tipoDocumento}
                      onValueChange={v => setBuyerData(prev => ({ ...prev, tipoDocumento: v }))}
                    >
                      <SelectTrigger className="bg-white border-mist"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NIT">NIT</SelectItem>
                        <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                        <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                        <SelectItem value="PA">Pasaporte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-label-caps text-slate mb-2 block">NÚMERO DE DOCUMENTO</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="900123456"
                        value={buyerData.numeroDocumento}
                        onChange={e => {
                          setBuyerData(prev => ({ ...prev, numeroDocumento: e.target.value }))
                          setNitVerified(false)
                          setFoundBuyerId(null)
                        }}
                        className={`bg-white border-mist flex-1 ${errors.numeroDocumento ? "border-coral" : ""}`}
                      />
                      <Button variant="outline" className="border-mist" onClick={verifyNit} disabled={isVerifyingNit}>
                        {isVerifyingNit ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : nitVerified ? (
                          <Check className="h-4 w-4 text-emerald" />
                        ) : (
                          "Verificar"
                        )}
                      </Button>
                    </div>
                    {errors.numeroDocumento && <p className="text-xs text-coral mt-1">{errors.numeroDocumento}</p>}
                    {nitVerified && (
                      <p className="text-xs text-emerald mt-1 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Comprador verificado
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-label-caps text-slate mb-2 block">CORREO ELECTRÓNICO</Label>
                    <Input
                      type="email"
                      placeholder="facturacion@empresa.com"
                      value={buyerData.email}
                      onChange={e => setBuyerData(prev => ({ ...prev, email: e.target.value }))}
                      className={`bg-white border-mist ${errors.email ? "border-coral" : ""}`}
                    />
                    {errors.email && <p className="text-xs text-coral mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <Label className="text-label-caps text-slate mb-2 block">TELÉFONO</Label>
                    <Input
                      placeholder="300 123 4567"
                      value={buyerData.telefono}
                      onChange={e => setBuyerData(prev => ({ ...prev, telefono: e.target.value }))}
                      className="bg-white border-mist"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-label-caps text-slate mb-2 block">DIRECCIÓN</Label>
                    <Input
                      placeholder="Dirección fiscal"
                      value={buyerData.direccion}
                      onChange={e => setBuyerData(prev => ({ ...prev, direccion: e.target.value }))}
                      className="bg-white border-mist"
                    />
                  </div>

                  <div>
                    <Label className="text-label-caps text-slate mb-2 block">CIUDAD</Label>
                    <Input
                      placeholder="Ciudad"
                      value={buyerData.ciudad}
                      onChange={e => setBuyerData(prev => ({ ...prev, ciudad: e.target.value }))}
                      className="bg-white border-mist"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )

      // ── Step 3: Productos / servicios ─────────────────────────────────────
      case 3:
        return (
          <div className="space-y-6">
            {/* Search catalog */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-label-caps text-slate">BÚSQUEDA EN CATÁLOGO DE PRODUCTOS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
                    <Input
                      placeholder="Buscar por descripción o código…"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white border-mist"
                    />
                    {searchQuery && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-mist rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                        {searchLoading ? (
                          <div className="px-4 py-3 text-sm text-slate text-center">
                            <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />Buscando…
                          </div>
                        ) : searchResults.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-slate text-center">
                            No se encontraron productos en el catálogo
                          </div>
                        ) : (
                          searchResults.map(p => (
                            <div
                              key={p.id}
                              className="px-4 py-3 hover:bg-cloud cursor-pointer border-b border-border last:border-0"
                              onClick={() => addItem(p)}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-sm font-medium text-ink">{p.description}</p>
                                  {p.unspscCode && (
                                    <p className="text-xs text-slate font-mono">UNSPSC: {p.unspscCode}</p>
                                  )}
                                </div>
                                <span className="text-sm font-mono text-ink">{formatCOP(p.unitPrice)}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <Button className="bg-ink hover:bg-ink/90 text-white" onClick={() => addItem()}>
                    <Plus className="mr-2 h-4 w-4" /> Agregar línea
                  </Button>
                </div>
                {errors.items && <p className="text-xs text-coral mt-2">{errors.items}</p>}
              </CardContent>
            </Card>

            {/* Items table */}
            <Card>
              <CardContent className="pt-6">
                {items.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-mist mx-auto mb-4" />
                    <p className="text-slate">No hay productos agregados</p>
                    <p className="text-sm text-slate mt-1">Use la búsqueda arriba o haga clic en &quot;Agregar línea&quot;</p>
                  </div>
                ) : (
                  <>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="w-8" />
                          <th className="text-left py-3 px-2 text-label-caps text-slate font-medium">DESCRIPCIÓN</th>
                          <th className="text-center py-3 px-2 text-label-caps text-slate font-medium">CANT.</th>
                          <th className="text-right py-3 px-2 text-label-caps text-slate font-medium">V. UNIT.</th>
                          <th className="text-center py-3 px-2 text-label-caps text-slate font-medium">IVA %</th>
                          <th className="text-right py-3 px-2 text-label-caps text-slate font-medium">SUBTOTAL</th>
                          <th className="w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => (
                          <tr
                            key={item.localId}
                            className={`border-b border-border ${
                              idx === items.length - 1 ? "border-l-4 border-l-emerald bg-emerald/5" : ""
                            }`}
                          >
                            <td className="py-4 px-1">
                              <GripVertical className="h-4 w-4 text-slate cursor-grab" />
                            </td>
                            <td className="py-4 px-2">
                              <Input
                                value={item.description}
                                onChange={e => updateItem(item.localId, "description", e.target.value)}
                                className="bg-transparent border-0 p-0 h-auto text-sm text-ink focus-visible:ring-0"
                                placeholder="Descripción del producto o servicio"
                              />
                              <Input
                                value={item.unspscCode}
                                onChange={e => updateItem(item.localId, "unspscCode", e.target.value)}
                                className="bg-transparent border-0 p-0 h-auto text-xs text-slate font-mono mt-1 focus-visible:ring-0"
                                placeholder="UNSPSC: 00000000"
                              />
                            </td>
                            <td className="py-4 px-2">
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={e => updateItem(item.localId, "quantity", Number(e.target.value))}
                                className="w-16 text-center h-9 bg-white border-mist"
                              />
                            </td>
                            <td className="py-4 px-2">
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-slate">$</span>
                                <Input
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={e => updateItem(item.localId, "unitPrice", Number(e.target.value))}
                                  className="w-28 text-right h-9 bg-white border-mist font-mono"
                                />
                              </div>
                            </td>
                            <td className="py-4 px-2">
                              <Select
                                value={String(item.taxRate)}
                                onValueChange={v => updateItem(item.localId, "taxRate", Number(v))}
                              >
                                <SelectTrigger className="w-24 h-9 bg-white border-mist">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0">0%</SelectItem>
                                  <SelectItem value="5">5%</SelectItem>
                                  <SelectItem value="19">19%</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="py-4 px-2 text-right">
                              <span className="font-mono font-semibold text-ink">
                                {formatCOP(item.subtotal)}
                              </span>
                            </td>
                            <td className="py-4 px-2">
                              <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 text-slate hover:text-coral"
                                onClick={() => removeItem(item.localId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <span className="text-sm text-slate">
                        {items.length} línea{items.length !== 1 ? "s" : ""} agregada{items.length !== 1 ? "s" : ""}
                      </span>
                      <Badge variant="outline" className="font-mono text-slate border-mist">
                        <FileSpreadsheet className="mr-2 h-3 w-3" />
                        Importación Excel — próximamente
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-label-caps text-slate">NOTAS ADICIONALES (Opcional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Observaciones que aparecerán en el PDF de la factura…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="bg-white border-mist resize-none h-24"
                />
              </CardContent>
            </Card>
          </div>
        )

      // ── Step 4: Pago ──────────────────────────────────────────────────────
      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display text-ink">Condiciones de Pago</CardTitle>
              <p className="text-sm text-slate">Configure el método y medio de pago para esta factura</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-label-caps text-slate mb-3 block">MÉTODO DE PAGO</Label>
                  <RadioGroup
                    value={paymentData.metodoPago}
                    onValueChange={v => setPaymentData(prev => ({ ...prev, metodoPago: v }))}
                    className="space-y-3"
                  >
                    {paymentMethods.map(m => (
                      <div
                        key={m.value}
                        className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          paymentData.metodoPago === m.value ? "border-emerald bg-emerald/5" : "border-mist hover:border-slate"
                        }`}
                        onClick={() => setPaymentData(prev => ({ ...prev, metodoPago: m.value }))}
                      >
                        <RadioGroupItem value={m.value} id={m.value} />
                        <Label htmlFor={m.value} className="cursor-pointer">{m.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-label-caps text-slate mb-3 block">MEDIO DE PAGO</Label>
                  <Select
                    value={paymentData.medioPago}
                    onValueChange={v => setPaymentData(prev => ({ ...prev, medioPago: v }))}
                  >
                    <SelectTrigger className="bg-white border-mist">
                      <SelectValue placeholder="Seleccione medio de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMediums.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {paymentData.metodoPago === "credito" && (
                  <div>
                    <Label className="text-label-caps text-slate mb-2 block">FECHA DE VENCIMIENTO</Label>
                    <Input
                      type="date"
                      value={paymentData.fechaVencimiento}
                      onChange={e => setPaymentData(prev => ({ ...prev, fechaVencimiento: e.target.value }))}
                      className="bg-white border-mist"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )

      // ── Step 5: Revisión ──────────────────────────────────────────────────
      case 5:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display text-ink flex items-center gap-2">
                  <Eye className="h-5 w-5" /> Revisión Final
                </CardTitle>
                <p className="text-sm text-slate">Verifique la información antes de emitir el documento</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {company && (
                  <div className="p-4 rounded-lg bg-emerald/5 border border-emerald/20 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-emerald font-semibold uppercase tracking-wider">EMISOR (TU EMPRESA)</p>
                      <p className="font-semibold text-ink mt-0.5">{company.legalName}</p>
                      <p className="text-xs text-slate font-mono">NIT: {company.documentNumber}</p>
                    </div>
                    <Badge className="bg-emerald/10 text-emerald border-emerald/30">Activo</Badge>
                  </div>
                )}

                <div className="p-4 rounded-lg bg-cloud/50 border border-border">
                  <p className="text-label-caps text-slate mb-1">TIPO DE DOCUMENTO</p>
                  <p className="font-medium text-ink">
                    {documentTypeOptions.find(d => d.value === documentType)?.label}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-cloud/50 border border-border">
                  <p className="text-label-caps text-slate mb-2">ADQUIRIENTE</p>
                  {buyerData.type === "consumidor_final" ? (
                    <p className="font-medium text-ink">Consumidor Final (NIT: 222222222)</p>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-medium text-ink">{buyerData.razonSocial}</p>
                      <p className="text-sm text-slate">{buyerData.tipoDocumento}: {buyerData.numeroDocumento}</p>
                      {buyerData.email && <p className="text-sm text-slate">{buyerData.email}</p>}
                      {buyerData.direccion && (
                        <p className="text-sm text-slate">{buyerData.direccion}{buyerData.ciudad ? `, ${buyerData.ciudad}` : ""}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-lg bg-cloud/50 border border-border">
                  <p className="text-label-caps text-slate mb-2">PRODUCTOS ({items.length})</p>
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item.localId} className="flex justify-between text-sm">
                        <span className="text-ink">{item.quantity}× {item.description}</span>
                        <span className="font-mono text-ink">{formatCOP(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-cloud/50 border border-border">
                  <p className="text-label-caps text-slate mb-2">CONDICIONES DE PAGO</p>
                  <p className="text-sm text-ink">
                    {paymentMethods.find(m => m.value === paymentData.metodoPago)?.label} —{" "}
                    {paymentMediums.find(m => m.value === paymentData.medioPago)?.label}
                  </p>
                  {paymentData.fechaVencimiento && (
                    <p className="text-sm text-slate mt-1">Vence: {paymentData.fechaVencimiento}</p>
                  )}
                </div>

                {notes && (
                  <div className="p-4 rounded-lg bg-cloud/50 border border-border">
                    <p className="text-label-caps text-slate mb-2">NOTAS</p>
                    <p className="text-sm text-ink">{notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Alert className="bg-gold/10 border-gold">
              <AlertTriangle className="h-4 w-4 text-gold" />
              <AlertTitle>Confirmación requerida</AlertTitle>
              <AlertDescription>
                Al emitir este documento, se generará el XML, se calculará el CUFE,
                se aplicará la firma digital y se enviará a la DIAN para validación.
                Este proceso es irreversible.
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-2">
              <Checkbox id="confirm-check" />
              <Label htmlFor="confirm-check" className="text-sm text-ink">
                Confirmo que la información es correcta y autorizo la emisión del documento
              </Label>
            </div>

            {errors.submit && (
              <p className="text-sm text-coral">{errors.submit}</p>
            )}
          </div>
        )
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white px-6">
        <div className="flex items-center gap-6">
          <Link href="/invoices" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 80 80">
                <rect x="15" y="20" width="50" height="10" rx="5" fill="#00C880" />
                <rect x="15" y="35" width="35" height="9"  rx="4.5" fill="#F5A52A" />
                <rect x="15" y="49" width="50" height="10" rx="5" fill="white" />
              </svg>
            </div>
            <span className="font-display font-bold text-ink">EMITIX</span>
          </Link>
        </div>

        <div className="text-center">
          <h1 className="font-display text-xl font-bold text-ink">Nueva Factura de Venta</h1>
          <p className="text-sm text-slate">Complete los detalles para generar el documento electrónico.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-mist" onClick={saveDraft} disabled={isSavingDraft}>
            {isSavingDraft ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSavingDraft ? "Guardando…" : "Guardar Borrador"}
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/invoices">
              <X className="mr-2 h-4 w-4" /> Cancelar
            </Link>
          </Button>
        </div>
      </header>

      {/* Steps progress */}
      <div className="border-b border-border bg-white px-6 py-4">
        <div className="flex items-center justify-center">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div
                className="flex flex-col items-center cursor-pointer"
                onClick={() => { if (step.id < currentStep) setCurrentStep(step.id) }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step.id < currentStep  ? "bg-emerald text-white" :
                  step.id === currentStep ? "bg-emerald text-white ring-4 ring-emerald/20" :
                  "bg-mist text-slate"
                }`}>
                  {step.id < currentStep ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span className={`text-xs mt-2 font-medium ${step.id <= currentStep ? "text-emerald" : "text-slate"}`}>
                  {step.name}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-24 h-0.5 mx-2 ${step.id < currentStep ? "bg-emerald" : "bg-mist"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2">{renderStep()}</div>

          {/* Summary sidebar */}
          <div>
            <Card className="sticky top-32 bg-ink text-white">
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-xl font-bold">Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-white/70">Subtotal</span>
                  <span className="font-mono">{formatCOP(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">IVA</span>
                  <span className="font-mono">{formatCOP(iva)}</span>
                </div>
                <div className="border-t border-white/20 pt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-emerald font-medium">Total Neto</span>
                    <span className="font-mono text-2xl font-bold text-emerald">{formatCOP(total)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {currentStep > 1 ? (
                    <Button
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      onClick={prevStep}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                    </Button>
                  ) : <div />}

                  {currentStep < 5 ? (
                    <Button className="bg-emerald hover:bg-emerald/90 text-white col-start-2" onClick={nextStep}>
                      Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button className="bg-emerald hover:bg-emerald/90 text-white col-span-2" onClick={startEmission}>
                      <Send className="mr-2 h-4 w-4" /> Emitir Factura
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Emission dialog */}
      <Dialog open={showPreview} onOpenChange={open => { if (!isEmitting) setShowPreview(open) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Eye className="h-5 w-5" /> Proceso de Emisión
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Document preview skeleton */}
            <div className="bg-cloud/50 rounded-lg p-6 relative overflow-hidden">
              <div className="space-y-4">
                <div className="h-10 bg-ink/20 rounded w-1/2 mx-auto" />
                <div className="space-y-2">
                  <div className="h-4 bg-mist rounded w-full" />
                  <div className="h-4 bg-mist rounded w-3/4" />
                </div>
                <div className="pt-4 space-y-2">
                  <div className="h-3 bg-mist rounded" />
                  <div className="h-3 bg-mist rounded" />
                  <div className="h-3 bg-mist rounded" />
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl font-bold text-ink/5 rotate-[-30deg]">
                  {emissionComplete ? "EMITIDA" : "BORRADOR"}
                </span>
              </div>
            </div>

            {/* Process steps */}
            <div className="space-y-4">
              {emissionError && (
                <Alert className="bg-coral/10 border-coral">
                  <AlertTriangle className="h-4 w-4 text-coral" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{emissionError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                {emissionSteps.map((step, idx) => {
                  const isComplete = emissionStep > idx + 1
                  const isCurrent  = emissionStep === idx + 1
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                        isComplete ? "bg-emerald/10" : isCurrent ? "bg-ocean/10" : "bg-cloud/50"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isComplete ? "bg-emerald text-white" : isCurrent ? "bg-ocean text-white" : "bg-mist text-slate"
                      }`}>
                        {isComplete ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : isCurrent ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <span className="text-xs">{step.id}</span>
                        )}
                      </div>
                      <span className={`text-sm ${
                        isComplete ? "text-emerald font-medium" : isCurrent ? "text-ocean font-medium" : "text-slate"
                      }`}>
                        {step.name}
                      </span>
                    </div>
                  )
                })}
              </div>

              {emissionComplete && generatedRef && (
                <div className="mt-4 p-4 bg-emerald/10 rounded-lg border border-emerald/30">
                  <div className="flex items-center gap-2 text-emerald font-semibold mb-2">
                    <CheckCircle className="h-5 w-5" /> Factura Emitida Exitosamente
                  </div>
                  <p className="text-sm text-ink font-medium">{generatedRef.label}</p>
                  {generatedRef.cufe && (
                    <p className="text-xs text-slate mt-1 font-mono break-all leading-relaxed">
                      CUFE: {generatedRef.cufe}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {!emissionComplete ? (
                  <Button
                    variant="outline"
                    className="flex-1 border-mist"
                    onClick={() => setShowPreview(false)}
                    disabled={isEmitting}
                  >
                    Volver a Editar
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-emerald hover:bg-emerald/90 text-white"
                    onClick={() => router.push(`/invoices/${createdInvoiceId}`)}
                  >
                    Ver Factura <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
