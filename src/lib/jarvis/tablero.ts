/**
 * Jarvis · tablero y tarjetas de resultado (vuelta 6, 22/11). Funciones puras: sin base, sin navegador y sin
 * reloj (el instante llega como dato), así el servidor y el navegador dibujan lo mismo y se pueden probar.
 *
 * - Días de la semana en hora de Argentina (UTC−3 fijo, sin horario de verano) para la serie de 7 días.
 * - Camino SVG del gráfico de área (mensajes de la semana) y de la línea chica (captados).
 * - `nombreCorto`: en las tarjetas de personas solo va el nombre de pila y la inicial del apellido.
 * - `tarjetasDeHerramienta`: convierte lo que devolvió una herramienta de lectura en una tarjeta rica
 *   (gráfico de barras, lista de personas o estado), sin inventar ningún número: todo sale del resultado.
 */
import type { CifrasPerfilSemana } from "@/lib/asistente/semana-reglas";
import type { SlugPerfil } from "@/lib/marca";

const DIA_MS = 86_400_000;
/** Argentina: UTC−3 todo el año. */
const DESFASE_AR_MS = 3 * 3_600_000;
const DIAS_CORTOS = ["do", "lu", "ma", "mi", "ju", "vi", "sá"] as const;

export interface DiaSemana {
  /** AAAA-MM-DD en Argentina. */
  dia: string;
  /** Dos letras: «lu», «ma»… */
  etiqueta: string;
  /** Inicio del día (ISO, UTC). */
  desde: string;
  /** Inicio del día siguiente (ISO, UTC). */
  hasta: string;
}

/** Los últimos 7 días de Argentina, del más viejo a hoy (hoy incluido, aunque no haya terminado). */
export function diasDeLaSemana(ahoraMs: number): DiaSemana[] {
  const hoyAr = Math.floor((ahoraMs - DESFASE_AR_MS) / DIA_MS);
  const dias: DiaSemana[] = [];
  for (let k = 6; k >= 0; k--) {
    const n = hoyAr - k;
    const inicio = n * DIA_MS + DESFASE_AR_MS;
    const dia = new Date(n * DIA_MS).toISOString().slice(0, 10);
    dias.push({ dia, etiqueta: etiquetaDia(dia), desde: new Date(inicio).toISOString(), hasta: new Date(inicio + DIA_MS).toISOString() });
  }
  return dias;
}

/** «lu», «ma»… para un día AAAA-MM-DD (vacío si la fecha no es válida). */
export function etiquetaDia(dia: string): string {
  const t = Date.parse(`${dia}T12:00:00Z`);
  return Number.isFinite(t) ? DIAS_CORTOS[new Date(t).getUTCDay()] : "";
}

export interface PuntoSerie {
  dia: string;
  etiqueta: string;
  /** null = no se pudo leer ese día. */
  valor: number | null;
}

export interface CampanaTablero {
  nombre: string;
  enviados: number;
  respondieron: number;
}

/** Lo que dibuja el tablero de Jarvis para UN perfil (cada rubro separado). */
export interface TableroJarvis {
  perfil: SlugPerfil;
  /** Mensajes de campaña enviados por día, últimos 7 días. */
  enviadosPorDia: PuntoSerie[];
  /** Captados por día, últimos 7 días. */
  captadosPorDia: PuntoSerie[];
  /** La semana contra la anterior (las mismas cifras que /asistente y Resumen). */
  semana: CifrasPerfilSemana | null;
  /** Hasta 3 campañas recientes con enviados y respuestas. */
  campanas: CampanaTablero[];
}

/** Suma de una serie (los días sin dato no suman). */
export function sumaSerie(serie: PuntoSerie[]): number {
  return serie.reduce((a, p) => a + (p.valor ?? 0), 0);
}

/**
 * Camino SVG de un gráfico de área para `valores` en una caja de `ancho`×`alto` con un margen arriba.
 * Devuelve la línea (`linea`) y el área cerrada (`area`). Sin valores, una línea plana abajo.
 * Curvas suaves (Catmull-Rom → Bézier) que nunca pasan por debajo del piso ni por encima del techo.
 */
