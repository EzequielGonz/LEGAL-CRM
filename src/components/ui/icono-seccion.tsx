/**
 * Familia de íconos de línea (16/10). Grilla de 24, trazo 1,6 con remates
 * redondos y una segunda capa de relleno al 14 % que les da cuerpo. Un solo
 * juego para el menú de los cuatro perfiles y para las acciones.
 */
type Dibujo = { l: string; r?: string };

const DIBUJOS: Record<string, Dibujo> = {
  inicio: { l: "M4 11 12 4.5 20 11M6 9.5V19a1.5 1.5 0 0 0 1.5 1.5H10v-5.5h4v5.5h2.5A1.5 1.5 0 0 0 18 19V9.5", r: "M6 9.5 12 4.5 18 9.5V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19Z" },
  estadisticas: { l: "M4 20h16M7 16.5V11M12 16.5V6.5M17 16.5v-4", r: "M10.5 6.5h3V17h-3zM5.5 11h3v6h-3zM15.5 12.5h3V17h-3z" },
  salud: { l: "M3.5 12.5h3.2l2-4.5 3.4 9 2.4-6 1.3 1.5h4.7", r: "M12 20.5c-4.8-3-8.5-6.3-8.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 8.5 2.7c0 3.9-3.7 7.2-8.5 10.2Z" },
  inbox: { l: "M4 13.5 6.4 6.2A1.8 1.8 0 0 1 8.1 5h7.8a1.8 1.8 0 0 1 1.7 1.2L20 13.5M4 13.5V18a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 18v-4.5M4 13.5h4.5l1 2h5l1-2H20", r: "M4 13.5h4.5l1 2h5l1-2H20V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18Z" },
  consultas: { l: "M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-7l-4 3.5v-3.5H5A1.5 1.5 0 0 1 3.5 15V7A1.5 1.5 0 0 1 5 5.5ZM8 10h8M8 13h5", r: "M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-7l-4 3.5v-3.5H5A1.5 1.5 0 0 1 3.5 15V7A1.5 1.5 0 0 1 5 5.5Z" },
  objetivo: { l: "M12 20.5a8.5 8.5 0 1 1 8.5-8.5M12 16.5a4.5 4.5 0 1 1 4.5-4.5M12 12l7-7M16 5h3v3", r: "M12 16.5a4.5 4.5 0 1 1 4.5-4.5 4.5 4.5 0 0 1-4.5 4.5Z" },
  prospectos: { l: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM3 20a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.5a5 5 0 0 1 3 5.5", r: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" },
  seguimiento: { l: "M19.5 8.5A8 8 0 0 0 5 7.2M4.5 15.5A8 8 0 0 0 19 16.8M19.5 4v4.5H15M4.5 20v-4.5H9", r: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" },
  agenda: { l: "M5 6h14a1.5 1.5 0 0 1 1.5 1.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7.5A1.5 1.5 0 0 1 5 6ZM3.5 10.5h17M8 3.5V7M16 3.5V7M8 14h2M14 14h2M8 17h2", r: "M5 6h14a1.5 1.5 0 0 1 1.5 1.5v3h-17v-3A1.5 1.5 0 0 1 5 6Z" },
  cerrados: { l: "M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17ZM8.3 12.3l2.5 2.5 5-5.3", r: "M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17Z" },
  presupuesto: { l: "M7 3.5h7.5l3.5 3.5v13.5H7a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 7 3.5ZM14.5 3.5V7H18M9 11h6M9 14h6M9 17h3.5", r: "M14.5 3.5V7H18Z" },
  bases: { l: "M12 9.5c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3ZM4 6.5v11c0 1.7 3.6 3 8 3s8-1.3 8-3v-11M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3", r: "M12 9.5c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3Z" },
  extraer: { l: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM15.3 15.3 20.5 20.5M10.5 7.5v6M7.5 10.5h6", r: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z" },
  campanas: { l: "M4 10v4a1 1 0 0 0 1 1h2.5L14 19.5v-15L7.5 9H5a1 1 0 0 0-1 1ZM17.5 9a4 4 0 0 1 0 6M8 15l1.3 4.5", r: "M14 4.5v15L7.5 15V9Z" },
  captacion: { l: "M4 5h16l-6 7.5V19l-4 1.5v-8Z", r: "M4 5h16l-6 7.5V19l-4 1.5v-8Z" },
  contenido: { l: "M6.5 3.5h8l4 4v12a1.5 1.5 0 0 1-1.5 1.5h-10.5A1.5 1.5 0 0 1 5 19.5V5A1.5 1.5 0 0 1 6.5 3.5ZM14.5 3.5v4h4M8.5 12.5h7M8.5 16h4.5", r: "M14.5 3.5v4h4Z" },
  comparacion: { l: "M12 4v16M8.5 20h7M5 7h14M5 7l-2.5 6a2.5 2.5 0 0 0 5 0ZM19 7l-2.5 6a2.5 2.5 0 0 0 5 0Z", r: "M2.5 13a2.5 2.5 0 0 0 5 0ZM16.5 13a2.5 2.5 0 0 0 5 0Z" },
  agentes: { l: "M7.5 8h9A2.5 2.5 0 0 1 19 10.5v6a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 16.5v-6A2.5 2.5 0 0 1 7.5 8ZM12 4v4M9.5 13h.01M14.5 13h.01M10 16h4M3 12v3M21 12v3", r: "M7.5 8h9A2.5 2.5 0 0 1 19 10.5v6a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 16.5v-6A2.5 2.5 0 0 1 7.5 8Z" },
  revision: { l: "M12 3.5 19 6v5.5c0 4.3-3 7.6-7 9-4-1.4-7-4.7-7-9V6ZM9 12l2 2 4-4.5", r: "M12 3.5 19 6v5.5c0 4.3-3 7.6-7 9-4-1.4-7-4.7-7-9V6Z" },
  configuracion: { l: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 13.5l1.6 1-2 3.4-1.8-.6a7.5 7.5 0 0 1-2.2 1.3L14.6 20.5h-4l-.4-1.9A7.5 7.5 0 0 1 8 17.3l-1.8.6-2-3.4 1.6-1a7.6 7.6 0 0 1 0-2.6l-1.6-1 2-3.4 1.8.6A7.5 7.5 0 0 1 10.2 5.8l.4-2.3h4l.4 2.3a7.5 7.5 0 0 1 2.2 1.3l1.8-.6 2 3.4-1.6 1a7.6 7.6 0 0 1 0 2.6Z", r: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" },
  redes: { l: "M7 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM17 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM17 22a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM9.2 8.3l5.6 4.4M9.2 6.2l5.6-.9M7 9.5v6l7.8 3", r: "M7 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" },
  publicidad: { l: "M4 19.5h16M6.5 16V9.5M11 16V5.5M15.5 16v-4M19 8l-3-3-3 3", r: "M9.5 5.5h3V16h-3z" },
  asistente: { l: "M12 3.5l1.7 4.6 4.8 1.4-4.8 1.6L12 15.5l-1.7-4.4-4.8-1.6 4.8-1.4ZM18.5 14.5l.8 2.1 2.2.7-2.2.8-.8 2.1-.8-2.1-2.2-.8 2.2-.7ZM5.5 15.5l.6 1.4 1.4.5-1.4.5-.6 1.6-.6-1.6-1.4-.5 1.4-.5Z", r: "M12 3.5l1.7 4.6 4.8 1.4-4.8 1.6L12 15.5l-1.7-4.4-4.8-1.6 4.8-1.4Z" },
  // acciones
  lapiz: { l: "M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16ZM13.5 6.5l4 4", r: "M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16Z" },
  puntos: { l: "M12 6.5h.01M12 12h.01M12 17.5h.01" },
  flecha: { l: "M5 12h14M13 6l6 6-6 6" },
  mas: { l: "M12 5v14M5 12h14" },
  borrar: { l: "M5 7h14M10 7V5h4v2M7 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h5a1.5 1.5 0 0 0 1.5-1.5L17 7M10.5 11v6M13.5 11v6" },
  check: { l: "M5 12.5l4.5 4.5L19 7" },
  copiar: { l: "M9 9h9.5A1.5 1.5 0 0 1 20 10.5V19a1.5 1.5 0 0 1-1.5 1.5H10A1.5 1.5 0 0 1 8.5 19v-8.5A1.5 1.5 0 0 1 9 9ZM15.5 9V5.5A1.5 1.5 0 0 0 14 4H5.5A1.5 1.5 0 0 0 4 5.5V14a1.5 1.5 0 0 0 1.5 1.5H8.5", r: "M9 9h9.5A1.5 1.5 0 0 1 20 10.5V19a1.5 1.5 0 0 1-1.5 1.5H10A1.5 1.5 0 0 1 8.5 19v-8.5A1.5 1.5 0 0 1 9 9Z" },
  enviar: { l: "M20.5 3.5 10 14M20.5 3.5 14 20.5l-4-6.5-6.5-4Z", r: "M20.5 3.5 14 20.5l-4-6.5-6.5-4Z" },
  cerrar: { l: "M6 6l12 12M18 6 6 18" },
  alerta: { l: "M12 4 21 19.5H3ZM12 10v4.5M12 17.3h.01", r: "M12 4 21 19.5H3Z" },
};

const POR_RUTA: [RegExp, string][] = [
  [/^hoy$/, "inicio"],
  [/estadisticas/, "estadisticas"],
  [/salud/, "salud"],
  [/inbox/, "inbox"],
  [/consultas/, "consultas"],
  [/oportunidades/, "objetivo"],
  [/prospectos/, "prospectos"],
  [/seguimiento/, "seguimiento"],
  [/agenda/, "agenda"],
  [/casos|clientes|cerrados/, "cerrados"],
  [/presupuesto/, "presupuesto"],
  [/extraer/, "extraer"],
  [/bases/, "bases"],
  [/campanas|campana/, "campanas"],
  [/captacion/, "captacion"],
  [/contenido/, "contenido"],
  [/^redes$/, "redes"],
  [/publicidad/, "publicidad"],
  [/comparacion/, "comparacion"],
  [/agentes|biblioteca/, "agentes"],
  [/revision/, "revision"],
  [/configuracion/, "configuracion"],
];

export function Icono({ nombre, className = "h-[18px] w-[18px]", grosor }: { nombre: string; className?: string; grosor?: number }) {
  const d = DIBUJOS[nombre] ?? { l: "M5 12h14M12 5v14" };
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true" focusable="false">
      {d.r && <path d={d.r} fill="currentColor" fillOpacity=".14" />}
      <path d={d.l} stroke="currentColor" strokeWidth={grosor ?? (nombre === "puntos" ? 2.6 : 1.6)} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconoSeccion({ href, className = "h-[18px] w-[18px]" }: { href: string; className?: string }) {
  const ultimo = href.split("?")[0].split("/").filter(Boolean).pop() ?? "";
  const nombre = POR_RUTA.find(([re]) => re.test(ultimo))?.[1] ?? "";
  return <Icono nombre={nombre} className={className} />;
}
