/**
 * Cerebro del negocio dentro del panel (21/11, pedido de los dueños).
 *
 * Es la memoria de Claude (`cerebro/` en el repo) resumida para leer desde el
 * panel: qué entiende del negocio, qué encontró, qué falta y qué preguntas
 * siguen abiertas. Solo texto: sin datos de prospectos, sin claves y sin el
 * código de ingreso. Se actualiza en cada vuelta de trabajo junto con
 * `cerebro/15-hallazgos-21-11.md` y `cerebro/08-pendientes-y-plan.md`.
 * Lo vivo (cifras de la semana) sale de la base en la página, no de acá.
 */

import type { CifrasPerfilSemana } from "@/lib/asistente/semana-reglas";
import { CIFRAS_SEMANA } from "@/lib/asistente/semana-reglas";

export type RubroCerebro = "todos" | "juridico" | "coberturas_medicas" | "agencia_0km" | "marketing";
export type Gravedad = "alta" | "media" | "info";

export interface Alerta {
  gravedad: Gravedad;
  titulo: string;
  detalle: string;
}

export interface Pendiente {
  texto: string;
  rubro: RubroCerebro;
  urgente?: boolean;
}

export interface ColumnaPendientes {
  clave: "duenos" | "claude" | "despues";
  titulo: string;
  ayuda: string;
  items: Pendiente[];
}

export interface Correccion {
  decia: string;
  real: string;
}

export interface Propuesta {
  titulo: string;
  porque: string;
  tamano: "chico" | "medio" | "grande";
}

export interface MarcaCerebro {
  rubro: Exclude<RubroCerebro, "todos">;
  nombre: string;
  derivaA: string;
  prioridad: number;
  queVale: string;
  semanal: string;
}

export const ACTUALIZADO = "21/11/2026";

export const RESUMEN =
  "Captamos clientes con bases y bots por WhatsApp y los derivamos a mano a profesionales de cada rubro. El éxito es un cliente captado y derivado.";

export const ENTIENDO: string[] = [
  "Son dos dueños, desarrolladores del panel. Captan y derivan a mano por WhatsApp; los profesionales atienden.",
  "Las bases son la fuente principal: llegan cada semana y se corren de lunes a sábado, de 8 a 21 h.",
  "Una línea fija de Meta por rubro recibe consultas; los envíos fríos, seguimientos y recontactos van por chips de Wasender.",
  "El bot es lo más humano posible: dice que es una IA solo si se lo preguntan.",
  "Las mejoras de los bots se proponen sumando a la base, sin borrar, y siempre con autorización.",
  "No se paga nada sin autorización. Las campañas y la publicidad las lanzan ustedes.",
];

export const MARCAS_CEREBRO: MarcaCerebro[] = [
  { rubro: "juridico", nombre: "VITA Abogados", derivaA: "abogados", prioridad: 1, queVale: "Esencial. En bases mixtas, priorizar lesiones graves (fracturas).", semanal: "1.000 a 2.500 mensajes" },
  { rubro: "marketing", nombre: "Kocos Marketing", derivaA: "ustedes mismos", prioridad: 2, queVale: "Proyectos grandes. Buscar un servicio rápido de ticket alto.", semanal: "5.000 mensajes" },
  { rubro: "coberturas_medicas", nombre: "Compara Tu Obra Social", derivaA: "asesores", prioridad: 3, queVale: "Los grupos familiares son los que más dejan.", semanal: "1.000 a 2.000 mensajes" },
  { rubro: "agencia_0km", nombre: "Automotores Kocos", derivaA: "vendedores de concesionarias cercanas", prioridad: 3, queVale: "Se vende todo: hace falta el cliente cerrado.", semanal: "500 a 1.000 mensajes" },
];