export function caminoArea(valores: (number | null)[], ancho: number, alto: number, margen = 6): { linea: string; area: string; puntos: [number, number][] } {
  const v = valores.map((x) => (typeof x === "number" && Number.isFinite(x) && x > 0 ? x : 0));
  const n = v.length;
  const max = Math.max(1, ...v);
  const piso = alto - 1;
  const util = piso - margen;
  const puntos: [number, number][] = v.map((x, i) => [n <= 1 ? ancho / 2 : (i / (n - 1)) * ancho, piso - (x / max) * util]);
  if (n === 0) return { linea: `M0 ${piso} L${ancho} ${piso}`, area: `M0 ${piso} L${ancho} ${piso} Z`, puntos: [] };
  const f = (z: number) => Math.round(z * 10) / 10;
  const limitar = (y: number) => Math.min(piso, Math.max(margen, y));
  let d = `M${f(puntos[0][0])} ${f(puntos[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = puntos[Math.max(0, i - 1)];
    const p1 = puntos[i];
    const p2 = puntos[i + 1];
    const p3 = puntos[Math.min(n - 1, i + 2)];
    const c1: [number, number] = [p1[0] + (p2[0] - p0[0]) / 6, limitar(p1[1] + (p2[1] - p0[1]) / 6)];
    const c2: [number, number] = [p2[0] - (p3[0] - p1[0]) / 6, limitar(p2[1] - (p3[1] - p1[1]) / 6)];
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  const ultimo = puntos[n - 1];
  const area = `${d} L${f(ultimo[0])} ${piso} L${f(puntos[0][0])} ${piso} Z`;
  return { linea: d, area, puntos };
}

/** Proporción 0..1 de un valor sobre un total (sin total o sin valor, 0; nunca más de 1). */
export function proporcion(valor: number | null | undefined, total: number | null | undefined): number {
  if (!(typeof valor === "number" && valor > 0) || !(typeof total === "number" && total > 0)) return 0;
  return Math.min(1, valor / total);
}

/** Porcentaje entero para mostrar («38 %»), o «—» si no hay base. */
export function porcentajeTexto(valor: number | null | undefined, total: number | null | undefined): string {
  if (!(typeof total === "number" && total > 0) || typeof valor !== "number") return "—";
  return `${Math.round(Math.min(1, Math.max(0, valor / total)) * 100)} %`;
}

/**
 * Nombre corto para mostrar a una persona en una tarjeta: nombre de pila e inicial del apellido
 * («María José Pérez» → «María P.»). Nada de teléfonos ni documentos: si el «nombre» trae dígitos o una
 * arroba, queda «Sin nombre».
 */
export function nombreCorto(nombre: unknown): string {
  const limpio = String(nombre ?? "").replace(/\s+/g, " ").trim();
  if (!limpio || /[\d@]/.test(limpio) || /^sin nombre$/i.test(limpio)) return "Sin nombre";
  const partes = limpio.split(" ").filter(Boolean);
  const pila = partes[0].slice(0, 16);
  if (partes.length === 1) return pila;
  const ultimo = partes[partes.length - 1];
  return `${pila} ${ultimo.charAt(0).toUpperCase()}.`;
}

/** «25/11 15:00» en hora de Argentina; vacío si la fecha no vale. */
export function fechaCortaAr(iso: unknown): string {
  if (typeof iso !== "string") return "";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const d = new Date(t - DESFASE_AR_MS);
  const dos = (n: number) => String(n).padStart(2, "0");
  return `${dos(d.getUTCDate())}/${dos(d.getUTCMonth() + 1)} ${dos(d.getUTCHours())}:${dos(d.getUTCMinutes())}`;
}

// ---------------------------------------------------------------------------
// Tarjetas de resultado de la charla
// ---------------------------------------------------------------------------

export interface EnlaceTarjeta {
  href: string;
  texto: string;
}

export type TarjetaJarvis =
  | { tipo: "barras"; titulo: string; datos: { etiqueta: string; valor: number }[]; nota?: string; enlace?: EnlaceTarjeta }
  | { tipo: "personas"; titulo: string; personas: { nombre: string; detalle: string; tono: "ok" | "alerta" | "neutro" }[]; nota?: string; enlace?: EnlaceTarjeta }
  | { tipo: "estado"; titulo: string; filas: { etiqueta: string; valor: string; ok: boolean }[]; nota?: string };

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v) : null);

function hrefs(slug: SlugPerfil) {
  return {
    chats: slug === "juridico" ? "/inbox" : `/panel/${slug}/chats`,
    contactos: `/contactos?perfil=${slug}`,
    campanas: slug === "juridico" ? "/campanas" : `/panel/${slug}/campanas`,
  };
}

const ESTADO_CAPTACION: Record<string, string> = {
  captado: "captado",
  en_conversacion: "en charla",
  en_seguimiento: "en seguimiento",
  perdido: "perdido",
};

/**
 * Tarjeta rica para lo que devolvió una herramienta de LECTURA (o null si no corresponde). Solo usa datos
 * del resultado; los nombres van cortos. Las herramientas que proponen cambios ya tienen su tarjeta «¿Lo hago?».
 */
export function tarjetaDeHerramienta(nombre: string, resultado: unknown, slug: SlugPerfil): TarjetaJarvis | null {
  if (!resultado || typeof resultado !== "object") return null;
  const r = resultado as Record<string, any>;
  if (r.error) return null;
  const h = hrefs(slug);
  switch (nombre) {
    case "resumen_perfil": {
      const filas: [string, unknown][] = [
        ["Captados", r.captados],
        ["Sin derivar", r.captados_sin_derivar],
        ["Piden una persona", r.piden_una_persona],
        ["En charla", r.en_conversacion],
        ["En seguimiento", r.en_seguimiento],
        ["Perdidos", r.perdidos],
      ];
      const datos = filas.map(([etiqueta, v]) => ({ etiqueta, valor: num(v) })).filter((d): d is { etiqueta: string; valor: number } => d.valor !== null);
      if (datos.length === 0) return null;
      return { tipo: "barras", titulo: "Cómo está el perfil ahora", datos, enlace: { href: h.contactos, texto: "Ver contactos" } };
    }
    case "listar_captados": {
      const lista = Array.isArray(r.captados) ? r.captados : [];
      if (lista.length === 0) return null;
      const personas = lista.slice(0, 6).map((c: any) => {
        const cita = fechaCortaAr(c?.proxima_cita);
        const detalle = c?.derivado ? "derivado" : cita ? `sin derivar · cita ${cita}` : "sin derivar";
        return { nombre: nombreCorto(c?.nombre), detalle, tono: (c?.derivado ? "ok" : "alerta") as "ok" | "alerta" };
      });
      const resto = lista.length - personas.length;
      return { tipo: "personas", titulo: "Captados", personas, nota: resto > 0 ? `y ${resto} más` : undefined, enlace: { href: h.contactos, texto: "Abrir contactos" } };
    }
    case "buscar_chat": {
      const lista = Array.isArray(r.chats) ? r.chats : [];
      if (lista.length === 0) return null;
      const personas = lista.slice(0, 3).map((c: any) => {
        const etapa = ESTADO_CAPTACION[String(c?.captacion ?? "")] ?? "sin etapa";
        const msgs = Array.isArray(c?.mensajes) ? c.mensajes : [];
        const ultimo = msgs.length ? fechaCortaAr(msgs[msgs.length - 1]?.cuando) : "";
        return {
          nombre: nombreCorto(c?.nombre),
          detalle: [etapa, c?.atiende === "bot" ? "lo atiende el bot" : "lo atiende una persona", ultimo ? `último ${ultimo}` : ""].filter(Boolean).join(" · "),
          tono: (c?.atiende === "bot" ? "neutro" : "ok") as "neutro" | "ok",
        };
      });
      return { tipo: "personas", titulo: lista.length === 1 ? "El chat" : "Chats encontrados", personas, enlace: { href: h.chats, texto: "Abrir los chats" } };
    }
    case "listar_campanas": {
      const lista = Array.isArray(r.campanas) ? r.campanas : [];
      const datos = lista
        .slice(0, 5)
        .map((c: any) => {
          const d = (c?.destinatarios ?? {}) as Record<string, unknown>;
          const enviados = ["enviado", "entregado", "leido", "respondio"].reduce((a, k) => a + (num(d[k]) ?? 0), 0);
          return { etiqueta: String(c?.nombre ?? "Campaña").slice(0, 28), valor: enviados };
        })
        .filter((d: { valor: number }) => d.valor >= 0);
      if (datos.length === 0) return null;
      return { tipo: "barras", titulo: "Mensajes enviados por campaña", datos, enlace: { href: h.campanas, texto: "Abrir campañas" } };
    }
    case "estado_lineas": {
      const of = Array.isArray(r.lineas_oficiales) ? r.lineas_oficiales : [];
      const qr = Array.isArray(r.lineas_wasender) ? r.lineas_wasender : [];
      const filas = [
        ...of.map((l: any) => ({ etiqueta: String(l?.nombre ?? "Línea").slice(0, 40), valor: l?.puede_enviar ? "anda bien" : String(l?.estado_en_meta ?? "sin comprobar"), ok: l?.puede_enviar === true })),
        ...qr.map((l: any) => ({ etiqueta: `${String(l?.nombre ?? "Línea").slice(0, 32)} (QR)`, valor: l?.conectada ? "conectada" : "desconectada", ok: l?.conectada === true })),
      ].slice(0, 6);
      if (filas.length === 0) return null;
      return { tipo: "estado", titulo: "Líneas de WhatsApp", filas, nota: "Los números no se muestran." };
    }
    default:
      return null;
  }
}

/** Tarjetas de una respuesta: la última de cada herramienta, hasta 3. */
export function tarjetasDeResultados(resultados: { nombre: string; resultado: unknown }[], slug: SlugPerfil): TarjetaJarvis[] {
  const porNombre = new Map<string, TarjetaJarvis>();
  for (const { nombre, resultado } of resultados) {
    const t = tarjetaDeHerramienta(nombre, resultado, slug);
    if (t) {
      porNombre.delete(nombre);
      porNombre.set(nombre, t);
    }
  }
  return Array.from(porNombre.values()).slice(-3);
}

/** Texto para leer en voz alta: sin comillas latinas sueltas ni enlaces, corto. */
export function textoParaVoz(texto: unknown): string {
  return String(texto ?? "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[«»*_#`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 600);
}

