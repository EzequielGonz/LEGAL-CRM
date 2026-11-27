import Link from "next/link";

/**
 * Accesos centrales de /perfiles (22/11, pedido del dueño): Cerebro, Oficina,
 * Laboratorio de bots y Jarvis como pastillas iguales, y «Resumen de todo»
 * resaltado en dorado. Reemplaza a la pastilla suelta «Cerebro del negocio».
 * Objetivos de 44 px y foco visible (ver accesos-centrales.css).
 */
const PASTILLAS = [
  { href: "/cerebro", texto: "Cerebro" },
  { href: "/oficina", texto: "Oficina" },
  { href: "/laboratorio", texto: "Laboratorio de bots" },
  { href: "/asistente", texto: "Jarvis" },
] as const;

export function AccesosCentrales() {
  return (
    <nav aria-label="Accesos centrales del panel" className="mb-2">
      <ul className="ac-fila">
        {PASTILLAS.map((p, i) => (
          <li key={p.href}>
            <Link href={p.href} prefetch={false} className="ac-pastilla" style={{ ["--i" as string]: i }}>
              {p.texto}
            </Link>
          </li>
        ))}
        <li className="ac-fila__destacado">
          <Link href="/resumen" prefetch={false} className="ac-resumen" style={{ ["--i" as string]: PASTILLAS.length }}>
            Resumen de todo
            <span aria-hidden="true" className="ac-resumen__flecha">→</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
