"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteCampaignButton({
  campaignId,
  campaignName,
  redirectTo,
}: {
  campaignId: string;
  campaignName: string;
  /** Si se pasa, navega ahí después de borrar en vez de refrescar la página
   * actual — necesario en la página de detalle de la campaña, porque esa
   * página deja de existir una vez borrada. */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    // Evita que el click "atraviese" hacia el link de la tarjeta y navegue a
    // la campaña en vez de borrarla.
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      `¿Seguro que querés borrar la campaña "${campaignName}"? Esto borra también la lista de destinatarios cargada en ella. No se puede deshacer.`
    );
    if (!confirmed) return;

    setLoading(true);
    const res = await fetch(`/api/campaigns/${campaignId}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      window.alert(data.error ?? "No se pudo borrar la campaña. Probá de nuevo.");
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
      title="Borrar campaña"
      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      {loading ? "Borrando..." : "Borrar"}
    </button>
  );
}