/**
 * Palabras de un cartel. Lo que va entre asteriscos (`*así*`) se marca como clave (itálica serif con
 * recuadro fino); el resto, palabra por palabra.
 */
export function palabrasDeCartel(texto: string): { t: string; clave: boolean }[] {
  const out: { t: string; clave: boolean }[] = [];
  const re = /\*([^*]+)\*|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) {
    if (m[1]) out.push({ t: m[1].trim(), clave: true });
    else out.push({ t: m[2], clave: false });
  }
  return out;
}

/** Marca para el cartel la primera cifra de una frase con la palabra que la sigue («5 personas» → «*5 personas*»). */
export function marcarCifra(frase: string): string {
  if (frase.includes("*")) return frase;
  return frase.replace(/(\d+)(\s+[A-Za-zÁÉÍÓÚáéíóúÑñ]+)?/, (_, n: string, p: string | undefined) => `*${n}${p ?? ""}*`);
}

/** «22/11» a partir de AAAA-MM-DD (vacío si no vale). */
export function diaCorto(dia: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dia);
  return m ? `${m[3]}/${m[2]}` : "";
}

const PIDE_NUMEROS = /semana|c[oó]mo (viene|vamos|va|venimos|estamos)|resum|n[uú]meros|cifras|estad[ií]stic|qu[eé] tal/i;

