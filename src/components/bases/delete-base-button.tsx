"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteBaseButton({
  baseId,
  baseName,
  redirectTo,
}: {
  baseId: string;
  baseName: string;
  /** Si se pasa, navega ahí después de borrar en vez de refrescar la página
   * actual — necesario en la página de detalle de la base, porque esa
   * página deja de existir una vez borrada. */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    // Evita que el click "atraviese" hacia el link de la tarjeta y navegue a
    // la base en vez de borrarla.
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      `¿Seguro que querés borrar la base "${baseName}"? Esto borra el registro de la importación y el archivo original. Los contactos que ya se crearon a partir de ella NO se borran — quedan en Prospectos igual, solo dejan de estar asociados a esta base. No se puede deshacer.`
    );
    if (!confirmed) return;

    setLoading(true);
    const res = await fetch(`/api/bases/${baseId}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      window.alert(data.error ?? "No se pudo borrar la base. Probá de nuevo.");
      return;
    }

    if (redirectTo) {
      router.push(redirectTo);
    } else {
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title="Borrar base"
      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      {loading ? "Borrando..." : "Borrar"}
    </button>
  );
}
