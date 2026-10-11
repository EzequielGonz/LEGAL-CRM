"use client";

import { ArchiveButton } from "@/components/ui/archive-button";

/** Antes "Borrar": ahora archiva o recupera la base (pregunta 20). */
export function DeleteBaseButton({
  baseId,
  baseName,
  redirectTo,
  archived = false,
}: {
  baseId: string;
  baseName: string;
  redirectTo?: string;
  archived?: boolean;
}) {
  return (
    <ArchiveButton endpoint={`/api/bases/${baseId}/archivo`} name={baseName} archived={archived} kind="base" redirectTo={redirectTo} />
  );
}