export const ALERTAS: Alerta[] = [
  { gravedad: "alta", titulo: "El seguimiento a 72 h no salió nunca", detalle: "En ningún perfil. El cálculo del plazo lo deja siempre «vencido» y queda en conflicto." },
  { gravedad: "alta", titulo: "Retenidos de Jurídico visibles en los otros rubros", detalle: "Los mensajes retenidos no guardan el perfil y aparecen en los cuatro paneles." },
  { gravedad: "alta", titulo: "LEGAL-CRM es público en GitHub", detalle: "Pasalo a privado: Settings → General → Change repository visibility." },
  { gravedad: "media", titulo: "Tres perfiles sin enviar hace 19 a 26 días", detalle: "Coberturas (pago de Meta y pausa), Autos (calidad baja de la línea) y Marketing (línea sin acceso al número y pausa por «domingo»). «Hoy» no lo dice." },
  { gravedad: "media", titulo: "Un captado reciente de Jurídico es falso", detalle: "Era un mensaje automático y la persona pidió que no la contacten." },
  { gravedad: "media", titulo: "23 captados esperando derivar", detalle: "Algunos hace 25 días. Hay 0 ventas registradas." },
  { gravedad: "info", titulo: "Claves para cambiar cuando quieran", detalle: "La interna del latido, la de Supabase y un token de GitHub aparecieron en chats viejos." },
];

export const CORRECCIONES: Correccion[] = [
  { decia: "Jurídico capta en «Fase 2»", real: "No hay fases: 2 o 3 preguntas y cualquier «sí» a la llamada cuenta como captado." },
  { decia: "Cada captado tiene evidencia de aceptación", real: "La evidencia es la última frase de la persona, escrita por el modelo." },
  { decia: "Una sola definición por cifra", real: "Jurídico muestra 1.618 o 3.421 contactados según la pantalla." },
  { decia: "Coberturas y 0 km tienen chips de Wasender", real: "No tienen ninguno. Hay 2 activos caídos (Jurídico y Marketing)." },
  { decia: "Las plantillas nuevas esperan aprobación de Meta", real: "Ya están aprobadas en los cuatro catálogos." },
  { decia: "El pase a créditos pagos de Claude está apagado", real: "Lo dejaron activado el 20/11, con freno y checkpoint." },
  { decia: "Lo trataba en femenino", real: "Son dos dueños, hombres. Corregido en toda la memoria." },
];

export const PROPUESTAS: Propuesta[] = [
  { titulo: "Arreglar el plazo del seguimiento a 72 h", porque: "Hoy no sale ninguno.", tamano: "chico" },
  { titulo: "Separar por rubro los retenidos, la línea Penal y los avisos", porque: "Hoy se ven cosas de un rubro en otro.", tamano: "chico" },
  { titulo: "Guardar como prueba de cada captado el mensaje real de la persona", porque: "Evita falsos captados.", tamano: "medio" },
  { titulo: "Tope de gasto de Gemini con aviso al 80 % de USD 30", porque: "Hoy no hay freno.", tamano: "medio" },
  { titulo: "Repartir los envíos entre varios chips de Wasender", porque: "Cada campaña usa un solo chip; suman 13 esta semana.", tamano: "grande" },
  { titulo: "Que «Hoy» diga por qué está parado cada perfil", porque: "Coberturas figura con calidad alta y no envía.", tamano: "chico" },
  { titulo: "Etiqueta de gravedad en las bases de Jurídico", porque: "El bot no pregunta la gravedad de la lesión.", tamano: "medio" },
  { titulo: "Arreglar Agentes y Resultados en el celular", porque: "Se salen de la pantalla.", tamano: "chico" },
];

