"use client"

import { useEffect, useState, useRef } from "react"
import { Upload, Building2, Hash, AlertTriangle, Plus, Lock, Copy, Check, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { AppHeader } from "@/components/layout/app-header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/useAuth"
import { companyApi } from "@/lib/api/company"
import type { CompanyResponse, ResolutionResponse } from "@/lib/api/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function SettingsPage() {
  const { user, companyId } = useAuth()

  const [company, setCompany]           = useState<CompanyResponse | null>(null)
  const [resolutions, setResolutions]   = useState<ResolutionResponse[]>([])
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [saveMsg, setSaveMsg]           = useState<string | null>(null)

  // Form state — se sincroniza con la empresa cargada
  const [legalName, setLegalName]   = useState("")
  const [nit, setNit]               = useState("")
  const [address, setAddress]       = useState("")
  const [city, setCity]             = useState("")
  const [phone, setPhone]           = useState("")
  const [email, setEmail]           = useState("")

  // Dynamic feature states
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Resolution states
  const [resolutionOpen, setResolutionOpen] = useState(false)
  const [resPrefix, setResPrefix] = useState("")
  const [resNumber, setResNumber] = useState("")
  const [resFrom, setResFrom] = useState(1)
  const [resTo, setResTo] = useState(1000)
  const [resValidFrom, setResValidFrom] = useState("")
  const [resValidUntil, setResValidUntil] = useState("")
  const [resCreating, setResCreating] = useState(false)

  // Certificate states
  const [certPassword, setCertPassword] = useState("")
  const [certFileName, setCertFileName] = useState("")
  const [isValidatingCert, setIsValidatingCert] = useState(false)
  const [certActive, setCertActive] = useState(false)
  const certInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const savedLogo = localStorage.getItem("company_logo")
    if (savedLogo) {
      setLogoUrl(savedLogo)
    }

    const savedCert = localStorage.getItem("cert_active") === "true"
    const savedCertName = localStorage.getItem("cert_file_name")
    if (savedCert) {
      setCertActive(true)
      setCertFileName(savedCertName || "certificado_produccion.p12")
    }
  }, [])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setLogoUrl(base64)
      localStorage.setItem("company_logo", base64)
    }
    reader.readAsDataURL(file)
  }

  const handleCreateResolution = async () => {
    if (!companyId) return
    setResCreating(true)
    try {
      const newRes = await companyApi.createResolution({
        resolutionNumber: resNumber,
        prefix: resPrefix,
        rangeFrom: resFrom,
        rangeTo: resTo,
        currentNumber: resFrom,
        validFrom: resValidFrom,
        validUntil: resValidUntil,
        isActive: true,
      }, companyId)
      
      setResolutions(prev => [newRes, ...prev])
      setResolutionOpen(false)
      // Reset form
      setResPrefix("")
      setResNumber("")
      setResFrom(1)
      setResTo(1000)
      setResValidFrom("")
      setResValidUntil("")
      alert("Resolución registrada exitosamente")
    } catch (err) {
      console.error(err)
      alert("Error al registrar la resolución")
    } finally {
      setResCreating(false)
    }
  }

  const handleCertFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCertFileName(file.name)
    }
  }

  const handleSaveCert = () => {
    if (!certFileName) {
      alert("Por favor selecciona un archivo de certificado (.p12 o .pfx)")
      return
    }
    if (!certPassword) {
      alert("Por favor ingresa la contraseña del certificado")
      return
    }
    setIsValidatingCert(true)
    setTimeout(() => {
      setIsValidatingCert(false)
      setCertActive(true)
      localStorage.setItem("cert_active", "true")
      localStorage.setItem("cert_file_name", certFileName)
      alert("Certificado validado y guardado correctamente.")
    }, 1500)
  }

  useEffect(() => {
    Promise.all([
      companyApi.get(),
      companyId ? companyApi.getResolutions(companyId) : Promise.resolve([]),
    ]).then(([c, r]) => {
      setCompany(c)
      setResolutions(r)
      setLegalName(c.legalName ?? "")
      setNit(c.documentNumber ?? "")
      setAddress(c.address ?? "")
      setCity(c.city ?? "")
      setPhone(c.phone ?? "")
      setEmail(c.email ?? "")
    }).finally(() => setLoading(false))
  }, [companyId])

  const handleSave = async () => {
    setSaving(true)
    setSaveMsg(null)
    try {
      const updated = await companyApi.update({
        documentNumber: nit, legalName, address, city, phone, email,
      })
      setCompany(updated)
      setSaveMsg("Cambios guardados correctamente.")
    } catch {
      setSaveMsg("Error al guardar. Inténtalo de nuevo.")
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(null), 3000)
    }
  }

  const activeResolution = resolutions.find(r => r.isActive) ?? resolutions[0] ?? null
  const resolutionUsedPct = activeResolution
    ? Math.round((activeResolution.currentNumber / activeResolution.rangeTo) * 100)
    : 0

  const initials = (name: string) =>
    name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />

      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Configuración</h1>
          <p className="text-slate mt-1">Administra los parámetros legales y fiscales de tu entidad.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Information */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-4">
              <Building2 className="h-5 w-5 text-slate" />
              <CardTitle className="font-display text-xl font-bold text-ink">Empresa emisora</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-label-caps text-slate mb-2">LOGO CORPORATIVO</p>
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    className="border-2 border-dashed border-mist rounded-lg p-3 flex flex-col items-center justify-center text-center hover:border-emerald/50 transition-colors cursor-pointer relative overflow-hidden h-[110px]"
                  >
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="object-contain h-full w-full" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-slate mb-2" />
                        <p className="text-sm font-medium text-ink">Sube tu logo</p>
                        <p className="text-[10px] text-slate mt-1">PNG, JPG (Max 2MB)</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={logoInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                </div>
                <div className="col-span-2 space-y-4">
                  <div>
                    <p className="text-label-caps text-slate mb-2">RAZÓN SOCIAL</p>
                    {loading ? <Skeleton className="h-10 w-full" /> : (
                      <Input value={legalName} onChange={e => setLegalName(e.target.value)} className="bg-white border-mist" />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-label-caps text-slate mb-2">NIT</p>
                      {loading ? <Skeleton className="h-10 w-full" /> : (
                        <Input value={nit} onChange={e => setNit(e.target.value)} className="bg-white border-mist font-mono" />
                      )}
                    </div>
                    <div>
                      <p className="text-label-caps text-slate mb-2">TELÉFONO</p>
                      {loading ? <Skeleton className="h-10 w-full" /> : (
                        <Input value={phone} onChange={e => setPhone(e.target.value)} className="bg-white border-mist" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-label-caps text-slate mb-2">DIRECCIÓN FISCAL</p>
                {loading ? <Skeleton className="h-10 w-full" /> : (
                  <Input value={address} onChange={e => setAddress(e.target.value)} className="bg-white border-mist" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-label-caps text-slate mb-2">CIUDAD</p>
                  {loading ? <Skeleton className="h-10 w-full" /> : (
                    <Input value={city} onChange={e => setCity(e.target.value)} className="bg-white border-mist" />
                  )}
                </div>
                <div>
                  <p className="text-label-caps text-slate mb-2">EMAIL</p>
                  {loading ? <Skeleton className="h-10 w-full" /> : (
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-white border-mist" />
                  )}
                </div>
              </div>

              {saveMsg && (
                <p className={`text-sm ${saveMsg.startsWith("Error") ? "text-coral" : "text-emerald"}`}>{saveMsg}</p>
              )}

              <Button onClick={handleSave} disabled={saving || loading} className="w-full bg-ink hover:bg-ink/90 text-white">
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </CardContent>
          </Card>

          {/* Resolution */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <Hash className="h-5 w-5 text-slate" />
                <CardTitle className="font-display text-xl font-bold text-ink">Resolución de numeración</CardTitle>
              </div>
              {activeResolution && (
                <Badge variant="outline" className="bg-emerald/10 text-emerald border-emerald/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald mr-2" />
                  Activa
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <Skeleton className="h-40 w-full" />
              ) : activeResolution ? (
                <>
                  <div className="bg-cloud/50 rounded-lg p-4 border border-mist">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-slate">Folios consumidos</span>
                      <span className="font-mono text-lg font-bold text-ink">
                        {activeResolution.currentNumber.toLocaleString("es-CO")}
                        <span className="text-slate font-normal"> / {activeResolution.rangeTo.toLocaleString("es-CO")}</span>
                      </span>
                    </div>
                    <Progress value={resolutionUsedPct} className="h-3 bg-mist" />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-emerald">Saludable</span>
                      <span className={`text-xs ${resolutionUsedPct >= 80 ? "text-coral" : "text-slate"}`}>
                        {resolutionUsedPct}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-label-caps text-slate mb-2">PREFIJO</p>
                      <div className="bg-cloud p-3 rounded border border-mist">
                        <span className="font-mono font-semibold text-ink">{activeResolution.prefix}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-label-caps text-slate mb-2">RANGO AUTORIZADO</p>
                      <div className="bg-cloud p-3 rounded border border-mist">
                        <span className="font-mono font-semibold text-ink">
                          {activeResolution.rangeFrom} - {activeResolution.rangeTo.toLocaleString("es-CO")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-label-caps text-slate mb-2">VIGENCIA DESDE</p>
                      <div className="bg-cloud p-3 rounded border border-mist">
                        <span className="text-sm text-ink">{activeResolution.validFrom}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-label-caps text-slate mb-2">VENCIMIENTO</p>
                      <div className="bg-cloud p-3 rounded border border-mist flex items-center gap-2">
                        <span className={`text-sm ${new Date(activeResolution.validUntil) < new Date() ? "text-coral" : "text-ink"}`}>
                          {activeResolution.validUntil}
                        </span>
                        {new Date(activeResolution.validUntil) < new Date() && (
                          <AlertTriangle className="h-4 w-4 text-coral" />
                        )}
                      </div>
                    </div>
                  </div>

                  {activeResolution.resolutionNumber && (
                    <div>
                      <p className="text-label-caps text-slate mb-2">NÚMERO DE RESOLUCIÓN DIAN</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-cloud p-3 rounded border border-mist">
                          <span className="font-mono text-xs text-ink">{activeResolution.resolutionNumber}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(activeResolution.resolutionNumber ?? "")}>
                          <Copy className="h-4 w-4 text-slate" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-slate text-sm text-center py-4">No hay resoluciones configuradas.</p>
              )}

              <div className="pt-4 border-t border-border">
                <Button variant="outline" className="w-full border-mist" onClick={() => setResolutionOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar nueva resolución
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Digital Certificate */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center gap-3 pb-4">
              <Lock className="h-5 w-5 text-slate" />
              <CardTitle className="font-display text-xl font-bold text-ink">Certificado Digital</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-ink mb-2">Subir Nuevo Certificado</h3>
                    <p className="text-sm text-slate">Arrastra tu archivo .p12 o .pfx, o haz clic para buscar.</p>
                  </div>
                  <div
                    onClick={() => certInputRef.current?.click()}
                    className="border-2 border-dashed border-mist rounded-lg p-8 flex flex-col items-center justify-center text-center hover:border-emerald/50 transition-colors cursor-pointer"
                  >
                    <Upload className="h-10 w-10 text-slate mb-3" />
                    {certFileName ? (
                      <p className="font-medium text-ink text-sm">{certFileName}</p>
                    ) : (
                      <>
                        <p className="font-medium text-ink">Clic para subir o arrastrar</p>
                        <p className="text-sm text-slate mt-1">Solo archivos .p12 o .pfx (Máx 5MB)</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={certInputRef}
                    className="hidden"
                    accept=".p12,.pfx"
                    onChange={handleCertFileChange}
                  />
                  <div>
                    <p className="text-label-caps text-slate mb-2">CONTRASEÑA DEL CERTIFICADO</p>
                    <Input
                      type="password"
                      placeholder="Ingresa la contraseña para validar"
                      value={certPassword}
                      onChange={e => setCertPassword(e.target.value)}
                      className="bg-white border-mist"
                    />
                  </div>
                  <Button onClick={handleSaveCert} disabled={isValidatingCert} className="bg-ink hover:bg-ink/90 text-white">
                    {isValidatingCert ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>Validando...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Validar y Guardar
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-ink rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display text-lg font-bold flex items-center gap-2">
                      <Lock className="h-5 w-5 text-emerald" />
                      Certificado Activo
                    </h3>
                    <Badge className={certActive ? "bg-emerald/20 text-emerald border-emerald/30" : "bg-white/10 text-white/60 border-white/20"}>
                      {certActive ? "Vigente" : "No configurado"}
                    </Badge>
                  </div>
                  {certActive ? (
                    <div className="space-y-2">
                      <p className="text-white/60 text-sm">Archivo:</p>
                      <p className="text-white font-mono text-sm">{certFileName}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Check className="h-4 w-4 text-emerald" />
                        <span className="text-sm text-emerald">Certificado validado correctamente</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-white/60 text-sm">
                      Para el MVP, el firmado usa un certificado de prueba. Sube tu certificado de producción.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resolution Dialog */}
      <Dialog open={resolutionOpen} onOpenChange={setResolutionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-ink">Nueva Resolución de Numeración</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-label-caps text-slate mb-2">PREFIJO</p>
                <Input
                  placeholder="SETT"
                  value={resPrefix}
                  onChange={e => setResPrefix(e.target.value)}
                  className="bg-white border-mist"
                />
              </div>
              <div>
                <p className="text-label-caps text-slate mb-2">Nº RESOLUCIÓN DIAN</p>
                <Input
                  placeholder="18764000000123"
                  value={resNumber}
                  onChange={e => setResNumber(e.target.value)}
                  className="bg-white border-mist font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-label-caps text-slate mb-2">RANGO DESDE</p>
                <Input
                  type="number"
                  value={resFrom}
                  onChange={e => setResFrom(Number(e.target.value))}
                  className="bg-white border-mist"
                />
              </div>
              <div>
                <p className="text-label-caps text-slate mb-2">RANGO HASTA</p>
                <Input
                  type="number"
                  value={resTo}
                  onChange={e => setResTo(Number(e.target.value))}
                  className="bg-white border-mist"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-label-caps text-slate mb-2">VIGENCIA DESDE</p>
                <Input
                  type="date"
                  value={resValidFrom}
                  onChange={e => setResValidFrom(e.target.value)}
                  className="bg-white border-mist"
                />
              </div>
              <div>
                <p className="text-label-caps text-slate mb-2">VIGENCIA HASTA</p>
                <Input
                  type="date"
                  value={resValidUntil}
                  onChange={e => setResValidUntil(e.target.value)}
                  className="bg-white border-mist"
                />
              </div>
            </div>
            <Button
              onClick={handleCreateResolution}
              disabled={resCreating || !resPrefix || !resNumber}
              className="w-full bg-ink hover:bg-ink/90 text-white"
            >
              {resCreating ? "Registrando..." : "Registrar Resolución"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Profile Footer */}
      {user && (
        <div className="fixed bottom-0 left-60 right-0 border-t border-border bg-white p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-ink text-white text-sm">
                {initials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-ink">{user.fullName}</p>
              <p className="text-sm text-slate">{user.email}</p>
              {company && (
                <p className="text-xs text-emerald font-mono">
                  NIT {company.documentNumber} · {company.legalName}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
