/**
 * Tablero de salud (16/10) — reglas puras. Cada control dice el estado
 * (rojo: frena la operación; amarillo: conviene mirarlo; verde: bien), qué
 * pasa en una frase y qué hacer, con un enlace para resolverlo.
 */

export type EstadoSalud = "rojo" | "amarillo" | "verde";

export interface ItemSalud {
  clave: string;
  estado: EstadoSalud;
  titulo: string;
  detalle: string;
  accion?: string;
  href?: string;
}

export interface DatosSalud {
  ahora: Date;
  /** Última vez que corrió el latido del servidor (null = nunca registrado). */
  ultimoLatido: string | null;
  pausa: { ia: boolean; envios: boolean; problema?: string | null };
  /** Webhooks en cuarentena sin revisar en las últimas 24 h, con su motivo más reciente. */
  cuarentena24h: { cantidad: number; motivo: string | null };
  secretoMeta: boolean;
  ultimoEntrante: string | null;
  /** Por perfil: nombre visible, credenciales de WhatsApp y agente. */
  perfiles: { slug: string; nombre: string; whatsapp: boolean; agenteActivo: boolean; agenteListo: boolean; faltante: string[] }[];
  /** Turnos del agente con error en las últimas 24 h y total de turnos. */
  turnos24h: { errores: number; total: number };
  incidentesFatales: number;
  presupuestosAtrasados: number;
  vertexConfigurado: boolean;
}

const MIN = 60_000;

