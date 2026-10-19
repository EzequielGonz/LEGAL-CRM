import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { AUTO_CAMPAIGN_NAME } from "@/lib/marketing/outreach";
import { CAMPAIGN_STATUS_LABEL } from "@/lib/campaign-status";

type Efecto = "prepara" | "guarda" | "envia";

const EFECTO: Record<Efecto, { texto: string; clase: string }> = {
  prepara: { texto: "Prepara: no envía nada", clase: "bg-slate-100 text-slate-800" },
  guarda: { texto: "Guarda: no envía nada", clase: "bg-slate-100 text-slate-800" },
  envia: { texto: "Envía mensajes", clase: "bg-amber-100 text-amber-950" },
};

interface Paso {
  titulo: string;
  href: string;
  efecto: Efecto;
  estado: string;
  atencion?: boolean;
}

function Circuito({ id, titulo, descripcion, pasos }: { id: string; titulo: string; descripcion: string; pasos: Paso[] }) {
  return (
    <section aria-labelledby={id} className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 id={id} className="text-base font-semibold text-slate-900">
        {titulo}
      </h3>
      <p className="mt-1 text-sm text-slate-700">{descripcion}</p>
      <ol className="mt-3 space-y-2">
        {pasos.map((p, i) => (
          <li key={p.titulo}>
            <Link
              href={p.href}
              className={`flex min-h-[44px] items-start gap-3 rounded-xl border px-3 py-2 hover:bg-slate-50 ${p.atencion ? "border-amber-400" : "border-slate-200"}`}
            >
              <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-900">{p.titulo}</span>
                <span className="block text-sm text-slate-700 [overflow-wrap:anywhere]">{p.estado}</span>
              </span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${EFECTO[p.efecto].clase}`}>{EFECTO[p.efecto].texto}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * Entrada común a los dos circuitos de Marketing (rediseño 17/10, bloque 3):
 * la captación saliente (negocios que buscamos) y las consultas que llegan
 * (gente que nos escribe). Cada paso dice si prepara, guarda o envía.
 * «Pide presupuesto» = captado; presupuesto aprobado = cerrado. Solo lectura.
 */
export async function CircuitosMarketing() {
  const s = createAdminClient();
  const leads = () => s.from("marketing_leads").select("id", { count: "exact", head: true });
  const [sinContactar, aceptaron, directas, pedidos, atrasados, aprobados, auto] = await Promise.all([
    leads().eq("source_kind", "scraper").eq("outreach_status", "sin_contactar"),
    leads().eq("source_kind", "scraper").not("sale_stage", "in", "(apertura)").not("sale_stage", "is", null),
    leads().eq("source_kind", "directa").not("outreach_status", "in", "(cerrado,no_interesado,baja)"),
    s.from("marketing_budgets").select("id", { count: "exact", head: true }).eq("estado", "pedido"),
    s.from("marketing_budgets").select("id", { count: "exact", head: true }).eq("estado", "pedido").lt("pedido_at", new Date(Date.now() - 20 * 3_600_000).toISOString()),
    s.from("marketing_budgets").select("id", { count: "exact", head: true }).eq("estado", "aprobado"),
    s.from("campaigns").select("status").eq("area", "marketing").eq("name", AUTO_CAMPAIGN_NAME).maybeSingle(),
  ]);
  const n = (r: { count: number | null; error?: unknown }) => (r.error ? null : r.count ?? 0);
  const cifra = (v: number | null, texto: string) => (v === null ? "Sin datos" : `${v.toLocaleString("es-AR")} ${texto}`);
  const estadoAuto = auto.data ? CAMPAIGN_STATUS_LABEL[(auto.data as any).status] ?? (auto.data as any).status : "sin preparar";

  return (
    <section aria-labelledby="mkt-circuitos-inicio" className="space-y-3">
      <h2 id="mkt-circuitos-inicio" className="text-base font-semibold text-slate-900">
        Los dos circuitos de Marketing
      </h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <Circuito
          id="mkt-saliente"
          titulo="Captación saliente"
          descripcion="Negocios que buscamos nosotros. Se extrae la base, se carga y se les pregunta si quieren escuchar una propuesta. Solo a los que dicen que sí se les hace el análisis con IA, automático, y la venta consultiva sigue en el mismo chat hasta el presupuesto. No se analiza a nadie que no respondió."
          pasos={[
            { titulo: "1. Extraer la base", href: "/panel/marketing/extraer", efecto: "prepara", estado: `Busca negocios y arma la base · ${cifra(n(sinContactar), "sin contactar")}` },
            {
              titulo: "2. Cargarla y lanzar la apertura",
              href: "/panel/marketing/extraer",
              efecto: "envia",
              estado: `«Ejecutar base»: pregunta si quieren escuchar una propuesta (con PIN) · envío automático: ${estadoAuto.toLowerCase()}`,
            },
            {
              titulo: "3. Dicen que sí: análisis IA y venta en el chat",
              href: "/conversaciones?perfil=marketing",
              efecto: "guarda",
              estado: `${cifra(n(aceptaron), "aceptaron escuchar")} · el agente analiza el negocio solo y presenta la propuesta`,
            },
          ]}
        />
        <Circuito
          id="mkt-entrante"
          titulo="Consultas que llegan"
          descripcion="Gente que nos escribe: se responde, se pide el presupuesto (captado) y se cierra cuando lo aprueban."
          pasos={[
            { titulo: "Consultas directas", href: "/panel/marketing/consultas-directas", efecto: "guarda", estado: cifra(n(directas), "abiertas") },
            {
              titulo: "Pide presupuesto",
              href: "/panel/marketing/presupuestos",
              efecto: "envia",
              estado: `${cifra(n(pedidos), "a preparar")}${n(atrasados) ? ` · ${n(atrasados)} con más de 20 h` : ""}`,
              atencion: !!n(atrasados),
            },
            { titulo: "Presupuesto aprobado = cerrado", href: "/panel/marketing/presupuestos?ver=todos", efecto: "guarda", estado: cifra(n(aprobados), "aprobados") },
          ]}
        />
      </div>
    </section>
  );
}
