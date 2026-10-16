/**
 * Etapa 3 · Simulador (cap. 18): corre una conversación con datos sintéticos
 * contra el modelo actual, un candidato o un guion simulado, con
 * HERRAMIENTAS SIMULADAS en memoria. No escribe mensajes, citas, captaciones
 * ni detenciones reales; solo guarda la corrida y sus turnos en
 * `simulation_runs` / `simulation_turns` para revisar, corregir y guardar
 * ejemplos candidatos. Los efectos esperados quedan en un estado en memoria
 * que después evalúan los controles deterministas.
 */

import { armarContexto, armarResumen, type ResumenOportunidad } from "@/lib/agentes/contexto";
import { instruccionReparacion, normalizarSalida, validarTextoSalida, type SalidaAgente } from "@/lib/agentes/contrato";
import type { Modo, ModuloSemilla } from "@/lib/agentes/modulos";
import type { Generador } from "@/lib/agentes/modelo";
import { clasificarAtencion, evaluarCaptacion, type RubroSlug } from "@/lib/captacion/reglas";
import { toolsForArea } from "@/lib/ai-agent/tools";
import type { Area } from "@/lib/supabase/database.types";

export interface EstadoSimulado {
  captado: boolean;
  evidenciaCaptacion: string | null;
  advertencias: string[];
  zona: "amba" | "fuera" | "sin_confirmar";
  detenido: null | string;
  atencionHumana: null | string;
  chatPausado: boolean;
  citas: { inicio: string; tipo: "ia" | "profesional" }[];
  rutaJuridica: null | "fases" | "directa";
  datos: Record<string, unknown>;
  herramientasFallidas: string[];
  acciones: { herramienta: string; argumentos: Record<string, unknown>; resultado: unknown }[];
}

export interface TurnoSimulado {
  orden: number;
  rol: "prospecto" | "asesor" | "sistema";
  texto: string | null;
  acciones: SalidaAgente["acciones"];
  datos: Record<string, unknown>;
  validacion: { ok: boolean; motivos: string[]; reparado?: boolean; retenido?: boolean };
}

export interface ResultadoSimulacion {
  turnos: TurnoSimulado[];
  estado: EstadoSimulado;
  modulosUsados: string[];
  tokens: { entrada: number; salida: number };
}

export interface OpcionesSimulacion {
  rubro: RubroSlug;
  area: Area;
  modo: Modo;
  identidad: { presentationName: string; brandName: string };
  instruccionesAgente?: string | null;
  hechosPerfil?: string[];
  hechos?: Record<string, unknown>;
  /** Mensajes de la persona, en orden; el asesor responde a cada uno. */
  mensajesProspecto: string[];
  /** Si el modo es frío, el primer mensaje del asesor (plantilla) ya se envió. */
  aperturaEnviada?: string | null;
  modulos?: ModuloSemilla[];
  /** Herramientas que deben fallar (para probar que no se finge éxito). */
  fallar?: string[];
  maxIteraciones?: number;
}

function estadoInicial(hechos: Record<string, unknown> = {}): EstadoSimulado {
  return {
    captado: false,
    evidenciaCaptacion: null,
    advertencias: [],
    zona: hechos.zona === "amba" || hechos.zona === "fuera" ? (hechos.zona as any) : "sin_confirmar",
    detenido: null,
    atencionHumana: null,
    chatPausado: false,
    citas: [],
    rutaJuridica: null,
    datos: { ...((hechos.datos as Record<string, unknown>) ?? {}) },
    herramientasFallidas: [],
    acciones: [],
  };
}

