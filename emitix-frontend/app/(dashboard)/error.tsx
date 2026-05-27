"use client"

import { useEffect } from "react"
import { AlertCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard sub-page error:", error)
  }, [error])

  return (
    <div className="flex h-[80vh] flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-4 bg-white p-6 rounded-lg border border-border shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-500">
          <AlertCircle className="h-6 w-6" />
        </div>
        
        <div className="space-y-1">
          <h2 className="font-display text-lg font-bold text-slate-900 font-sans">Error al cargar la sección</h2>
          <p className="text-sm text-slate-500 font-sans">
            No se pudo cargar el contenido de esta sección. Intenta reintentar o navega a otra pestaña.
          </p>
          <pre className="text-xs bg-slate-50 p-3 rounded text-left overflow-auto max-h-24 text-amber-600 border border-slate-200 font-mono mt-2">
            {error.message || "Error desconocido"}
          </pre>
        </div>

        <div className="pt-2">
          <Button onClick={reset} size="sm" className="gap-2 bg-emerald hover:bg-emerald/90 text-white font-sans">
            <RotateCcw className="h-4.5 w-4.5" /> Reintentar sección
          </Button>
        </div>
      </div>
    </div>
  )
}
