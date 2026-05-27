"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Building2,
  User,
  FileText,
  CheckCircle2,
  ArrowLeft,
  CreditCard,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { authApi } from "@/lib/api/auth"
import { setToken } from "@/lib/api/client"
import { useGeography } from "@/hooks/useGeography"
import { useAuth } from "@/hooks/useAuth"

type TipoPersona = "JURIDICA" | "NATURAL" | ""
type TipoDocumento = "CC" | "CE" | "PA" | ""

interface FormData {
  // Step 1 — Empresa
  tipoPersona: TipoPersona
  legalName: string
  // JURIDICA
  nit: string
  dv: string
  // NATURAL
  tipoDocumento: TipoDocumento
  numDocumento: string
  // Geografía (opcionales)
  departamento: string
  ciudad: string
  // Step 2 — Administrador
  nombreAdmin: string
  apellidoAdmin: string
  emailAdmin: string
  password: string
  confirmPassword: string
}

export default function RegisterPage() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [createdUsername, setCreatedUsername] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null)

  const { departments, cities, loadingDepts, loadingCities, loadCities } = useGeography()

  const [formData, setFormData] = useState<FormData>({
    tipoPersona: "",
    legalName: "",
    nit: "",
    dv: "",
    tipoDocumento: "",
    numDocumento: "",
    departamento: "",
    ciudad: "",
    nombreAdmin: "",
    apellidoAdmin: "",
    emailAdmin: "",
    password: "",
    confirmPassword: "",
  })

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleDepartmentChange = (deptName: string) => {
    const dept = departments.find((d) => d.name === deptName)
    updateField("departamento", deptName)
    updateField("ciudad", "")
    setSelectedDeptId(dept?.id ?? null)
    loadCities(dept?.id ?? null)
  }

  const canProceed = (): boolean => {
    if (step === 1) {
      if (!formData.tipoPersona || !formData.legalName) return false
      if (formData.tipoPersona === "JURIDICA") return !!formData.nit
      if (formData.tipoPersona === "NATURAL") return !!formData.tipoDocumento && !!formData.numDocumento
    }
    if (step === 2) {
      return (
        !!formData.nombreAdmin &&
        !!formData.emailAdmin &&
        formData.password.length >= 6 &&
        formData.password === formData.confirmPassword &&
        acceptTerms
      )
    }
    return false
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (step === 1) {
      setStep(2)
      return
    }

    // Step 2 — submit
    setIsSubmitting(true)
    try {
      const companyNit =
        formData.tipoPersona === "JURIDICA"
          ? formData.nit + (formData.dv ? `-${formData.dv}` : "")
          : formData.numDocumento

      const documentType =
        formData.tipoPersona === "JURIDICA" ? "NIT" : formData.tipoDocumento || undefined

      const username = formData.emailAdmin.split("@")[0].slice(0, 50)
      const fullName = `${formData.nombreAdmin} ${formData.apellidoAdmin}`.trim()

      const res = await authApi.register({
        username,
        password: formData.password,
        email: formData.emailAdmin,
        fullName,
        companyDocumentNumber: companyNit,
        companyLegalName: formData.legalName,
        organizationType: formData.tipoPersona || undefined,
        documentType,
      })

      // Auto-login: guardar token, cookie y cargar datos del usuario en AuthContext
      setToken(res.token)
      document.cookie = "emitix_session=1; path=/; SameSite=Lax"
      setCreatedUsername(res.username)
      await refresh()
      setIsComplete(true)
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al crear la cuenta. Intenta de nuevo."
      setErrorMsg(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-cloud flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardContent className="pt-10 pb-8 px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-emerald" />
            </div>
            <h1 className="font-display text-2xl font-bold text-ink mb-3">
              ¡Cuenta creada!
            </h1>
            <p className="text-slate mb-4">
              Tu empresa y usuario administrador han sido registrados exitosamente.
            </p>
            <div className="bg-cloud border border-mist rounded-lg p-4 mb-4 text-left">
              <p className="text-xs text-slate mb-1">Tu usuario para iniciar sesión:</p>
              <p className="font-mono font-semibold text-ink text-sm">{createdUsername}</p>
            </div>
            <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-gold font-medium">
                Importante: configura tu Certificado Digital DIAN y resolución de
                numeración antes de emitir facturas.
              </p>
            </div>
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full h-12 bg-ink hover:bg-ink/90 text-white"
            >
              Ir al Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cloud flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg border-0">
        <CardContent className="pt-8 pb-8 px-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/"
              className="p-2 hover:bg-mist rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-slate" />
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">
                Crear Cuenta
              </h1>
              <p className="text-slate text-sm">
                Configura tu cuenta de facturación electrónica
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="relative flex items-center justify-between mb-8 px-1">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-mist rounded-full" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald rounded-full transition-all duration-500 ease-in-out"
              style={{ width: step === 2 ? "100%" : "0%" }}
            />
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium z-10 transition-all duration-500 ease-in-out
                  ${s < step ? "bg-emerald text-white" : s === step ? "bg-ink text-white" : "bg-mist text-slate"}
                `}
              >
                {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
              </div>
            ))}
          </div>

          {/* Step Labels */}
          <div className="flex justify-between mb-6 px-1">
            <span className={`text-xs ${step === 1 ? "text-ink font-medium" : "text-slate"}`}>
              Empresa
            </span>
            <span className={`text-xs ${step === 2 ? "text-ink font-medium" : "text-slate"}`}>
              Administrador
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ── Step 1: Datos de la empresa ── */}
            {step === 1 && (
              <>
                {/* Tipo de persona */}
                <div className="space-y-2">
                  <label className="text-label-caps text-slate">TIPO DE PERSONA</label>
                  <Select
                    value={formData.tipoPersona}
                    onValueChange={(v) => {
                      updateField("tipoPersona", v as TipoPersona)
                      updateField("nit", "")
                      updateField("dv", "")
                      updateField("tipoDocumento", "")
                      updateField("numDocumento", "")
                    }}
                  >
                    <SelectTrigger className="h-11 bg-white border-mist">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="JURIDICA">Persona Jurídica</SelectItem>
                      <SelectItem value="NATURAL">Persona Natural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Nombre de la empresa */}
                <div className="space-y-2">
                  <label className="text-label-caps text-slate">
                    {formData.tipoPersona === "NATURAL" ? "NOMBRE COMERCIAL" : "RAZÓN SOCIAL"}
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
                    <Input
                      type="text"
                      placeholder={
                        formData.tipoPersona === "NATURAL"
                          ? "Tu Nombre o Nombre del Negocio"
                          : "Mi Empresa S.A.S."
                      }
                      value={formData.legalName}
                      onChange={(e) => updateField("legalName", e.target.value)}
                      className="pl-10 h-11 bg-white border-mist focus:border-ink focus:ring-ink"
                    />
                  </div>
                </div>

                {/* Campos condicionales por tipo de persona */}
                {formData.tipoPersona === "JURIDICA" && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-2">
                      <label className="text-label-caps text-slate">NIT</label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
                        <Input
                          type="text"
                          placeholder="900.123.456"
                          value={formData.nit}
                          onChange={(e) => updateField("nit", e.target.value)}
                          className="pl-10 h-11 bg-white border-mist focus:border-ink focus:ring-ink"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-label-caps text-slate">DV</label>
                      <Input
                        type="text"
                        placeholder="7"
                        maxLength={1}
                        value={formData.dv}
                        onChange={(e) => updateField("dv", e.target.value)}
                        className="h-11 bg-white border-mist focus:border-ink focus:ring-ink text-center"
                      />
                    </div>
                  </div>
                )}

                {formData.tipoPersona === "NATURAL" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-label-caps text-slate">TIPO DE DOCUMENTO</label>
                      <Select
                        value={formData.tipoDocumento}
                        onValueChange={(v) => updateField("tipoDocumento", v as TipoDocumento)}
                      >
                        <SelectTrigger className="h-11 bg-white border-mist">
                          <SelectValue placeholder="Tipo..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                          <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                          <SelectItem value="PA">Pasaporte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-label-caps text-slate">NÚMERO</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
                        <Input
                          type="text"
                          placeholder="1234567890"
                          value={formData.numDocumento}
                          onChange={(e) => updateField("numDocumento", e.target.value)}
                          className="pl-10 h-11 bg-white border-mist focus:border-ink focus:ring-ink"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Departamento y Ciudad */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-label-caps text-slate">
                      DEPARTAMENTO <span className="text-slate/50 normal-case font-normal">(opcional)</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate z-10 pointer-events-none" />
                      <Select
                        value={formData.departamento}
                        onValueChange={handleDepartmentChange}
                        disabled={loadingDepts}
                      >
                        <SelectTrigger className="h-11 bg-white border-mist pl-9">
                          <SelectValue placeholder={loadingDepts ? "Cargando..." : "Seleccionar..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((d) => (
                            <SelectItem key={d.id} value={d.name}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-label-caps text-slate">
                      CIUDAD <span className="text-slate/50 normal-case font-normal">(opcional)</span>
                    </label>
                    <Select
                      value={formData.ciudad}
                      onValueChange={(v) => updateField("ciudad", v)}
                      disabled={!formData.departamento || loadingCities}
                    >
                      <SelectTrigger className="h-11 bg-white border-mist">
                        <SelectValue
                          placeholder={
                            !formData.departamento
                              ? "Elige departamento"
                              : loadingCities
                              ? "Cargando..."
                              : "Seleccionar..."
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((c) => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* ── Step 2: Administrador ── */}
            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-label-caps text-slate">NOMBRE</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
                      <Input
                        type="text"
                        placeholder="Juan"
                        value={formData.nombreAdmin}
                        onChange={(e) => updateField("nombreAdmin", e.target.value)}
                        className="pl-10 h-11 bg-white border-mist focus:border-ink focus:ring-ink"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-label-caps text-slate">APELLIDO</label>
                    <Input
                      type="text"
                      placeholder="Pérez"
                      value={formData.apellidoAdmin}
                      onChange={(e) => updateField("apellidoAdmin", e.target.value)}
                      className="h-11 bg-white border-mist focus:border-ink focus:ring-ink"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-label-caps text-slate">CORREO DEL ADMINISTRADOR</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
                    <Input
                      type="email"
                      placeholder="admin@miempresa.com"
                      value={formData.emailAdmin}
                      onChange={(e) => updateField("emailAdmin", e.target.value)}
                      className="pl-10 h-11 bg-white border-mist focus:border-ink focus:ring-ink"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-label-caps text-slate">CONTRASEÑA</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      className="pl-10 pr-10 h-11 bg-white border-mist focus:border-ink focus:ring-ink"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-ink"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-label-caps text-slate">CONFIRMAR CONTRASEÑA</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repetir contraseña"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField("confirmPassword", e.target.value)}
                      className="pl-10 pr-10 h-11 bg-white border-mist focus:border-ink focus:ring-ink"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-ink"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-coral">Las contraseñas no coinciden</p>
                  )}
                </div>

                <div className="flex items-start gap-3 p-3 bg-cloud rounded-lg border border-mist">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                    className="mt-0.5 border-slate data-[state=checked]:bg-ink data-[state=checked]:border-ink"
                  />
                  <label htmlFor="terms" className="text-sm text-foreground leading-relaxed">
                    Acepto los{" "}
                    <Link
                      href="/terminos"
                      target="_blank"
                      className="text-emerald hover:underline"
                    >
                      Términos y Condiciones
                    </Link>{" "}
                    y la{" "}
                    <Link
                      href="/privacidad"
                      target="_blank"
                      className="text-emerald hover:underline"
                    >
                      Política de Privacidad
                    </Link>{" "}
                    de EMITIX.
                  </label>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-coral/10 border border-coral/30 rounded-lg">
                    <p className="text-sm text-coral">{errorMsg}</p>
                  </div>
                )}
              </>
            )}

            {/* Botones de navegación */}
            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12 border-mist"
                >
                  Atrás
                </Button>
              )}
              <Button
                type="submit"
                disabled={!canProceed() || isSubmitting}
                className="flex-1 h-12 bg-ink hover:bg-ink/90 text-white font-medium"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Creando cuenta...
                  </>
                ) : step === 2 ? (
                  <>
                    Crear Cuenta
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-mist text-center">
            <p className="text-sm text-slate">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/" className="text-emerald hover:underline font-medium">
                Iniciar Sesión
              </Link>
            </p>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-slate text-xs">
            <Shield className="h-3.5 w-3.5" />
            <span className="font-mono">Conexión Segura DIAN</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