/** Herramientas simuladas: mismas reglas que el servidor, sin base. */
function ejecutarHerramientaSimulada(nombre: string, args: Record<string, unknown>, st: EstadoSimulado, rubro: RubroSlug, fallar: string[]): { output: unknown; pausa?: boolean } {
  if (fallar.includes(nombre)) {
    st.herramientasFallidas.push(nombre);
    return { output: { error: "La herramienta no respondió (simulado). No confirmes nada." } };
  }
  switch (nombre) {
    case "guardar_datos_calificacion":
      Object.assign(st.datos, (args.datos as object) ?? {});
      return { output: { ok: true } };
    case "evaluar_calificacion":
      return { output: { ok: true } };
    case "consultar_disponibilidad":
      return { output: { slots: [{ starts_at: "2026-10-20T13:00:00.000Z", ends_at: "2026-10-20T13:30:00.000Z", etiqueta: "martes 20/10 10:00" }] } };
    case "agendar_cita":
      st.citas.push({ inicio: String(args.starts_at ?? ""), tipo: "profesional" });
      return { output: { ok: true, appointment_id: "sim-cita" } };
    case "programar_fase2":
      st.citas.push({ inicio: typeof args.horario === "string" ? args.horario : "en 2 minutos", tipo: "ia" });
      return { output: { ok: true, cita_id: "sim-fase2", nota: "Agendar no capta." } };
    case "elegir_ruta_juridica":
      st.rutaJuridica = args.ruta === "directa" ? "directa" : "fases";
      return { output: { ok: true, ruta: st.rutaJuridica } };
    case "registrar_ubicacion":
      st.zona = args.zona === "amba" || args.zona === "fuera" ? (args.zona as any) : "sin_confirmar";
      return { output: { ok: true, zona: st.zona } };
    case "captar": {
      if (args.solo_precio === true) {
        st.atencionHumana = "precio_fuera_alcance";
        st.chatPausado = true;
        return { output: { ok: true, captado: false, instruccion: "Avisale que una persona del equipo le responde." }, pausa: true };
      }
      const ev = evaluarCaptacion({ rubro, aceptacion: args.aceptacion === true, evidencia: String(args.evidencia ?? ""), datos: st.datos, zona: st.zona });
      if (!ev.captar) return { output: { ok: false, captado: false, motivo: ev.motivo } };
      st.captado = true;
      st.evidenciaCaptacion = String(args.evidencia ?? "");
      st.advertencias = ev.advertencias;
      st.chatPausado = true;
      return { output: { ok: true, captado: true, advertencias: ev.advertencias }, pausa: true };
    }
    case "detener_contacto": {
      const t = clasificarAtencion(args.motivo);
      if (!t.detener) return { output: { error: "Motivo de detención no válido." } };
      st.detenido = t.detener;
      st.chatPausado = true;
      return { output: { ok: true, instruccion: "Respondé solo una disculpa breve." }, pausa: true };
    }
    case "escalar_a_humano": {
      const t = clasificarAtencion(args.categoria ?? "pide_persona");
      st.atencionHumana = t.motivo;
      if (t.detener) st.detenido = t.detener;
      st.chatPausado = t.pausarChat;
      return { output: { ok: true }, pausa: t.pausarChat };
    }
    case "finalizar_consulta": {
      if (args.resultado === "completado") {
        st.captado = true;
        st.evidenciaCaptacion = "Aceptó el contacto del profesional";
        st.chatPausado = true;
        return { output: { ok: true }, pausa: true };
      }
      st.detenido = args.resultado === "caso_resuelto" ? "necesidad_resuelta" : "desinteres";
      st.chatPausado = true;
      return { output: { ok: true }, pausa: true };
    }
    case "registrar_resultado_marketing": {
      if (args.resultado === "aprobado") {
        st.captado = true;
        st.evidenciaCaptacion = String(args.motivo ?? "aprobado");
        st.chatPausado = true;
        return { output: { ok: true }, pausa: true };
      }
      if (args.resultado === "no_interesado") {
        st.detenido = "desinteres";
        st.chatPausado = true;
        return { output: { ok: true }, pausa: true };
      }
      return { output: { ok: true } };
    }
    case "analizar_negocio":
      return { output: { puntaje_oportunidad: 60, hallazgos: [{ problema: "Contacto poco visible en el móvil (observado el 10/10)", impacto: "Puede dificultar consultas", mejora: "Evaluar un acceso directo" }], nota: "Presentá solo estos hallazgos." } };
    default:
      return { output: { error: `Herramienta desconocida: ${nombre}` } };
  }
}

