/**
 * Estados de entrega en el Inbox (función pura, se prueba sola). El polling
 * trae el estado actual de los mensajes salientes recientes y se aplica a
 * los que ya están en pantalla, además de agregar los mensajes nuevos.
 */
export interface DeliveryUpdate {
  id: string;
  delivery_status: string | null;
  delivery_status_at: string | null;
}

export function mergeDeliveryUpdates<T extends { id: string; delivery_status?: string | null; delivery_status_at?: string | null }>(
  prev: T[],
  updates: DeliveryUpdate[]
): { list: T[]; changed: boolean } {
  if (!updates.length) return { list: prev, changed: false };
  const byId = new Map(updates.map((u) => [u.id, u]));
  let changed = false;
  const list = prev.map((m) => {
    const u = byId.get(m.id);
    if (u && (u.delivery_status ?? null) !== (m.delivery_status ?? null)) {
      changed = true;
      return { ...m, delivery_status: u.delivery_status, delivery_status_at: u.delivery_status_at };
    }
    return m;
  });
  return { list: changed ? list : prev, changed };
}

/** Une lo que ya se ve con lo que trajo el polling: estados actualizados y mensajes nuevos al final. */
export function mergePoll<T extends { id: string; delivery_status?: string | null; delivery_status_at?: string | null }>(
  prev: T[],
  nuevos: T[],
  updates: DeliveryUpdate[]
): T[] {
  const { list } = mergeDeliveryUpdates(prev, updates);
  const known = new Set(list.map((m) => m.id));
  const extra = nuevos.filter((m) => !known.has(m.id));
  return extra.length ? [...list, ...extra] : list;
}