function haceTexto(desde: Date, ahora: Date): string {
  const m = Math.round((ahora.getTime() - desde.getTime()) / MIN);
  if (m < 1) return "hace menos de un minuto";
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 48) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} días`;
}

export function evaluarSalud(d: DatosSalud): ItemSalud[] {
  const items: ItemSalud[] = [];

  // Latido del servidor
  if (!d.ultimoLatido) {
    items.push({ clave: "latido", estado: "rojo", titulo: "Latido del servidor sin registros", detalle: "No hay informes, seguimientos, extracciones ni campañas mientras no corra.", accion: "Activar la tarea «campaigns-tick» en Supabase", href: "/configuracion#tareas" });
  } else {
    const ult = new Date(d.ultimoLatido);
    const atraso = d.ahora.getTime() - ult.getTime();
    items.push(
      atraso > 5 * MIN
        ? { clave: "latido", estado: "rojo", titulo: "El latido del servidor se detuvo", detalle: `Último latido ${haceTexto(ult, d.ahora)}.`, accion: "Revisar la tarea «campaigns-tick» y CRON_SECRET", href: "/configuracion#tareas" }
        : { clave: "latido", estado: "verde", titulo: "Latido del servidor", detalle: `Último latido ${haceTexto(ult, d.ahora)}.` }
    );
  }

  // Pausa general
  if (d.pausa.problema) {
    items.push({ clave: "pausa", estado: "rojo", titulo: "No se pudo leer la pausa general", detalle: d.pausa.problema, accion: "Revisar la pausa general", href: "/configuracion#pausa" });
  } else if (d.pausa.ia || d.pausa.envios) {
    const que = [d.pausa.ia ? "respuestas de la IA" : null, d.pausa.envios ? "envíos automáticos" : null].filter(Boolean).join(" y ");
    items.push({ clave: "pausa", estado: "amarillo", titulo: "Pausa general activa", detalle: `En pausa: ${que}.`, accion: "Levantar la pausa", href: "/configuracion#pausa" });
  } else {
    items.push({ clave: "pausa", estado: "verde", titulo: "Pausa general", detalle: "Sin pausa: la IA responde y las automatizaciones habilitadas corren." });
  }

  // Webhooks (mensajes entrantes)
  if (!d.secretoMeta) {
    items.push({ clave: "secreto_meta", estado: "rojo", titulo: "Falta el secreto de la app de Meta", detalle: "Sin META_APP_SECRET los mensajes entrantes quedan en cuarentena y nadie los responde.", accion: "Cargar META_APP_SECRET en Vercel (Meta → App → Configuración básica → Clave secreta)" });
  }
  if (d.cuarentena24h.cantidad > 0) {
    items.push({ clave: "cuarentena", estado: "rojo", titulo: `${d.cuarentena24h.cantidad} mensaje(s) entrante(s) en cuarentena`, detalle: d.cuarentena24h.motivo ?? "Webhook rechazado.", accion: "Revisar la cuarentena", href: "/configuracion#cuarentena" });
  } else if (d.secretoMeta) {
    items.push({ clave: "cuarentena", estado: "verde", titulo: "Webhooks", detalle: "Sin mensajes en cuarentena en las últimas 24 h." });
  }

  // Último mensaje entrante
  if (d.ultimoEntrante) {
    const ult = new Date(d.ultimoEntrante);
    const horas = (d.ahora.getTime() - ult.getTime()) / 3_600_000;
    items.push(
      horas > 48
        ? { clave: "entrantes", estado: "amarillo", titulo: "No entran mensajes", detalle: `Último mensaje recibido ${haceTexto(ult, d.ahora)}.`, accion: "Revisar webhooks y líneas", href: "/inbox" }
        : { clave: "entrantes", estado: "verde", titulo: "Mensajes entrantes", detalle: `Último recibido ${haceTexto(ult, d.ahora)}.` }
    );
  } else {
    items.push({ clave: "entrantes", estado: "amarillo", titulo: "Todavía no entró ningún mensaje", detalle: "Sin mensajes entrantes registrados." });
  }

  // Perfiles: línea de WhatsApp y agente
  for (const p of d.perfiles) {
    if (!p.whatsapp) {
      items.push({ clave: `whatsapp_${p.slug}`, estado: "amarillo", titulo: `${p.nombre}: sin línea de WhatsApp`, detalle: "Faltan las credenciales de la línea en Vercel: no puede responder ni enviar por WhatsApp.", accion: "Cargar la línea", href: p.slug === "juridico" ? "/configuracion" : `/panel/${p.slug}/configuracion` });
    }
    if (!p.agenteListo) {
      items.push({ clave: `agente_${p.slug}`, estado: "rojo", titulo: `${p.nombre}: el agente no puede responder`, detalle: `Falta: ${p.faltante.join(", ")}.`, accion: "Completar el perfil", href: p.slug === "juridico" ? "/configuracion" : `/panel/${p.slug}/configuracion` });
    } else if (!p.agenteActivo) {
      items.push({ clave: `agente_${p.slug}`, estado: "amarillo", titulo: `${p.nombre}: agente apagado`, detalle: "Los mensajes quedan para atención manual.", accion: "Encender el agente", href: p.slug === "juridico" ? "/agentes" : `/panel/${p.slug}/agentes` });
    }
  }

  // Calidad de las respuestas
  if (d.turnos24h.errores > 0) {
    const alto = d.turnos24h.total > 0 && d.turnos24h.errores / d.turnos24h.total > 0.1;
    items.push({ clave: "errores_ia", estado: alto ? "rojo" : "amarillo", titulo: `${d.turnos24h.errores} respuesta(s) de la IA con error en 24 h`, detalle: `De ${d.turnos24h.total} turnos.`, accion: "Ver en Comparación de agentes", href: "/comparacion-agentes" });
  }
  if (d.incidentesFatales > 0) {
    items.push({ clave: "incidentes", estado: "rojo", titulo: `${d.incidentesFatales} incidente(s) fatal(es) sin resolver`, detalle: "Un candidato de la comparación quedó detenido.", accion: "Revisar incidentes", href: "/comparacion-agentes" });
  }
  if (d.presupuestosAtrasados > 0) {
    items.push({ clave: "presupuestos", estado: "rojo", titulo: `${d.presupuestosAtrasados} presupuesto(s) pedido(s) hace más de 20 h`, detalle: "Se prometió en menos de 24 h.", accion: "Cargar presupuesto", href: "/panel/marketing/presupuestos" });
  }
  if (!d.vertexConfigurado) {
    items.push({ clave: "vertex", estado: "amarillo", titulo: "Candidato C sin configurar", detalle: "Faltan las variables de Google Cloud para el modelo ajustado; compiten A y B.", accion: "Ver la guía", href: "/comparacion-agentes" });
  }

  const orden: Record<EstadoSalud, number> = { rojo: 0, amarillo: 1, verde: 2 };
  return items.sort((a, b) => orden[a.estado] - orden[b.estado]);
}

export function resumenSalud(items: ItemSalud[]): { rojo: number; amarillo: number; verde: number } {
  return {
    rojo: items.filter((i) => i.estado === "rojo").length,
    amarillo: items.filter((i) => i.estado === "amarillo").length,
    verde: items.filter((i) => i.estado === "verde").length,
  };
}
