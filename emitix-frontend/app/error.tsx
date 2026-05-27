"use client"

import { useEffect } from "react"
import { AlertOctagon, RotateCcw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Fatal Application Error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="max-w-md space-y-6 bg-white p-8 rounded-xl shadow-lg border border-border">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
          <AlertOctagon className="h-10 w-10" />
        </div>
        
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-slate-900 font-sans">Algo salió mal</h1>
          <p className="text-sm text-slate-500 font-sans">
            Ocurrió un error inesperado al cargar la aplicación. Si el problema persiste, contacte al administrador.
          </p>
          <pre className="text-xs bg-slate-50 p-3 rounded text-left overflow-auto max-h-32 text-rose-600 border border-slate-200 font-mono">
            {error.message || "Error desconocido"}
          </pre>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button onClick={reset} variant="outline" className="gap-2 border-slate-200 hover:bg-slate-50 font-sans">
            <RotateCcw className="h-4 w-4" /> Reintentar
          </Button>
          <Button onClick={() => window.location.href = "/dashboard"} className="gap-2 bg-emerald hover:bg-emerald/90 text-white font-sans">
            <Home className="h-4 w-4" /> Ir al Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
