"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail, ArrowRight, Shield, ArrowLeft, CheckCircle2, KeyRound, Eye, EyeOff, Lock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { authApi } from "@/lib/api/auth"

type Step = "email" | "code" | "reset" | "success"

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState(0)

  const startResendTimer = () => {
    setResendTimer(60)
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await authApi.forgotPassword({ email })
      setStep("code")
      startResendTimer()
    } catch {
      // Anti-enumeración: el backend siempre devuelve 200 aunque el email no exista
      setStep("code")
      startResendTimer()
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) return
    // La verificación real ocurre al resetear; aquí solo avanzamos el flujo
    setStep("reset")
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) return
    setError(null)
    setIsLoading(true)
    try {
      await authApi.resetPassword({ email, otp: code, newPassword: password })
      setStep("success")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Código incorrecto o expirado. Intenta de nuevo."
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (resendTimer > 0) return
    setIsLoading(true)
    try {
      await authApi.forgotPassword({ email })
    } finally {
      setIsLoading(false)
      startResendTimer()
    }
  }

  return (
    <div className="min-h-screen bg-cloud flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardContent className="pt-8 pb-8 px-8">

          {/* Email Step */}
          {step === "email" && (
            <>
              <div className="flex items-center gap-4 mb-6">
                <Link href="/" className="p-2 hover:bg-mist rounded-lg transition-colors">
                  <ArrowLeft className="h-5 w-5 text-slate" />
                </Link>
                <div>
                  <h1 className="font-display text-2xl font-bold text-ink">Recuperar Contraseña</h1>
                  <p className="text-slate text-sm">Te enviaremos un código de verificación</p>
                </div>
              </div>
              <form onSubmit={handleSendCode} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-label-caps text-slate">CORREO ELECTRÓNICO</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
                    <Input
                      type="email"
                      placeholder="usuario@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 bg-white border-mist focus:border-ink focus:ring-ink"
                      required
                    />
                  </div>
                  <p className="text-xs text-slate">Ingresa el correo asociado a tu cuenta EMITIX</p>
                </div>
                <Button type="submit" disabled={!email || isLoading} className="w-full h-12 bg-ink hover:bg-ink/90 text-white font-medium">
                  {isLoading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Enviando...</>
                  ) : (
                    <>Enviar Código<ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </form>
              <div className="mt-6 pt-6 border-t border-mist text-center">
                <p className="text-sm text-slate">
                  ¿Recordaste tu contraseña?{" "}
                  <Link href="/" className="text-emerald hover:underline font-medium">Iniciar Sesión</Link>
                </p>
              </div>
            </>
          )}

          {/* Code Verification Step */}
          {step === "code" && (
            <>
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setStep("email")} className="p-2 hover:bg-mist rounded-lg transition-colors">
                  <ArrowLeft className="h-5 w-5 text-slate" />
                </button>
                <div>
                  <h1 className="font-display text-2xl font-bold text-ink">Verificar Código</h1>
                  <p className="text-slate text-sm">Ingresa el código enviado a tu correo</p>
                </div>
              </div>
              <div className="bg-emerald/10 border border-emerald/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-emerald">
                  Si el correo <strong>{email}</strong> está registrado, recibirás el código en los próximos minutos.
                </p>
              </div>
              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={code} onChange={setCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="w-12 h-14 text-xl border-mist" />
                      <InputOTPSlot index={1} className="w-12 h-14 text-xl border-mist" />
                      <InputOTPSlot index={2} className="w-12 h-14 text-xl border-mist" />
                      <InputOTPSlot index={3} className="w-12 h-14 text-xl border-mist" />
                      <InputOTPSlot index={4} className="w-12 h-14 text-xl border-mist" />
                      <InputOTPSlot index={5} className="w-12 h-14 text-xl border-mist" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button type="submit" disabled={code.length !== 6} className="w-full h-12 bg-ink hover:bg-ink/90 text-white font-medium">
                  Verificar Código<ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-sm text-slate">Reenviar código en <span className="font-mono text-ink">{resendTimer}s</span></p>
                  ) : (
                    <button type="button" onClick={handleResendCode} disabled={isLoading} className="text-sm text-emerald hover:underline font-medium">
                      Reenviar código
                    </button>
                  )}
                </div>
              </form>
            </>
          )}

          {/* Reset Password Step */}
          {step === "reset" && (
            <>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-2"><KeyRound className="h-5 w-5 text-emerald" /></div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-ink">Nueva Contraseña</h1>
                  <p className="text-slate text-sm">Crea una contraseña segura para tu cuenta</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-coral/10 border border-coral/30 text-coral text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-label-caps text-slate">NUEVA CONTRASEÑA</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11 bg-white border-mist focus:border-ink focus:ring-ink"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-ink">
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
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10 h-11 bg-white border-mist focus:border-ink focus:ring-ink"
                      required
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-ink">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-coral">Las contraseñas no coinciden</p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={!password || password !== confirmPassword || password.length < 6 || isLoading}
                  className="w-full h-12 bg-ink hover:bg-ink/90 text-white font-medium"
                >
                  {isLoading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Actualizando...</>
                  ) : (
                    <>Restablecer Contraseña<ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </form>
            </>
          )}

          {/* Success Step */}
          {step === "success" && (
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-emerald/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-emerald" />
              </div>
              <h1 className="font-display text-2xl font-bold text-ink mb-3">Contraseña Actualizada</h1>
              <p className="text-slate mb-6">
                Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
              </p>
              <Link href="/">
                <Button className="w-full h-12 bg-ink hover:bg-ink/90 text-white font-medium">
                  Ir al Inicio de Sesión<ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-mist">
            <div className="flex items-center justify-center gap-2 text-slate text-xs">
              <Shield className="h-3.5 w-3.5" />
              <span className="font-mono">Conexión Segura DIAN</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