/**
 * Respuesta por reglas cuando no se puede usar la IA (sin clave en este entorno o con el tope de gasto):
 * si la persona pide números de la semana, contesta con los del tablero y una tarjeta de barras; si no,
 * explica por qué no puede pensar la respuesta. Nunca inventa: todo sale del tablero.
 */
export function respuestaSinIA(pedido: string, t: TableroJarvis | null, motivo: "sin_clave" | "tope"): { texto: string; tarjetas: TarjetaJarvis[] } {
  const porQue =
    motivo === "tope"
      ? "Por hoy llegué al tope de gasto de IA que dejaste configurado, así que no puedo pensar respuestas nuevas."
      : "En este entorno no tengo la clave de la IA, así que no puedo pensar respuestas nuevas.";
  const s = t?.semana ?? null;
  if (!PIDE_NUMEROS.test(pedido) || !s) {
    return { texto: `${porQue} Igual te muestro los números del panel: preguntame «¿cómo viene la semana?».`, tarjetas: [] };
  }
  const n = (v: number | null) => (typeof v === "number" ? String(v) : "sin dato");
  const comp = (a: number | null, b: number | null) => {
    if (a == null || b == null) return "";
    if (a === b) return " (igual que la semana anterior)";
    return a > b ? ` (más que la semana anterior, que fueron ${b})` : ` (menos que la semana anterior, que fueron ${b})`;
  };
  const texto = [
    `Esta semana salieron ${n(s.enviados.actual)} mensajes${comp(s.enviados.actual, s.enviados.anterior)} y respondieron ${n(s.respondieron.actual)} personas.`,
    `Hay ${n(s.captados.actual)} captados${comp(s.captados.actual, s.captados.anterior)} y ${n(s.derivados.actual)} derivados.`,
    `Te lo armé con los números del panel, sin IA: ${porQue.charAt(0).toLowerCase()}${porQue.slice(1)}`,
  ].join(" ");
  const filas: [string, number | null][] = [
    ["Enviados", s.enviados.actual],
    ["Respondieron", s.respondieron.actual],
    ["Captados", s.captados.actual],
    ["Citas", s.citas.actual],
    ["Derivados", s.derivados.actual],
  ];
  const datos = filas.filter((f): f is [string, number] => typeof f[1] === "number").map(([etiqueta, valor]) => ({ etiqueta, valor }));
  return { texto, tarjetas: datos.length ? [{ tipo: "barras", titulo: "La semana en números", datos }] : [] };
}
