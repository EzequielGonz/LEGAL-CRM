import { buscarEnCerebro, type SeccionCerebro } from "@/lib/jarvis/cerebro-memoria";
import { seccionesDelCerebro } from "@/lib/jarvis/cerebro-memoria-servidor";
import { armarContexto } from "@/lib/oficina/contexto";

/**
 * Contexto real para Gemini en la Oficina (27/11, pedido del dueño: «el cerebro
 * conectáselo a Gemini y el mapa también, así tiene todo el contexto»).
 *
 * Gemini no ve el código ni las pantallas; sin esto inventaba botones, estados y
 * hasta reglas. Se le pasan las partes del cerebro y de los mapas (los informes
 * de Graphify viven en `cerebro/mapa-*`) que tocan el pedido, más las órdenes
 * vigentes. Solo los `.md` del repositorio: lo aprendido en la base se suma
 * cuando se pueda filtrar por rubro.
 */
export function contextoParaGemini(titulo: string, pedido: string): string {
  let secciones: SeccionCerebro[] = [];
  try {
    secciones = seccionesDelCerebro();
  } catch {
    return "";
  }
  const consulta = `${titulo} ${pedido}`;
  const esMapa = (s: SeccionCerebro) => s.archivo.startsWith("mapa-");
  const esOrden = (s: SeccionCerebro) => s.archivo.startsWith("02-ordenes-vigentes");
  // El negocio y cómo funciona el panel: van siempre primero.
  const esBase = (s: SeccionCerebro) => /^(01-negocio-y-marcas|03-crm-y-bots)/.test(s.archivo);
  // Afuera: charlas viejas (pueden nombrar personas), traspasos, bitácora y notas sobre el propio Claude.
  const esRuido = (s: SeccionCerebro) => /^(chats\/|traspaso-|bitacora|README|19-|20-|biblioteca\/prompt)/.test(s.archivo);
  return armarContexto({
    ordenes: buscarEnCerebro(secciones.filter(esOrden), consulta, 2, 1200),
    cerebro: [
      ...buscarEnCerebro(secciones.filter(esBase), consulta, 3, 1400),
      ...buscarEnCerebro(secciones.filter((s) => !esMapa(s) && !esOrden(s) && !esBase(s) && !esRuido(s)), consulta, 3, 1200),
    ],
    mapa: buscarEnCerebro(secciones.filter(esMapa), consulta, 2, 1000),
  });
}
