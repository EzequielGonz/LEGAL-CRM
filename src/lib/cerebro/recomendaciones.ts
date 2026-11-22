import { ALERTAS, PENDIENTES, ETIQUETA_RUBRO, type RubroCerebro } from "@/lib/cerebro/contenido";
import { CIERRE_CONFIRMAR } from "@/lib/resumen/pedidos";

/**
 * «Lo que el cerebro recomienda hoy» (22/11): hasta tres tarjetas de acción armadas con las alertas y
 * los pendientes que la página ya lee. Cada una trae el pedido para Jarvis, que pide confirmación
 * antes de ejecutar. Función pura, sin datos de personas.
 */
export interface Recomendacion {
  clave: string;
  titulo: string;
  porque: string;
  rubro: RubroCerebro;
  pedido: string;
}

/** Lo que depende de los dueños (GitHub, chips, Meta) no lo ejecuta Jarvis: se deja afuera. */
const NO_ES_PARA_JARVIS = /github|privado|chips|vincular|abrir tiktok|acceso/i;

export function recomendacionesDeHoy(max = 3): Recomendacion[] {
  const salida: Recomendacion[] = [];
  for (const a of ALERTAS) {
    if (a.gravedad === "info" || NO_ES_PARA_JARVIS.test(a.titulo)) continue;
    salida.push({
      clave: `alerta-${salida.length}`,
      titulo: a.titulo,
      porque: a.detalle,
      rubro: "todos",
      pedido: `Alerta ${a.gravedad} del cerebro: ${a.titulo}. ${a.detalle} Explicámela en simple y proponeme cómo resolverla. ${CIERRE_CONFIRMAR}`,
    });
  }
  salida.sort((x, y) => (x.pedido.includes("Alerta alta") ? 0 : 1) - (y.pedido.includes("Alerta alta") ? 0 : 1));
  const claude = PENDIENTES.find((c) => c.clave === "claude");
  for (const p of claude?.items ?? []) {
    if (!p.urgente) continue;
    salida.push({
      clave: `pendiente-${salida.length}`,
      titulo: p.texto,
      porque: `Pendiente urgente de Claude · ${ETIQUETA_RUBRO[p.rubro]}`,
      rubro: p.rubro,
      pedido: `Pendiente urgente: ${p.texto}. Armame el plan y qué cambiaría. ${CIERRE_CONFIRMAR}`,
    });
  }
  // dos alertas y un pendiente, si alcanzan; si no, lo que haya
  const alertas = salida.filter((s) => s.clave.startsWith("alerta")).slice(0, 2);
  const pend = salida.filter((s) => s.clave.startsWith("pendiente"));
  return [...alertas, ...pend].slice(0, max);
}

/** Reglas del dueño que rigen hoy (resumen corto de cerebro/00 y 02). Proponer un cambio queda en la Bandeja. */
export const REGLAS_VIGENTES: { clave: string; texto: string }[] = [
  { clave: "pagos", texto: "No se paga nada sin autorización expresa del dueño." },
  { clave: "borrar", texto: "Nada se borra: se archiva o pasa a borrador, con motivo." },
  { clave: "rubros", texto: "Cada rubro va separado: nada de un perfil se ve ni se abre desde otro." },
  { clave: "campanas", texto: "Las campañas con bases y la publicidad las lanzan los dueños." },
  { clave: "bio", texto: "No se toca la bio ni el botón de los perfiles de redes." },
  { clave: "datos", texto: "Sin datos de prospectos en documentos, pruebas ni capturas." },
];

export function pedidoCambioRegla(regla: string, cambio: string): string {
  return `Desde el cerebro, cambio de regla (PROPUESTA, no aplicar sin confirmación del dueño). Regla actual: «${regla}». Cambio que propone el dueño: ${cambio.trim()}\n\nQué hacer: dejarlo redactado como propuesta en cerebro/02-ordenes-vigentes.md y consultar antes de tocar reglas, bots o código.`;
}