export const PENDIENTES: ColumnaPendientes[] = [
  {
    clave: "duenos",
    titulo: "Ustedes",
    ayuda: "Lo que depende de ustedes",
    items: [
      { texto: "Pasar LEGAL-CRM a privado en GitHub", rubro: "todos", urgente: true },
      { texto: "Vincular el número de Marketing en Meta", rubro: "marketing", urgente: true },
      { texto: "Conectar los chips: 4 VITA, 4 Marketing, 3 Coberturas y 2 0 km", rubro: "todos", urgente: true },
      { texto: "Responder las preguntas abiertas de esta página", rubro: "todos", urgente: true },
      { texto: "Abrir TikTok y YouTube", rubro: "todos" },
      { texto: "Pasar referencias de reels que les gusten", rubro: "todos" },
      { texto: "Dar acceso a Search Console y Analytics, cuando quieran", rubro: "todos" },
    ],
  },
  {
    clave: "claude",
    titulo: "Claude",
    ayuda: "Propuesta + su autorización",
    items: [
      { texto: "Informes diario, semanal y mensual en Perfiles", rubro: "todos", urgente: true },
      { texto: "Priorizar lesiones graves en bases mixtas", rubro: "juridico", urgente: true },
      { texto: "Unificar Penal con Civil", rubro: "juridico" },
      { texto: "Proponer un servicio rápido de ticket alto", rubro: "marketing", urgente: true },
      { texto: "Bocetos de un rubro → aprueban → produzco → programo en Metricool", rubro: "todos" },
      { texto: "Avisarles cuando Gemini llegue al 80 % de los USD 30", rubro: "todos" },
      { texto: "Terminar la medición de las landings (PR en borrador)", rubro: "todos" },
    ],
  },
  {
    clave: "despues",
    titulo: "Más adelante",
    ayuda: "Ideas y decisiones abiertas",
    items: [
      { texto: "Avisos de captado: a quién y por dónde", rubro: "todos" },
      { texto: "Respuesta automática a comentarios con palabra clave", rubro: "todos" },
      { texto: "Registrar ventas cerradas de otra forma", rubro: "todos" },
      { texto: "Gestor propio de teléfonos con IP por número y reconexión automática", rubro: "todos" },
      { texto: "Publicidad paga y píxel de Meta", rubro: "todos" },
      { texto: "Ajustes del panel del 19/11 (archivar prospectos): siguen sin publicar", rubro: "juridico" },
      { texto: "Entrenamiento diario del cerebro (tarea programada pausada)", rubro: "todos" },
    ],
  },
];

export const PREGUNTAS_ABIERTAS: string[] = [
  "El pase automático a créditos pagos de Claude: ¿sigue activado? ¿Con qué tope por mes?",
  "Al versionar piezas de redes: ¿cambios reales, o «para que Meta no detecte duplicados»?",
  "¿Qué hace hoy «Derivar»? ¿Le llega algo al profesional?",
  "Penal unificado con Civil: ¿se apaga el agente y la línea Penal, o queda como rol dentro de Civil?",
  "¿El bot sigue presentándose como «Nancy» y «Leonardo Gonzalez»?",
];

export const ETIQUETA_RUBRO: Record<RubroCerebro, string> = {
  todos: "Todos",
  juridico: "VITA",
  coberturas_medicas: "Coberturas",
  agencia_0km: "0 km",
  marketing: "Marketing",
};

/** Pendientes que le tocan a un perfil: los suyos y los de todos. */
export function pendientesDe(columna: ColumnaPendientes, rubro: RubroCerebro): Pendiente[] {
  if (rubro === "todos") return columna.items;
  return columna.items.filter((p) => p.rubro === "todos" || p.rubro === rubro);
}

/** Cuántas alertas hay de cada gravedad, para el encabezado. */
export function conteoAlertas(alertas: Alerta[]): Record<Gravedad, number> {
  const c: Record<Gravedad, number> = { alta: 0, media: 0, info: 0 };
  for (const a of alertas) c[a.gravedad] += 1;
  return c;
}

// --- Lo que el cerebro lee del panel (cifras vivas de la semana) ---------


export interface PerfilSemana {
  perfil: Exclude<RubroCerebro, "todos">;
  cifras: CifrasPerfilSemana;
}

const n = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const fmt = (v: number) => v.toLocaleString("es-AR");

/**
 * Lecturas cortas que el cerebro saca de las cifras de la semana: qué perfil
 * no envió, cuántos captados faltan derivar, quién espera a una persona.
 * Solo números agregados; nunca datos de una persona.
 */
