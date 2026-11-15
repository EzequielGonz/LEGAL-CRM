/**
 * Herramientas del asistente general para el Laboratorio del bot (15/11).
 * El asistente explica en simple y PROPONE: crear una versión, usarla en un
 * perfil o volver a la anterior quedan como propuesta que la responsable
 * confirma. Lo único que corre sin confirmar es la prueba simulada, que no
 * le escribe a nadie (charlas inventadas contra la IA, con tope diario).
 */
import { after } from "next/server";
import { resolverPerfil, NOMBRE_PERFIL } from "@/lib/asistente/general";
import type { SlugPerfil } from "@/lib/marca";
import { modelosDisponibles } from "./modelos";
import { diferenciasParaAplicar, leerSimulacion, listarSimulaciones, prepararSimulacion, resumenLaboratorio } from "./servicio";
import { aplicacionParaVolver, modeloEnPalabras, pedidoVersionDelAsistente, resumenPrueba, versionVigente, versionesDelPerfil } from "./simple";
import type { Rubro } from "./reglas";

export const TIPOS_LABORATORIO = ["version_bot_crear", "version_bot_usar", "version_bot_volver"] as const;

const PERFIL = { type: "string", description: "Perfil: juridico, coberturas_medicas, agencia_0km o marketing" };
const VERSION = { type: "integer", description: "Número de versión (por ejemplo 3 para v3)" };

export const DECLARACIONES_LABORATORIO = [
  {
    name: "versiones_bot",
    description: "Lista las versiones del bot de un perfil: cuál rige ahora y cuáles son nuevas (sin usar), y los modelos de IA disponibles. Solo lee.",
    parametersJsonSchema: { type: "object", properties: { perfil: PERFIL }, required: ["perfil"] },
  },
  {
    name: "proponer_version_bot",
    description:
      "Deja como PROPUESTA una versión NUEVA del bot de un perfil: copia de la que rige con los cambios pedidos (cómo habla, reglas extra, fichas nuevas y, si se pidió, otro modelo de la lista disponible). Al confirmar se crea, pero NO rige: sigue respondiendo la versión de hoy hasta que la responsable decida usarla.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        perfil: PERFIL,
        nombre: { type: "string", description: "Nombre corto y claro, por ejemplo «Más breve y cálida»" },
        que_cambia: { type: "string", description: "En una o dos frases simples, qué cambia respecto de la que rige" },
        tono: { type: "string", description: "Cómo tiene que hablar el bot (opcional)" },
        reglas: { type: "string", description: "Reglas extra, una por línea (opcional)" },
        fichas: {
          type: "array",
          description: "Fichas nuevas: respuestas preparadas para un tema o una objeción (opcional)",
          items: {
            type: "object",
            properties: {
              titulo: { type: "string" },
              tipo: { type: "string", description: "tema u objecion" },
              frases: { type: "array", items: { type: "string" }, description: "Frases de la persona que activan la ficha" },
              texto: { type: "string", description: "Qué tiene que saber o decir el bot" },
            },
            required: ["titulo", "frases", "texto"],
          },
        },
        modelo: { type: "string", description: "Solo si se pidió cambiar el modelo: uno de los disponibles (versiones_bot los lista)" },
      },
      required: ["perfil", "nombre", "que_cambia"],
    },
  },
  {
    name: "probar_version_bot",
    description:
      "Corre una prueba simulada de una versión con charlas inventadas: NO le escribe a nadie ni cambia nada. Tarda unos minutos; después usá resultado_prueba_bot. Tiene un tope diario porque usa la IA: no la corras sin que la responsable lo pida.",
    parametersJsonSchema: { type: "object", properties: { perfil: PERFIL, version: VERSION }, required: ["perfil", "version"] },
  },
  {
    name: "resultado_prueba_bot",
    description: "Lee el resultado de la última prueba simulada de un perfil (o de una versión): cuántas respuestas salieron bien y 2 o 3 ejemplos. Solo lee.",
    parametersJsonSchema: { type: "object", properties: { perfil: PERFIL, version: VERSION }, required: ["perfil"] },
  },
  {
    name: "proponer_usar_version",
    description: "Deja como PROPUESTA usar una versión en un perfil: al confirmar, el bot de ese perfil responde las charlas REALES con esa versión (en hasta 1 minuto). Se puede volver a la anterior.",
    parametersJsonSchema: { type: "object", properties: { perfil: PERFIL, version: VERSION }, required: ["perfil", "version"] },
  },
  {
    name: "proponer_volver_version",
    description: "Deja como PROPUESTA volver a la versión que regía antes del último cambio de versión de un perfil.",
    parametersJsonSchema: { type: "object", properties: { perfil: PERFIL }, required: ["perfil"] },
  },
];

export const NOMBRES_LABORATORIO = DECLARACIONES_LABORATORIO.map((d) => d.name);

export const REGLAS_LABORATORIO = [
  "LABORATORIO DEL BOT: para mejorar el bot de un perfil, explicá en simple y en pocas líneas (sin palabras técnicas como tokens, prompt, JSON, A/B o rubro). Pasos: 1) versiones_bot para ver cuál rige; 2) acordá qué cambiar (cómo habla, reglas, fichas, modelo); 3) proponer_version_bot (al confirmar se crea, pero no rige); 4) si la responsable quiere, probar_version_bot y después resultado_prueba_bot; 5) recién si ella lo pide, proponer_usar_version, avisando que cambia las charlas reales; 6) para deshacer, proponer_volver_version. Nunca apliques nada solo: todo queda como propuesta con «Confirmar».",
];

export interface CtxLaboratorio {
  guardar: (slug: SlugPerfil, tipo: string, titulo: string, resumen: string, payload: unknown) => Promise<{ id: string }>;
}

