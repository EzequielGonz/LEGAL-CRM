/**
 * Íconos de línea del menú (16/10). Un solo juego para los cuatro perfiles:
 * se elige por la última parte de la ruta, así no hay que duplicar nada por
 * rubro. Trazo de 1,7 px que hereda el color del texto.
 */
const TRAZOS: [RegExp, string][] = [
  [/estadisticas/, "M4 19V9m5 10V5m5 14v-7m5 7V8"],
  [/salud/, "M3 12h4l2.5-6 4 12 2.5-6H21"],
  [/inbox|consultas/, "M4 5h16v10H14l-2 3-2-3H4z"],
  [/oportunidades|prospectos/, "M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.4l-5.3 2.7 1-5.8L3.5 9.2l5.9-.9z"],
  [/seguimiento/, "M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4"],
  [/agenda/, "M4 6h16v14H4zM4 10h16M9 3v4M15 3v4"],
  [/casos|clientes|cerrados/, "M5 12l4 4 10-10"],
  [/presupuesto/, "M7 3h10v18l-3-2-2 2-2-2-3 2zM10 8h4M10 12h4"],
  [/bases|extraer/, "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zm0 0v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"],
  [/campanas/, "M4 10v4h3l6 4V6L7 10zM17 9a4 4 0 0 1 0 6"],
  [/captacion/, "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4"],
  [/contenido/, "M5 4h10l4 4v12H5zM14 4v5h5M8 13h8M8 17h5"],
  [/comparacion/, "M8 4v16M16 4v16M4 8h8M12 16h8"],
  [/agentes|biblioteca/, "M8 9h8v8H8zM12 5v4M6 13H4M20 13h-2M10 13h.01M14 13h.01"],
  [/revision/, "M12 3l8 4v5c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V7z"],
  [/configuracion/, "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"],
];

export function IconoSeccion({ href, className = "h-[18px] w-[18px]" }: { href: string; className?: string }) {
  const ultimo = href.split("?")[0].split("/").filter(Boolean).pop() ?? "";
  const d = TRAZOS.find(([re]) => re.test(ultimo))?.[1] ?? "M5 12h14M12 5v14";
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
