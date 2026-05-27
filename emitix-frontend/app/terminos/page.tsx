import Link from "next/link"
import { ArrowLeft, Shield } from "lucide-react"

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-cloud">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <Link
            href="/register"
            className="p-2 hover:bg-mist rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate" />
          </Link>
          <div>
            <p className="text-xs font-mono text-slate uppercase tracking-widest mb-1">
              EMITIX
            </p>
            <h1 className="font-display text-3xl font-bold text-ink">
              Términos y Condiciones
            </h1>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-mist p-8 space-y-8 text-sm leading-relaxed text-foreground">
          <p className="text-slate">
            Última actualización: enero de 2025
          </p>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink">
              1. Aceptación de los términos
            </h2>
            <p>
              Al registrarte y utilizar EMITIX, aceptas estos Términos y Condiciones en su
              totalidad. Si no estás de acuerdo con alguna parte de estos términos, no podrás
              utilizar el servicio.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink">
              2. Descripción del servicio
            </h2>
            <p>
              EMITIX es una plataforma de facturación electrónica para MiPymes colombianas,
              diseñada para generar, firmar y transmitir facturas electrónicas en cumplimiento
              de las normativas de la DIAN (Dirección de Impuestos y Aduanas Nacionales).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink">
              3. Responsabilidades del usuario
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Proporcionar información veraz y actualizada sobre tu empresa y transacciones.
              </li>
              <li>
                Mantener la confidencialidad de tus credenciales de acceso.
              </li>
              <li>
                Cumplir con todas las obligaciones tributarias ante la DIAN y demás autoridades
                fiscales colombianas.
              </li>
              <li>
                No utilizar el servicio para fines fraudulentos o ilegales.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink">
              4. Limitación de responsabilidad
            </h2>
            <p>
              EMITIX actúa como facilitador tecnológico. La responsabilidad sobre el contenido
              de las facturas, la exactitud de los datos fiscales y el cumplimiento tributario
              recae exclusivamente en el usuario emisor. EMITIX no se hace responsable por
              errores derivados de información incorrecta suministrada por el usuario.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink">
              5. Propiedad intelectual
            </h2>
            <p>
              Todos los derechos sobre el software, diseño, marca y contenidos de EMITIX son
              propiedad de sus desarrolladores. Queda prohibida la reproducción total o parcial
              sin autorización expresa.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink">
              6. Modificaciones
            </h2>
            <p>
              Nos reservamos el derecho de modificar estos términos en cualquier momento.
              Los cambios entrarán en vigor al ser publicados en la plataforma. El uso
              continuado del servicio implica la aceptación de los nuevos términos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink">
              7. Ley aplicable
            </h2>
            <p>
              Estos términos se rigen por las leyes de la República de Colombia.
              Cualquier disputa se someterá a los tribunales competentes de la ciudad de
              Bogotá D.C.
            </p>
          </section>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-slate text-xs">
          <Shield className="h-3.5 w-3.5" />
          <span className="font-mono">EMITIX — Facturación Electrónica Colombia</span>
        </div>
      </div>
    </div>
  )
}
