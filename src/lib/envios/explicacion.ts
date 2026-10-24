/**
 * Errores de envío de WhatsApp explicados para el panel (23/10, pedido de la
 * responsable): el número de error de Meta, qué significa, por qué ocurre y
 * qué hacer. Pura: sin red ni base.
 */
import { classifyMetaErrorCode } from "./errores";

export interface ExplicacionError {
  codigo: number | null;
  /** Nombre corto del error. */
  titulo: string;
  /** Por qué ocurre. */
  porque: string;
  /** Qué hacer. */
  queHacer: string;
  /** De quién es el problema: la cuenta/línea, la plantilla, el destinatario o Meta (temporal). */
  origen: "cuenta" | "plantilla" | "contacto" | "meta" | "desconocido";
}

const EXPLICACIONES: Record<number, Omit<ExplicacionError, "codigo" | "origen"> & { origen?: ExplicacionError["origen"] }> = {
  131042: {
    titulo: "Problema de pago de la cuenta de WhatsApp Business",
    porque: "Meta no entrega mensajes de plantilla cuando la cuenta de WhatsApp Business tiene pagos pendientes, la tarjeta fue rechazada, venció o no hay un método de pago válido. No es un problema del contacto: el mensaje no le llegó a nadie.",
    queHacer: "Entrar a Meta Business Suite → Configuración del negocio → Pagos (o WhatsApp Manager → Facturación), saldar la deuda o cargar una tarjeta válida. Después reanudar la campaña: los destinatarios afectados quedan pendientes y se vuelven a enviar.",
    origen: "cuenta",
  },
  131026: {
    titulo: "Mensaje no entregable",
    porque: "Meta no pudo entregarle el mensaje a ese número. Suele pasar si el número no tiene WhatsApp, tiene una versión vieja de la app, no aceptó las condiciones nuevas de WhatsApp o bloqueó a la empresa.",
    queHacer: "Nada desde el panel: ese número queda como fallido. Si es un cliente importante, contactarlo por otro medio.",
    origen: "contacto",
  },
  131049: {
    titulo: "Meta limitó el mensaje para cuidar la experiencia del usuario",
    porque: "Meta frena mensajes de marketing a personas que recibieron muchos mensajes de empresas en poco tiempo o que no suelen interactuar con ellos. Es un límite por persona, no un problema de la cuenta.",
    queHacer: "No reintentar enseguida: esperar unos días. Ayuda mandar menos mensajes por persona y usar plantillas más relevantes.",
    origen: "contacto",
  },
  130472: {
    titulo: "Número dentro de un experimento de Meta",
    porque: "Meta está probando con ese número no mostrarle mensajes de marketing de empresas. La persona no recibe la plantilla aunque el número esté bien.",
    queHacer: "Nada desde el panel. Ese número no va a recibir plantillas de marketing por un tiempo; si escribe primero, sí se le puede responder.",
    origen: "contacto",
  },
  131047: {
    titulo: "Pasaron más de 24 horas desde el último mensaje del cliente",
    porque: "WhatsApp solo deja mandar texto libre dentro de las 24 horas desde el último mensaje de la persona. Fuera de esa ventana hay que usar una plantilla aprobada.",
    queHacer: "Usar una plantilla aprobada o esperar a que la persona vuelva a escribir.",
    origen: "contacto",
  },
  131021: {
    titulo: "El destinatario es el mismo número que envía",
    porque: "Se intentó mandar el mensaje al propio número de la línea.",
    queHacer: "Revisar el teléfono cargado en ese contacto.",
    origen: "contacto",
  },
  131050: {
    titulo: "La persona dejó de recibir mensajes de marketing",
    porque: "El destinatario pidió en WhatsApp no recibir más mensajes de marketing de esta empresa.",
    queHacer: "No volver a escribirle con plantillas de marketing.",
    origen: "contacto",
  },
  131051: { titulo: "Tipo de mensaje no admitido", porque: "WhatsApp no acepta ese tipo de mensaje.", queHacer: "Avisar al programador.", origen: "desconocido" },
  131052: { titulo: "No se pudo descargar el archivo", porque: "Meta no pudo descargar la foto, el video o el documento adjunto.", queHacer: "Volver a enviar el archivo.", origen: "meta" },
  131053: { titulo: "No se pudo subir el archivo", porque: "El archivo adjunto no tiene un formato o tamaño que WhatsApp acepte.", queHacer: "Probar con otro archivo (foto hasta 5 MB, video hasta 16 MB).", origen: "contacto" },
  131000: { titulo: "Error interno de Meta", porque: "Falla momentánea de los servidores de Meta.", queHacer: "Reintentar más tarde.", origen: "meta" },
  131016: { titulo: "Servicio de WhatsApp no disponible", porque: "Meta tiene una caída temporal.", queHacer: "Reintentar más tarde.", origen: "meta" },
  131056: { titulo: "Demasiados mensajes a la misma persona", porque: "Se mandaron muchos mensajes seguidos al mismo número en poco tiempo.", queHacer: "Esperar unos minutos antes de volver a escribirle.", origen: "meta" },
  130429: { titulo: "Límite de velocidad de la línea", porque: "Se superó la cantidad de mensajes por segundo que permite Meta para esa línea.", queHacer: "El panel lo reintenta solo con más pausa entre envíos.", origen: "meta" },
  131048: { titulo: "Límite por spam", porque: "Meta limitó la línea porque muchos destinatarios bloquearon o reportaron los mensajes.", queHacer: "Pausar campañas, revisar la calidad de la base y de la plantilla, y esperar a que suba la calidad de la línea en WhatsApp Manager.", origen: "cuenta" },
  131031: { titulo: "Cuenta de WhatsApp bloqueada", porque: "Meta bloqueó la cuenta por incumplir políticas o por falta de verificación.", queHacer: "Revisar el estado de la cuenta en WhatsApp Manager y seguir los pasos que indique Meta.", origen: "cuenta" },
  131045: { titulo: "Número de la línea sin registrar", porque: "El número que envía no está registrado o perdió el registro en la API de WhatsApp.", queHacer: "Volver a registrar el número en WhatsApp Manager.", origen: "cuenta" },
  131005: { titulo: "Permiso denegado", porque: "El token no tiene permiso para mandar mensajes por esta línea.", queHacer: "Revisar el token y sus permisos en Meta (whatsapp_business_messaging).", origen: "cuenta" },
  131008: { titulo: "Falta un dato obligatorio en el mensaje", porque: "El mensaje salió sin un dato que WhatsApp exige.", queHacer: "Avisar al programador.", origen: "desconocido" },
  131009: { titulo: "Dato inválido en el mensaje", porque: "Algún dato del mensaje no tiene un valor válido.", queHacer: "Avisar al programador.", origen: "desconocido" },
  131057: { titulo: "Cuenta en mantenimiento", porque: "La cuenta de WhatsApp Business está en mantenimiento.", queHacer: "Esperar y reintentar más tarde.", origen: "cuenta" },
  133010: { titulo: "Número de la línea sin registrar", porque: "El número que envía no está registrado en la API de WhatsApp.", queHacer: "Registrar el número en WhatsApp Manager.", origen: "cuenta" },
  190: { titulo: "Token vencido o inválido", porque: "El token de acceso de Meta de esta línea venció o se revocó.", queHacer: "Generar un token nuevo y cargarlo en Vercel.", origen: "cuenta" },
  10: { titulo: "Permiso de la aplicación denegado", porque: "La aplicación de Meta no tiene el permiso necesario o el número no está habilitado.", queHacer: "Revisar permisos de la app en Meta.", origen: "cuenta" },
  368: { titulo: "Cuenta bloqueada temporalmente por políticas", porque: "Meta restringió la cuenta por incumplir políticas.", queHacer: "Revisar avisos de Meta en Business Suite.", origen: "cuenta" },
  132000: { titulo: "Cantidad de variables de la plantilla incorrecta", porque: "La plantilla espera otra cantidad de datos variables.", queHacer: "Revisar la plantilla de la campaña.", origen: "plantilla" },
  132001: { titulo: "La plantilla no existe", porque: "La plantilla no existe en ese idioma o todavía no está aprobada.", queHacer: "Revisar la plantilla en WhatsApp Manager.", origen: "plantilla" },
  132005: { titulo: "Texto de la plantilla demasiado largo", porque: "Con las variables completas, el mensaje supera el largo permitido.", queHacer: "Acortar los datos variables.", origen: "plantilla" },
  132007: { titulo: "La plantilla incumple políticas", porque: "El contenido de la plantilla viola políticas de WhatsApp.", queHacer: "Editar la plantilla.", origen: "plantilla" },
  132012: { titulo: "Formato de variables incorrecto", porque: "Los datos variables no tienen el formato que pide la plantilla.", queHacer: "Revisar la plantilla de la campaña.", origen: "plantilla" },
  132015: { titulo: "Plantilla pausada", porque: "Meta pausó la plantilla por baja calidad (muchos bloqueos o reportes).", queHacer: "Usar otra plantilla o editarla.", origen: "plantilla" },
  132016: { titulo: "Plantilla deshabilitada", porque: "Meta deshabilitó la plantilla por baja calidad.", queHacer: "Crear una plantilla nueva.", origen: "plantilla" },
};

