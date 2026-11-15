"use client";

/**
 * Último resguardo (15/11): si falla el armado general del panel, esta pantalla
 * reemplaza todo el documento. Va con estilos propios porque no carga los del panel.
 */
export default function ErrorGeneral({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f8fafc", color: "#0f172a" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "1rem" }}>
          <section role="alert" style={{ maxWidth: "28rem", width: "100%", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "1rem", padding: "1.5rem" }}>
            <h1 style={{ fontSize: "1.125rem", margin: 0 }}>El panel no se pudo abrir</h1>
            <p style={{ fontSize: "0.875rem", color: "#334155", marginTop: "0.5rem" }}>No se perdió nada. Probá de nuevo en un momento.</p>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => reset()}
                style={{ minHeight: 44, padding: "0 1rem", borderRadius: "0.5rem", border: 0, background: "#0f172a", color: "#fff", fontWeight: 600, cursor: "pointer" }}
              >
                Reintentar
              </button>
              {/* Enlace común (no <Link>): acá no hay enrutador del panel. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/hoy" style={{ minHeight: 44, display: "inline-flex", alignItems: "center", padding: "0 1rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", color: "#0f172a", textDecoration: "none" }}>
                Volver a Hoy
              </a>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