export function lecturasDelPanel(perfiles: PerfilSemana[]): string[] {
  const salida: string[] = [];
  const sinEnviar = perfiles.filter((p) => n(p.cifras.enviados.actual) === 0).map((p) => ETIQUETA_RUBRO[p.perfil]);
  if (sinEnviar.length) salida.push(`Sin mensajes enviados esta semana: ${sinEnviar.join(", ")}.`);
  for (const p of perfiles) {
    const captados = n(p.cifras.captados.actual);
    const derivados = n(p.cifras.derivados.actual);
    if (captados != null && derivados != null && captados > derivados) {
      const faltan = captados - derivados;
      salida.push(`${ETIQUETA_RUBRO[p.perfil]}: ${fmt(faltan)} captado${faltan === 1 ? "" : "s"} de esta semana sin derivar.`);
    }
  }
  const piden = perfiles.filter((p) => (n(p.cifras.piden.actual) ?? 0) > 0);
  if (piden.length) salida.push(`Chats que piden una persona ahora: ${piden.map((p) => `${ETIQUETA_RUBRO[p.perfil]} ${fmt(n(p.cifras.piden.actual) ?? 0)}`).join(", ")}.`);
  const caen = perfiles.filter((p) => {
    const a = n(p.cifras.respondieron.actual);
    const b = n(p.cifras.respondieron.anterior);
    return a != null && b != null && b >= 5 && a < b / 2;
  });
  if (caen.length) salida.push(`Respondieron menos de la mitad que la semana anterior: ${caen.map((p) => ETIQUETA_RUBRO[p.perfil]).join(", ")}.`);
  if (!salida.length) salida.push("Esta semana no veo nada fuera de lo normal en las cifras.");
  return salida;
}

/** Foto de la semana en texto, para sumarla a un pedido de la bandeja. */
export function fotoParaClaude(perfiles: PerfilSemana[], desde: string): string {
  const lineas = [`Foto del panel (últimos 7 días desde ${desde}):`];
  for (const p of perfiles) {
    const partes = CIFRAS_SEMANA.map((c) => {
      const v = n(p.cifras[c.clave].actual);
      return `${c.titulo.toLowerCase()} ${v == null ? "—" : fmt(v)}`;
    });
    lineas.push(`- ${ETIQUETA_RUBRO[p.perfil]}: ${partes.join("; ")}.`);
  }
  return lineas.join("\n");
}

/** Arma el pedido que va a la bandeja desde el cerebro. */
export function pedidoDesdeCerebro(texto: string, foto: string | null): string {
  const base = `Desde el cerebro: ${texto.trim()}`;
  return foto ? `${base}\n\n${foto}` : base;
}

/** Frases del hero: lo que el cerebro sabe, con las cifras vivas de la semana. */
export function frasesDelCerebro(perfiles: PerfilSemana[] | null, alertasAltas: number, preguntas: number): [string, string, string][] {
  const suma = (k: keyof CifrasPerfilSemana) => (perfiles ?? []).reduce((s, p) => s + (n(p.cifras[k].actual) ?? 0), 0);
  const frases: [string, string, string][] = [["Esto es lo que sé de sus", "4 negocios", "."]];
  if (perfiles) {
    frases.push(["Esta semana salieron", `${fmt(suma("enviados"))} mensajes`, " en los 4 perfiles."]);
    frases.push(["Respondieron", `${fmt(suma("respondieron"))} personas`, " y capté lo que dijeron."]);
    frases.push(["Hay", `${fmt(suma("captados"))} captados`, " esta semana para derivar."]);
  }
  frases.push(["Encontré", `${alertasAltas} alertas altas`, " que conviene mirar hoy."]);
  frases.push(["Me quedan", `${preguntas} preguntas`, " que solo ustedes saben."]);
  frases.push(["Cada mejora es", "una propuesta", ": nada cambia sin su OK."]);
  return frases;
}