function origenPorCodigo(code: number | null): ExplicacionError["origen"] {
  const k = classifyMetaErrorCode(code);
  return k === "contacto" ? "contacto" : k === "cuenta" ? "cuenta" : k === "plantilla" ? "plantilla" : k === "transitorio" ? "meta" : "desconocido";
}

/** Saca el código y el texto de Meta de lo guardado (JSON de errores, texto con «código N» o un número). */
export function leerErrorGuardado(guardado: unknown): { codigo: number | null; textoMeta: string | null } {
  if (guardado == null) return { codigo: null, textoMeta: null };
  let v: any = guardado;
  if (typeof v === "string") {
    const t = v.trim();
    if (t.startsWith("[") || t.startsWith("{")) {
      try {
        v = JSON.parse(t);
      } catch {
        // texto cortado: se busca el código a mano
        const m = /"code"\s*:\s*(\d+)/.exec(t);
        const titulo = /"title"\s*:\s*"([^"]+)"/.exec(t);
        return { codigo: m ? Number(m[1]) : null, textoMeta: titulo ? titulo[1] : null };
      }
    } else {
      const m = /c[oó]digo\s*(\d+)/i.exec(t) ?? /\berror\s+(\d{2,6})\b/i.exec(t) ?? /"code"\s*:\s*(\d+)/.exec(t) ?? /\((\d{3,6})\)/.exec(t);
      return { codigo: m ? Number(m[1]) : null, textoMeta: t.slice(0, 300) };
    }
  }
  const e = Array.isArray(v) ? v[0] : v?.error ?? v;
  const codigo = typeof e?.code === "number" ? e.code : Number.isFinite(Number(e?.code)) ? Number(e.code) : null;
  const textoMeta = (e?.error_data?.details as string) || (e?.title as string) || (e?.message as string) || null;
  return { codigo, textoMeta };
}

