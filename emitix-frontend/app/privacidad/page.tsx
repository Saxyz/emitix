import Link from "next/link"
import { ArrowLeft, Shield } from "lucide-react"

export default function PrivacidadPage() {
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
              Política de Privacidad
            </h1>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-mist p-8 space-y-8 text-sm leading-relaxed text-foreground">
          <p className="text-slate">
            Última actualización: enero de 2025
          </p>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink">
              1. Responsable del tratamiento
            </h2>
            <p>
              EMITIX es responsable del tratamiento de los datos personales recopilados a
              través de esta plataforma, en cumplimiento de la Ley 1581 de 2012 y el Decreto
              1377 de 2013 de la República de Colombia.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink">
              2. Datos que recopilamos
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Datos de empresa:</strong> razón social, NIT o número de documento,
                tipo de persona, dirección, ciudad, departamento, correo y teléfono.
              </li>
              <li>
                <strong>Datos del administrador:</strong> nombre, apellido, correo
                electrónico y contraseña (almacenada con cifrado BCrypt).
              </li>
              <li>
                <strong>Datos de facturación:</strong> información de compradores,
                productos, servicios y transacciones necesarias para la emisión de
                facturas electrónicas.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink">
              3. Finalidad del tratamiento
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Prestación del servicio de facturación electrónica.</li>
              <li>Cumplimiento de obligaciones legales ante la DIAN.</li>
              <li>Comunicaciones sobre el estado del servicio y actualizaciones.</li>
              <li>Mejora continua de la plataforma.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink">
              4. Compartición de datos
            </h2>
            <p>
              No vendemos ni cedemos tus datos a terceros. Los datos de facturas son
              transmitidos a la DIAN únicamente en el proceso de habilitación y
              validación de documentos electrónicos, según lo exige la normativa colombiana.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink">
              5. Seguridad
            </h2>
            <p>
              Implementamos medidas técnicas y organizativas para proteger tu información:
              cifrado de contraseñas con BCrypt, comunicaciones HTTPS, tokens JWT con
              expiración y lista negra de sesiones invalidadas.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink">
              6. Tus derechos
            </h2>
            <p>
              Como titular de datos tienes derecho a conocer, actualizar, rectificar y
              suprimir tus datos personales. Para ejercer estos derechos, escríbenos a{" "}
              <strong>privacidad@emitix.co</strong>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink">
              7. Retención de datos
            </h2>
            <p>
              Los datos de facturación se conservan por el tiempo exigido por la
              normativa tributaria colombiana (mínimo 5 años). Los datos de la cuenta se
              mantienen mientras la cuenta esté activa y durante el período requerido
              por la ley.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink">
              8. Cambios en esta política
            </h2>
            <p>
              Podemos actualizar esta política periódicamente. Te notificaremos sobre
              cambios significativos a través del correo registrado o mediante aviso
              en la plataforma.
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
