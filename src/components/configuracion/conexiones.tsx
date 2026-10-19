/**
 * Etapa 3 · Conexiones: qué servicio está configurado y qué falta, sin
 * mostrar ningún valor. Solo lectura; los valores se cargan en el proveedor
 * de alojamiento, nunca en el panel ni en el chat.
 */
import { configuracionVertex, informeModeloActivo } from "@/lib/agentes/modelo";
import { configuracionSearchConsole } from "@/lib/seo/search-console";

function Fila({ nombre, ok, detalle }: { nombre: string; ok: boolean; detalle: string }) {
  return (
    <li className="flex items-start gap-2 py-1">
      <span aria-hidden="true" className={`mt-1 inline-block h-2.5 w-2.5 rounded-full ${ok ? "bg-emerald-500" : "bg-slate-300"}`} />
      <div>
        <p className="font-medium text-slate-800">
          {nombre} <span className="text-xs font-normal text-slate-500">· {ok ? "variables presentes" : "sin configurar"}</span>
        </p>
        <p className="text-xs text-slate-600">{detalle}</p>
      </div>
    </li>
  );
}

export function Conexiones() {
  const env = process.env;
  const modelo = informeModeloActivo(env);
  const vertex = configuracionVertex(env);
  const gsc = configuracionSearchConsole(env);
  const meta = !!(env.META_APP_SECRET || env.META_APP_SECRETS) && !!env.WHATSAPP_VERIFY_TOKEN;
  // Publicación en redes: se definirá la variable al recibir las cuentas (Metricool o Meta); hasta entonces, sin conexión.
  const metricool = !!(env.METRICOOL_API_TOKEN && env.METRICOOL_USER_ID);
  const cron = !!env.CRON_SECRET;
  return (
    <ul className="divide-y divide-slate-100 text-sm">
      <Fila nombre="WhatsApp (Meta): webhook y firma" ok={meta} detalle={meta ? "Variables del webhook presentes. Esto no dice si cada número está conectado en Meta: el estado real de cada línea se ve en Perfil y marca › Líneas de WhatsApp." : "Faltan la clave de la aplicación o el token de verificación."} />
      <Fila nombre={`Modelo de los agentes (${modelo.proveedor})`} ok={modelo.claveConfigurada} detalle={`Identificador: ${modelo.identificador} (${modelo.origen === "variable" ? "variable de entorno" : "valor por defecto del código"}). ${modelo.claveConfigurada ? "Clave presente." : "Sin clave: el simulador usa el generador simulado."}`} />
      <Fila nombre="Vertex AI (ajuste y modelo ajustado)" ok={vertex.configurado} detalle={vertex.configurado ? "Proyecto, región y cuenta de servicio presentes. Ningún trabajo se envía sin autorización con PIN y límite de gasto." : `Faltan: ${vertex.faltan.join(", ")}. Hasta entonces no hay ajuste real.`} />
      <Fila nombre="Instagram y Facebook (Metricool)" ok={metricool} detalle={metricool ? "Token presente. Publicar además exige la política del canal habilitada y el ejecutor encendido." : "Sin token: las piezas quedan «listas» y no se publican."} />
      <Fila nombre="Search Console (Google)" ok={gsc.habilitada} detalle={gsc.habilitada ? "Lista para conectar por perfil desde Contenido." : gsc.lista ? "Credenciales presentes pero sin habilitar." : `Faltan: ${gsc.faltan.join(", ")}.`} />
      <Fila nombre="Tarea programada (latido)" ok={cron} detalle={cron ? "Secreto configurado; la tarea externa se activa aparte y hoy está inactiva por decisión." : "Sin secreto: el latido no acepta llamadas."} />
      <li className="pt-2 text-xs text-slate-500">Ningún valor se muestra ni se escribe desde acá: se cargan en el alojamiento (Vercel) por la responsable o el programador.</li>
    </ul>
  );
}
