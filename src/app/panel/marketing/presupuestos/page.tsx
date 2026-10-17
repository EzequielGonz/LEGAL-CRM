import { EnlaceDetalle } from "@/components/ui/enlaces-navegacion";
import Link from "next/link";
import { requirePageSession } from "@/lib/acceso/pagina";
import { createAdminClient } from "@/lib/supabase/admin";
import { CargarPresupuesto } from "@/components/marketing/cargar-presupuesto";
import { AccionConPin } from "@/components/accion-con-pin";

export const dynamic = "force-dynamic";

const ESTADO: Record<string, string> = {
  pedido: "Pedido (a preparar)",
  listo: "Listo (espera que la persona escriba)",
  enviado: "Enviado (la IA retoma para cerrar)",
  aprobado: "Aprobado · cerrado",
  rechazado: "Rechazado",
  sin_respuesta: "Sin respuesta",
  anulado: "Anulado",
};

function horasDesde(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
}

/**
 * Marketing · Pide presupuesto (16/10). Lo que pidió cada persona, el plazo
 * de 24 h, la carga del archivo y el resultado. Pide presupuesto = captado;
 * aprobado = cerrado.
 */
export default async function PidePresupuestoPage({ searchParams }: { searchParams: { ver?: string } }) {
  const sesion = await requirePageSession();
  if (!sesion.ok) return sesion.fallback;
  const ver = searchParams.ver === "todos" ? "todos" : "abiertos";
  const s = createAdminClient();
  let q = s
    .from("marketing_budgets")
    .select("*, contacts(id, full_name, phone, qualification_data)")
    .order("pedido_at", { ascending: true })
    .limit(200);
  if (ver === "abiertos") q = q.in("estado", ["pedido", "listo", "enviado"]);
  const { data, error } = await q;
  const filas = (data ?? []) as any[];

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-gold-700">Trabajo diario</p>
          <h1 className="text-2xl font-semibold text-slate-900">Pide presupuesto</h1>
          <p className="text-sm text-slate-600">Prometimos el presupuesto en menos de 24 h. Al cargarlo se envía (o se avisa con la plantilla si la ventana está cerrada) y la IA retoma para cerrar.</p>
        </div>
        <nav className="flex gap-2 text-sm" aria-label="Filtro">
          <Link href="/panel/marketing/presupuestos" aria-current={ver === "abiertos" ? "page" : undefined} className={`tactil inline-flex items-center rounded-lg px-3 ${ver === "abiertos" ? "bg-slate-900 text-gold-100" : "border border-slate-300 bg-white"}`}>Abiertos</Link>
          <Link href="/panel/marketing/presupuestos?ver=todos" aria-current={ver === "todos" ? "page" : undefined} className={`tactil inline-flex items-center rounded-lg px-3 ${ver === "todos" ? "bg-slate-900 text-gold-100" : "border border-slate-300 bg-white"}`}>Todos</Link>
        </nav>
      </header>

      {error && <p className="text-sm text-red-700">No se pudo leer la lista ({error.message}). ¿Falta aplicar la migración 0311?</p>}
      {!error && filas.length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">No hay pedidos de presupuesto {ver === "abiertos" ? "abiertos" : "todavía"}.</p>}

      <ul className="space-y-3">
        {filas.map((b) => {
          const h = horasDesde(b.pedido_at);
          const vencido = b.estado === "pedido" && h >= 24;
          const c = b.contacts ?? {};
          return (
            <li key={b.id} className={`rounded-xl border bg-white p-4 ${vencido ? "border-red-300" : "border-slate-200"}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{c.full_name ?? "Sin nombre"}</p>
                  <p className="text-xs text-slate-600">
                    {c.phone ?? "—"} · {(c.qualification_data?.rubro_buscado as string) ?? "negocio"} · pedido hace {h} h
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${vencido ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-800"}`}>
                  {vencido ? "Vencido (+24 h)" : ESTADO[b.estado] ?? b.estado}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-800">
                <strong>Pidió:</strong> {b.detalle_pedido}
              </p>
              <p className="text-xs text-slate-600">
                {b.servicios?.length ? `Servicios: ${b.servicios.join(", ")}. ` : ""}
                {b.presupuesto_mencionado ? `Inversión mencionada: ${b.presupuesto_mencionado}. ` : ""}
                {b.urgencia ? `Para: ${b.urgencia}.` : ""}
              </p>
              {b.monto != null && (
                <p className="mt-1 text-xs text-slate-700">
                  Presupuesto: {b.moneda} {Number(b.monto).toLocaleString("es-AR")}
                  {b.plazo_entrega ? ` · entrega ${b.plazo_entrega}` : ""}
                  {b.enviado_at ? ` · enviado ${new Date(b.enviado_at).toLocaleString("es-AR")}${b.enviado_via === "plantilla" ? " (tras la plantilla)" : ""}` : ""}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                {c.id && <EnlaceDetalle href={`/ficha/${c.id}`} className="tactil inline-flex items-center rounded-lg border border-slate-300 px-3">Ficha</EnlaceDetalle>}
                {b.conversation_id && <EnlaceDetalle href={`/inbox/${b.conversation_id}`} className="tactil inline-flex items-center rounded-lg border border-slate-300 px-3">Conversación</EnlaceDetalle>}
              </div>
              {["pedido", "listo"].includes(b.estado) && <CargarPresupuesto budgetId={b.id} />}
              {["enviado", "listo"].includes(b.estado) && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-medium text-slate-700">Registrar resultado a mano</summary>
                  <div className="mt-2 max-w-sm">
                    <AccionConPin
                      endpoint="/api/marketing/presupuestos"
                      cuerpo={{ accion: "resultado", budgetId: b.id }}
                      etiqueta="Guardar resultado"
                      exito="Resultado guardado."
                      campos={[
                        { nombre: "estado", etiqueta: "Resultado", tipo: "select", requerido: true, opciones: [{ valor: "aprobado", etiqueta: "Aprobado (cerrado)" }, { valor: "rechazado", etiqueta: "Rechazado" }, { valor: "sin_respuesta", etiqueta: "Sin respuesta" }, { valor: "anulado", etiqueta: "Anulado" }] },
                        { nombre: "detalle", etiqueta: "Detalle", tipo: "textarea" },
                      ]}
                    />
                  </div>
                </details>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
