/**
 * Informe de mejoras del bot (14/11): texto para pedirle una propuesta al
 * asistente del panel. Sin dependencias, para poder usarlo en el navegador.
 */
export interface PropuestaTexto {
  titulo: string;
  por_que: string;
  disparadores: string[];
  contenido: string;
}

/** Texto para pedírselo al asistente del panel. Pura. */
export function pedidoParaAsistente(p: PropuestaTexto, destino: "conocimiento" | "rol"): string {
  const base = [
    `Del informe de mejoras del bot: «${p.titulo}».`,
    p.por_que ? `Por qué: ${p.por_que}` : "",
    "Texto propuesto:",
    p.contenido,
  ].filter(Boolean);
  if (destino === "rol") {
    return [...base, "", "Creá con esto un rol nuevo para el bot de este perfil (sin asignarlo todavía a ninguna base ni campaña). Si querés mejorar la redacción, mostrámela antes."].join("\n");
  }
  return [
    ...base,
    `Disparadores: ${p.disparadores.join(", ") || "(vale para todas las conversaciones)"}`,
    "",
    "Sumá esto al bot de este perfil como una ficha de conocimiento nueva, sin cambiar lo que ya tiene. Si ves algo que choque con la ficha del negocio o con las instrucciones, avisame antes.",
  ].join("\n");
}
