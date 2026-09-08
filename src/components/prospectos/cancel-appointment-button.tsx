"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function cancel() {
    setLoading(true);
    await fetch(`/api/appointments/${appointmentId}/cancel`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={cancel}
      disabled={loading}
      className="text-xs font-medium text-red-500 hover:underline disabled:opacity-60"
    >
      {loading ? "Cancelando..." : "Cancelar"}
    </button>
  );
}
