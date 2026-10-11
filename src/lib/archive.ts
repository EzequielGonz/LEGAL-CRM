import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Archivar en lugar de eliminar (pregunta 20). Se conserva todo: archivo
 * original, filas, destinatarios, conversaciones, resultados y vínculos.
 * Archivar una campaña la pausa; recuperarla la deja pausada (nunca
 * reanuda envíos por sí sola).
 */
type Kind = "base" | "campaña";

async function logChange(kind: Kind, id: string, action: string, before: unknown, after: unknown, note: string | null) {
  const supabase = createAdminClient();
  await supabase.from("ops_change_log").insert({
    actor: "panel",
    action,
    target: `${kind === "base" ? "imported_bases" : "campaigns"}:${id}`,
    before,
    after,
    note,
  });
}

export async function setBaseArchived(id: string, archive: boolean, note: string | null) {
  const supabase = createAdminClient();
  const { data: before, error } = await supabase
    .from("imported_bases")
    .select("id, name, archived_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !before) throw new Error("Base no encontrada");
  const after = { archived_at: archive ? new Date().toISOString() : null, archived_note: archive ? note : null };
  const { error: upErr } = await supabase.from("imported_bases").update(after).eq("id", id);
  if (upErr) throw new Error(upErr.message);
  await logChange("base", id, archive ? "archivar_base" : "recuperar_base", before, after, note);
}

export async function setCampaignArchived(id: string, archive: boolean, note: string | null) {
  const supabase = createAdminClient();
  const { data: before, error } = await supabase
    .from("campaigns")
    .select("id, name, status, archived_at, pause_reason")
    .eq("id", id)
    .maybeSingle();
  if (error || !before) throw new Error("Campaña no encontrada");

  const now = new Date().toISOString();
  const after: Record<string, unknown> = archive
    ? { archived_at: now, archived_note: note }
    : { archived_at: null, archived_note: null };
  // Archivar una campaña en curso la pausa con su motivo; recuperar no la reanuda.
  if (archive && before.status === "en_curso") {
    after.status = "pausada";
    after.pause_reason = "Archivada";
    after.paused_at = now;
  }
  const { error: upErr } = await supabase.from("campaigns").update(after).eq("id", id);
  if (upErr) throw new Error(upErr.message);
  await logChange("campaña", id, archive ? "archivar_campana" : "recuperar_campana", before, after, note);
}
