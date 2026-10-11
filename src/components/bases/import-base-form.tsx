"use client";

import { ImportFlow, type AreaOption } from "./import-flow";

const JURIDICO_AREAS: AreaOption[] = [
  { value: "civil", label: "Civil" },
  { value: "penal", label: "Penal" },
];

/**
 * Importar una base desde la sección Bases. Usa el flujo único de
 * importación (ver ImportFlow): el mismo que la carga desde una campaña y el
 * modo teléfono. Guardar la base no envía mensajes.
 */
export function ImportBaseForm({
  areas = JURIDICO_AREAS,
  basesPath = "/bases",
}: {
  areas?: AreaOption[];
  basesPath?: string;
}) {
  return <ImportFlow areas={areas} basesPath={basesPath} />;
}
