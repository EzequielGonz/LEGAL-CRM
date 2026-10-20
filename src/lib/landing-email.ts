/**
 * Aviso por correo de los formularios de las landings (20/10).
 *
 * Cuando entra una consulta por el formulario de una landing, además de
 * guardarla en el CRM se avisa por correo a la casilla del rubro. Funciones
 * puras (sin base de datos) más un envío por la API de Resend con `fetch`.
 *
 * Reglas:
 *  - Es un aviso, no el registro: si falla o no hay clave, el CRM igual guarda
 *    la consulta y la landing recibe «ok».
 *  - No se registran en logs datos personales del contacto.
 *  - Sin RESEND_API_KEY o sin LANDING_EMAIL_FROM no se envía nada.
 */

/** Casilla de destino por perfil (las claves son las áreas del CRM). */
export const DESTINOS_CORREO: Record<string, string> = {
  civil: "estudiojuridicointegralvita@gmail.com",
  penal: "estudiojuridicointegralvita@gmail.com",
  agencia_0km: "autoskocos@hotmail.com",
  coberturas_medicas: "comparatuobrasocial@hotmail.com",
  marketing: "agenciakocos@hotmail.com",
};

/** Nombre de la marca de cada landing, para el asunto y el cuerpo. */
export const MARCA_CORREO: Record<string, string> = {
  civil: "Estudio Jurídico Vita",
  penal: "Estudio Jurídico Vita",
  agencia_0km: "Agencia Kocos",
  coberturas_medicas: "Compara Tu Obra Social",
  marketing: "Kocos Marketing",
};

export interface LeadParaCorreo {
  area: string;
  nombre: string;
  telefono: string;
  email: string | null;
  consulta: string;
  pagina: string | null;
  /** Red desde la que llegó la visita (Instagram, Facebook, Google, TikTok). */
  llegada?: string | null;
}

export interface CorreoLanding {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo: string | null;
}

export function escaparHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function esCorreoValido(v: unknown): v is string {
  return typeof v === "string" && v.length <= 200 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v);
}

/** Saca saltos de línea de un valor que va en el asunto (evita inyección de encabezados). */
function enUnaLinea(s: string, max: number): string {
  return s.replace(/[\r\n]+/g, " ").trim().slice(0, max);
}

/** Arma el correo del aviso. Devuelve null si el área no tiene destino. */
export function armarCorreoLanding(lead: LeadParaCorreo): CorreoLanding | null {
  const to = DESTINOS_CORREO[lead.area];
  if (!to) return null;
  const marca = MARCA_CORREO[lead.area] ?? "Landing";
  const nombre = enUnaLinea(lead.nombre, 80) || "(sin nombre)";
  const lineas: [string, string][] = [
    ["Nombre", nombre],
    ["Teléfono", enUnaLinea(lead.telefono, 40) || "(no informado)"],
    ["Correo", lead.email && esCorreoValido(lead.email) ? lead.email : "(no informado)"],
    ["Página", lead.pagina ? enUnaLinea(lead.pagina, 200) : "Inicio"],
    ["Llegó desde", lead.llegada ? enUnaLinea(lead.llegada, 40) : "No informado"],
  ];
  const consulta = lead.consulta.trim().slice(0, 5000) || "(sin mensaje)";

  const text = [
    `Nueva consulta desde la landing de ${marca}`,
    "",
    ...lineas.map(([k, v]) => `${k}: ${v}`),
    "",
    "Consulta:",
    consulta,
    "",
    "La consulta también quedó guardada en el CRM.",
  ].join("\n");

  const filas = lineas
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#555"><b>${escaparHtml(k)}</b></td><td style="padding:4px 0">${escaparHtml(v)}</td></tr>`)
    .join("");
  const html =
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#111">` +
    `<h2 style="margin:0 0 12px">Nueva consulta · ${escaparHtml(marca)}</h2>` +
    `<table style="border-collapse:collapse">${filas}</table>` +
    `<p style="margin:16px 0 4px"><b>Consulta</b></p>` +
    `<p style="margin:0;white-space:pre-wrap">${escaparHtml(consulta)}</p>` +
    `<p style="margin:16px 0 0;color:#777;font-size:13px">La consulta también quedó guardada en el CRM.</p>` +
    `</div>`;

  return {
    to,
    subject: `Nueva consulta · ${marca} · ${nombre}`,
    text,
    html,
    replyTo: lead.email && esCorreoValido(lead.email) ? lead.email : null,
  };
}

export interface ConfigCorreo {
  apiKey: string | undefined;
  from: string | undefined;
}

export type ResultadoCorreo = { enviado: true } | { enviado: false; motivo: string };

/** Envía el correo por Resend. Nunca lanza: devuelve el motivo si no salió. */
export async function enviarCorreoLanding(
  correo: CorreoLanding,
  config: ConfigCorreo,
  fetchImpl: typeof fetch = fetch
): Promise<ResultadoCorreo> {
  if (!config.apiKey || !config.from) return { enviado: false, motivo: "sin_configuracion" };
  try {
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: config.from,
        to: [correo.to],
        subject: correo.subject,
        text: correo.text,
        html: correo.html,
        ...(correo.replyTo ? { reply_to: correo.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { enviado: false, motivo: `respuesta_${res.status}` };
    return { enviado: true };
  } catch (err) {
    return { enviado: false, motivo: err instanceof Error ? err.name : "error" };
  }
}