/** Explicación completa de un error guardado. */
export function explicarError(guardado: unknown): ExplicacionError {
  const { codigo, textoMeta } = leerErrorGuardado(guardado);
  const e = codigo !== null ? EXPLICACIONES[codigo] : undefined;
  if (e) return { codigo, origen: e.origen ?? origenPorCodigo(codigo), titulo: e.titulo, porque: e.porque, queHacer: e.queHacer };
  return {
    codigo,
    origen: origenPorCodigo(codigo),
    titulo: textoMeta ? `Meta informó: ${textoMeta.slice(0, 160)}` : "Meta no pudo entregar el mensaje",
    porque: codigo !== null ? "Error de Meta sin explicación cargada en el panel." : "Meta no informó el motivo.",
    queHacer: codigo !== null ? `Buscar el código ${codigo} en la documentación de errores de WhatsApp Cloud API o avisar al programador.` : "Revisar la conversación.",
  };
}

/** Línea corta para listas: «Error 131042 · Problema de pago…». */
export function lineaError(guardado: unknown): string {
  const x = explicarError(guardado);
  return `${x.codigo !== null ? `Error ${x.codigo} · ` : ""}${x.titulo}`;
}

/** ¿El problema es de la cuenta o la plantilla (no del destinatario)? */
export function esProblemaDeCuenta(guardado: unknown): boolean {
  const o = explicarError(guardado).origen;
  return o === "cuenta" || o === "plantilla";
}

export interface GrupoErrores extends ExplicacionError {
  cantidad: number;
}

/** Agrupa los errores guardados por código, de más a menos frecuente. */
export function agruparErrores(guardados: unknown[]): GrupoErrores[] {
  const grupos = new Map<string, GrupoErrores>();
  for (const g of guardados) {
    const x = explicarError(g);
    const k = x.codigo !== null ? String(x.codigo) : x.titulo;
    const prev = grupos.get(k);
    if (prev) prev.cantidad += 1;
    else grupos.set(k, { ...x, cantidad: 1 });
  }
  return Array.from(grupos.values()).sort((a, b) => b.cantidad - a.cantidad);
}