function perfilDe(args: Record<string, unknown>): Rubro | { error: string } {
  const r = resolverPerfil(args.perfil);
  return "error" in r ? { error: r.error } : (r.perfil as Rubro);
}

const nombreVersion = (v: { version: number; nombre: string }) => `«${v.nombre}» (v${v.version})`;

export async function ejecutarHerramientaLaboratorio(nombre: string, args: Record<string, unknown>, ctx: CtxLaboratorio): Promise<Record<string, unknown>> {
  const perfil = perfilDe(args);
  if (typeof perfil !== "string") return perfil;
  const nombrePerfil = NOMBRE_PERFIL[perfil as SlugPerfil] ?? perfil;
  const resumen = await resumenLaboratorio();
  const vigente = versionVigente(resumen.asignaciones, perfil);
  const lista = versionesDelPerfil(resumen.versiones, perfil, vigente, 10);
  const buscar = (v: unknown) => resumen.versiones.find((x) => x.version === Number(v));

  switch (nombre) {
    case "versiones_bot": {
      const { modelos } = await modelosDisponibles().catch(() => ({ modelos: [] as string[] }));
      return {
        perfil: nombrePerfil,
        rige_ahora: vigente,
        versiones: lista.map((v) => ({ version: v.version, nombre: v.nombre, que_cambia: v.descripcion, estado: v.rige ? "rige ahora" : "sin usar", modelo: v.modelo ? modeloEnPalabras(v.modelo).nombre : "el de siempre" })),
        modelos_disponibles: modelos.map((m) => ({ id: m, ...modeloEnPalabras(m) })),
        se_puede_volver: !!aplicacionParaVolver(resumen.aplicaciones, perfil),
      };
    }
    case "proponer_version_bot": {
      const { modelos } = await modelosDisponibles().catch(() => ({ modelos: [] as string[] }));
      const r = pedidoVersionDelAsistente(args, perfil, vigente, modelos);
      if (!r.ok) return { error: r.error };
      const titulo = `Versión nueva del bot: «${String(r.pedido.nombre)}»`;
      const texto = `${nombrePerfil}: copia de la v${vigente} que cambia ${r.cambios.join(", ")}. Al confirmar se crea, pero no rige: el bot sigue igual hasta que decidas usarla.`;
      const p = await ctx.guardar(perfil as SlugPerfil, "version_bot_crear", titulo, texto, { perfil, pedido: r.pedido });
      return { propuesta: p.id, resumen: texto, aviso: "Quedó como propuesta: falta que la responsable toque Confirmar." };
    }
    case "probar_version_bot": {
      const v = buscar(args.version);
      if (!v || (v.laboratorio && !v.rubros.includes(perfil))) return { error: "Esa versión no existe para este perfil." };
      const { id, completar } = await prepararSimulacion({ rubros: [perfil], version: v.version }, "asistente");
      after(completar);
      return { prueba: id, aviso: `La prueba de ${nombreVersion(v)} arrancó con charlas inventadas: no le escribe a nadie. Tarda unos minutos; pedime el resultado o miralo en «Versiones».` };
    }
    case "resultado_prueba_bot": {
      const version = args.version == null ? null : Number(args.version);
      const ultima = (await listarSimulaciones()).find(
        (s: any) => Array.isArray(s.pedido?.rubros) && s.pedido.rubros.includes(perfil) && (version == null || Number(s.pedido?.version) === version)
      );
      if (!ultima) return { resultado: "No hay pruebas de este perfil todavía." };
      const s: any = await leerSimulacion((ultima as any).id);
      if (s.estado === "procesando") return { estado: "Todavía está corriendo. Probá en un minuto." };
      if (s.estado === "error") return { estado: s.error ?? "La prueba no se pudo completar." };
      const r = resumenPrueba(s.resultado?.resultados ?? []);
      return { version: s.pedido?.version, resumen: r.frase, ejemplos: r.ejemplos };
    }
    case "proponer_usar_version": {
      const v = buscar(args.version);
      if (!v || !v.laboratorio || !v.rubros.includes(perfil) || v.estado === "archivada") return { error: "Solo se puede usar una versión nueva creada para este perfil." };
      if (v.version === vigente) return { resultado: "Esa versión ya rige en este perfil." };
      const dif = await diferenciasParaAplicar(perfil, v.version).catch(() => null);
      const texto = `${nombrePerfil}: el bot pasa de la v${vigente} a ${nombreVersion(v)} en las charlas REALES (en hasta 1 minuto). Podés volver a la anterior cuando quieras.`;
      const p = await ctx.guardar(perfil as SlugPerfil, "version_bot_usar", `Usar ${nombreVersion(v)} en ${nombrePerfil}`, texto, { perfil, version: v.version, desde: vigente, diferencias: dif });
      return { propuesta: p.id, resumen: texto, aviso: "Quedó como propuesta: el bot sigue igual hasta que se confirme." };
    }
    case "proponer_volver_version": {
      const a = aplicacionParaVolver(resumen.aplicaciones, perfil);
      if (!a) return { resultado: "No hay un cambio de versión reciente para deshacer en este perfil." };
      const texto = `${nombrePerfil}: el bot deja la v${vigente} y vuelve a la versión que regía antes del último cambio (en hasta 1 minuto).`;
      const p = await ctx.guardar(perfil as SlugPerfil, "version_bot_volver", `Volver a la versión anterior en ${nombrePerfil}`, texto, { perfil, aplicacion_id: a.id, version_actual: vigente });
      return { propuesta: p.id, resumen: texto };
    }
    default:
      return { error: "Herramienta desconocida." };
  }
}