export async function simularConversacion(opts: OpcionesSimulacion, generar: Generador): Promise<ResultadoSimulacion> {
  const st = estadoInicial(opts.hechos);
  const turnos: TurnoSimulado[] = [];
  const contents: { role: "user" | "model"; parts: any[] }[] = [];
  const tokens = { entrada: 0, salida: 0 };
  const modulosUsados = new Set<string>();
  let orden = 0;
  if (opts.aperturaEnviada) {
    contents.push({ role: "model", parts: [{ text: opts.aperturaEnviada }] });
    turnos.push({ orden: ++orden, rol: "asesor", texto: opts.aperturaEnviada, acciones: [], datos: {}, validacion: { ok: true, motivos: [] } });
  }
  const tools = toolsForArea(opts.area);
  const fallar = opts.fallar ?? [];

  for (let i = 0; i < opts.mensajesProspecto.length; i++) {
    const msg = opts.mensajesProspecto[i];
    contents.push({ role: "user", parts: [{ text: msg }] });
    turnos.push({ orden: ++orden, rol: "prospecto", texto: msg, acciones: [], datos: {}, validacion: { ok: true, motivos: [] } });
    if (st.chatPausado) {
      // La IA no responde más en ese chat: queda registrado para una persona.
      turnos.push({ orden: ++orden, rol: "sistema", texto: st.captado ? "Mensaje posterior de un captado: atención humana prioritaria, sin respuesta automática." : "Chat pausado (persona o detención): sin respuesta automática.", acciones: [], datos: {}, validacion: { ok: true, motivos: [] } });
      continue;
    }
    const resumen: ResumenOportunidad = armarResumen({ rubro: opts.rubro, qualificationData: st.datos, zona: st.zona, captado: st.captado, evidencia: st.evidenciaCaptacion });
    const ctx = armarContexto({
      rubro: opts.rubro,
      modo: opts.modo,
      identidad: opts.identidad,
      instruccionesAgente: opts.instruccionesAgente,
      hechosPerfil: opts.hechosPerfil,
      resumen,
      ultimoMensaje: msg,
      primerTurno: i === 0,
      modulos: opts.modulos,
    });
    ctx.modulos.forEach((m) => modulosUsados.add(m));

    let texto = "";
    let reparado = false;
    let retenido = false;
    const accionesTurno: SalidaAgente["acciones"] = [];
    const datosTurno: Record<string, unknown> = {};
    let motivos: string[] = [];
    for (let it = 0; it < (opts.maxIteraciones ?? 6); it++) {
      const r = await generar({ contents, systemInstruction: ctx.systemInstruction, tools });
      tokens.entrada += r.tokensEntrada ?? 0;
      tokens.salida += r.tokensSalida ?? 0;
      const salida = normalizarSalida(r.parts, [msg]);
      texto = salida.texto;
      Object.assign(datosTurno, salida.datos);
      if (salida.acciones.length === 0) break;
      contents.push({ role: "model", parts: r.parts });
      const responses: any[] = [];
      let pausa = false;
      for (const a of salida.acciones) {
        const res = ejecutarHerramientaSimulada(a.herramienta, a.argumentos, st, opts.rubro, fallar);
        st.acciones.push({ herramienta: a.herramienta, argumentos: a.argumentos, resultado: res.output });
        accionesTurno.push(a);
        responses.push({ functionResponse: { ...(a.id ? { id: a.id } : {}), name: a.herramienta, response: res.output } });
        if (res.pausa) pausa = true;
      }
      contents.push({ role: "user", parts: responses });
      if (pausa && it === (opts.maxIteraciones ?? 6) - 1) break;
    }
    // Validación determinista del texto antes de «enviar».
    let v = validarTextoSalida(texto);
    if (!v.ok && texto) {
      contents.push({ role: "user", parts: [{ text: instruccionReparacion(v) }] });
      const r2 = await generar({ contents, systemInstruction: ctx.systemInstruction, tools });
      const s2 = normalizarSalida(r2.parts, [msg]);
      const v2 = validarTextoSalida(s2.texto);
      if (v2.ok) {
        texto = s2.texto;
        reparado = true;
        v = v2;
      } else {
        retenido = true;
        motivos = v2.motivos;
        st.atencionHumana = st.atencionHumana ?? "consulta_fuera_alcance";
        st.chatPausado = true;
      }
    }
    if (!retenido) motivos = v.motivos;
    if (texto && !retenido) contents.push({ role: "model", parts: [{ text: texto }] });
    turnos.push({
      orden: ++orden,
      rol: "asesor",
      texto: retenido ? null : texto || null,
      acciones: accionesTurno,
      datos: datosTurno,
      validacion: { ok: !retenido, motivos, reparado, retenido },
    });
  }
  return { turnos, estado: st, modulosUsados: Array.from(modulosUsados), tokens };
}
