import { createAdminClient } from "@/lib/supabase/admin";
import {
  analyzeTemplate,
  isSendable,
  purposeInfo,
  qualityText,
  sourcesProblems,
  statusLabel,
  type MetaTemplate,
  type TemplateAnalysis,
  type TemplatePurpose,
} from "@/lib/plantillas/catalogo";
import { findWabaTemplate, listWabaPhoneNumberIds, listWabaTemplates, MetaApiError, metaErrorText } from "@/lib/plantillas/meta";

/**
 * Catálogo de plantillas (pregunta 22, bloque 1.8): lectura desde Meta,
 * asignación por perfil, línea y propósito, y el control que usa una
 * campaña antes de lanzar y antes de cada envío.
 *
 * No importa src/lib/profiles.ts (que usa este módulo) para evitar ciclos.
 */

type FetchLike = Parameters<typeof listWabaTemplates>[2];

interface LineRow {
  id: string;
  rubro_id: string;
  area: string;
  label: string;
  credential_key: string;
  active: boolean;
  use_for_campaigns: boolean;
}

export interface CatalogTemplateRow {
  id: string;
  waba_id: string;
  meta_template_id: string | null;
  name: string;
  language: string;
  category: string | null;
  sub_category: string | null;
  status: string;
  previous_status: string | null;
  status_changed_at: string | null;
  parameter_format: string | null;
  quality_score: string | null;
  rejected_reason: string | null;
  components: any[];
  body_text: string | null;
  variables: TemplateAnalysis;
  campaign_compatible: boolean;
  incompatibilities: string[];
  first_seen_at: string;
  last_seen_at: string;
  missing_since: string | null;
  last_sync_id: number | null;
  last_send_error: string | null;
  last_send_error_at: string | null;
}

export class MissingAccessError extends Error {
  constructor(public missing: string[]) {
    super(`Falta en la configuración privada: ${missing.join(", ")}`);
    this.name = "MissingAccessError";
  }
}

// ---------------------------------------------------------------------
// Accesos privados por línea (solo se informa si existen, nunca el valor)

export function wabaEnvName(credentialKey: string): string {
  return `${credentialKey}_WABA_ID`;
}

function lineAccess(credentialKey: string) {
  const waba = process.env[wabaEnvName(credentialKey)]?.trim() || null;
  const token = process.env[`${credentialKey}_ACCESS_TOKEN`] || null;
  const phoneNumberId = process.env[`${credentialKey}_PHONE_NUMBER_ID`] || null;
  return { waba, token, phoneNumberId };
}

export function lineAccessStatus(credentialKey: string) {
  const a = lineAccess(credentialKey);
  const missing: string[] = [];
  if (!a.waba) missing.push(wabaEnvName(credentialKey));
  if (!a.token) missing.push(`${credentialKey}_ACCESS_TOKEN`);
  return {
    ok: missing.length === 0,
    missing,
    wabaEnv: wabaEnvName(credentialKey),
    // Solo los últimos 4 dígitos, para reconocer la cuenta sin mostrar la configuración.
    wabaHint: a.waba ? `…${a.waba.slice(-4)}` : null,
  };
}

export function lineWabaId(credentialKey: string): string | null {
  return lineAccess(credentialKey).waba;
}

async function getLineRow(lineId: string): Promise<LineRow | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profile_lines")
    .select("id, rubro_id, area, label, credential_key, active, use_for_campaigns")
    .eq("id", lineId)
    .maybeSingle();
  return (data as LineRow) ?? null;
}

// ---------------------------------------------------------------------
// Lectura del catálogo desde Meta

export interface SyncResult {
  ok: boolean;
  sync_id: number | null;
  total: number;
  nuevas: number;
  cambiaron: number;
  sin_cambios: number;
  ya_no_figuran: number;
  line_verified: boolean | null;
  line_check_note: string | null;
  error: string | null;
}

function toRow(t: MetaTemplate, wabaId: string, syncId: number, now: string) {
  const analysis = analyzeTemplate(t);
  return {
    waba_id: wabaId,
    meta_template_id: typeof t.id === "string" ? t.id : null,
    name: t.name,
    language: t.language,
    category: t.category ?? null,
    sub_category: t.sub_category ?? null,
    status: String(t.status ?? "").toUpperCase() || "DESCONOCIDO",
    parameter_format: analysis.format,
    quality_score: qualityText(t.quality_score),
    rejected_reason: t.rejected_reason ?? null,
    components: Array.isArray(t.components) ? t.components : [],
    body_text: analysis.bodyText,
    variables: analysis,
    campaign_compatible: analysis.campaignCompatible,
    incompatibilities: analysis.incompatibilities,
    last_seen_at: now,
    missing_since: null,
    last_sync_id: syncId,
  };
}

const COMPARED = ["meta_template_id", "category", "sub_category", "status", "parameter_format", "quality_score", "rejected_reason"] as const;

// La base guarda el JSON con otro orden de claves: se compara en forma canónica.
function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v as Record<string, unknown>)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v ?? null);
}

function changed(prev: any, next: any): boolean {
  if (COMPARED.some((k) => (prev[k] ?? null) !== (next[k] ?? null))) return true;
  return canonical(prev.components ?? []) !== canonical(next.components ?? []);
}

async function templatesOfWaba(wabaId: string): Promise<CatalogTemplateRow[]> {
  const supabase = createAdminClient();
  const out: CatalogTemplateRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("whatsapp_templates")
      .select("*")
      .eq("waba_id", wabaId)
      .order("name")
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...((data ?? []) as CatalogTemplateRow[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

/**
 * Lee de Meta todas las plantillas de la cuenta de la línea y actualiza el
 * catálogo. Nada se borra: lo que ya no figura queda marcado con la fecha.
 * También comprueba que el número de la línea pertenezca a esa cuenta.
 */
export async function syncLineTemplates(
  lineId: string,
  opts: { fetchImpl?: FetchLike; triggeredBy?: string } = {}
): Promise<SyncResult> {
  const line = await getLineRow(lineId);
  if (!line) throw new Error("Línea no encontrada");
  const access = lineAccess(line.credential_key);
  const status = lineAccessStatus(line.credential_key);
  if (!status.ok || !access.waba || !access.token) throw new MissingAccessError(status.missing);

  const supabase = createAdminClient();
  const { data: syncRow, error: syncErr } = await supabase
    .from("whatsapp_template_syncs")
    .insert({ waba_id: access.waba, line_id: line.id, triggered_by: opts.triggeredBy ?? "panel" })
    .select("id")
    .single();
  if (syncErr || !syncRow) throw new Error(syncErr?.message ?? "No se pudo registrar la lectura");
  const syncId = Number(syncRow.id);
  const result: SyncResult = {
    ok: false,
    sync_id: syncId,
    total: 0,
    nuevas: 0,
    cambiaron: 0,
    sin_cambios: 0,
    ya_no_figuran: 0,
    line_verified: null,
    line_check_note: null,
    error: null,
  };

  try {
    const remote = await listWabaTemplates(access.waba, access.token, opts.fetchImpl);
    const now = new Date().toISOString();
    const existing = await templatesOfWaba(access.waba);
    const byKey = new Map(existing.map((r) => [`${r.name}\u0000${r.language}`, r]));
    const seen = new Set<string>();
    const rows: any[] = [];
    for (const t of remote) {
      const key = `${t.name}\u0000${t.language}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const next: any = toRow(t, access.waba, syncId, now);
      const prev = byKey.get(key);
      // Todas las filas llevan las mismas columnas: en una carga en lote, una
      // columna que falta en una fila se guardaría vacía.
      if (!prev) {
        result.nuevas++;
        next.first_seen_at = now;
        next.previous_status = null;
        next.status_changed_at = null;
      } else {
        if (changed(prev, next) || prev.missing_since) result.cambiaron++;
        else result.sin_cambios++;
        next.first_seen_at = prev.first_seen_at;
        if (prev.status !== next.status) {
          next.previous_status = prev.status;
          next.status_changed_at = now;
        } else {
          next.previous_status = prev.previous_status;
          next.status_changed_at = prev.status_changed_at;
        }
      }
      rows.push(next);
    }
    result.total = rows.length;
    for (let i = 0; i < rows.length; i += 100) {
      const { error } = await supabase
        .from("whatsapp_templates")
        .upsert(rows.slice(i, i + 100), { onConflict: "waba_id,name,language" });
      if (error) throw new Error(error.message);
    }
    const gone = existing.filter((r) => !seen.has(`${r.name}\u0000${r.language}`));
    result.ya_no_figuran = gone.length;
    const newlyGone = gone.filter((r) => !r.missing_since).map((r) => r.id);
    for (let i = 0; i < newlyGone.length; i += 150) {
      const { error } = await supabase
        .from("whatsapp_templates")
        .update({ missing_since: now })
        .in("id", newlyGone.slice(i, i + 150));
      if (error) throw new Error(error.message);
    }

    // ¿El número de la línea pertenece a esa cuenta?
    try {
      const ids = await listWabaPhoneNumberIds(access.waba, access.token, opts.fetchImpl);
      result.line_verified = access.phoneNumberId ? ids.includes(access.phoneNumberId) : null;
      result.line_check_note = !access.phoneNumberId
        ? `Falta ${line.credential_key}_PHONE_NUMBER_ID para comprobar la línea`
        : result.line_verified
        ? null
        : "El número de la línea no figura en esa cuenta de WhatsApp Business";
    } catch (err) {
      result.line_verified = null;
      result.line_check_note = `No se pudo comprobar la línea: ${metaErrorText(err)}`;
    }

    result.ok = true;
    await supabase
      .from("whatsapp_template_syncs")
      .update({
        status: "ok",
        finished_at: new Date().toISOString(),
        total: result.total,
        nuevas: result.nuevas,
        cambiaron: result.cambiaron,
        sin_cambios: result.sin_cambios,
        ya_no_figuran: result.ya_no_figuran,
        line_verified: result.line_verified,
        line_check_note: result.line_check_note,
      })
      .eq("id", syncId);
    return result;
  } catch (err) {
    result.error = metaErrorText(err);
    await supabase
      .from("whatsapp_template_syncs")
      .update({
        status: "error",
        finished_at: new Date().toISOString(),
        error: result.error,
        http_status: err instanceof MetaApiError ? err.status : null,
      })
      .eq("id", syncId);
    return result;
  }
}

export async function latestSync(lineId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("whatsapp_template_syncs")
    .select("*")
    .eq("line_id", lineId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

// ---------------------------------------------------------------------
// Asignaciones (perfil · línea · propósito)

export class AssignmentError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "AssignmentError";
  }
}

/** Problemas para usar una plantilla en una línea (sin contar la asignación). */
export function templateProblems(tpl: CatalogTemplateRow, lineWaba: string | null): string[] {
  const p: string[] = [];
  if (!isSendable(tpl.status)) p.push(`Está ${statusLabel(tpl.status)}: solo se envían plantillas aprobadas`);
  if (tpl.missing_since) p.push(`Ya no figura en Meta desde el ${new Date(tpl.missing_since).toLocaleDateString("es-AR")}`);
  if (!tpl.campaign_compatible) p.push(...(tpl.incompatibilities ?? []));
  if (!lineWaba) p.push("La línea no tiene cargado el identificador de su cuenta de WhatsApp Business");
  else if (lineWaba !== tpl.waba_id) p.push("Es de otra cuenta de WhatsApp Business que la de la línea");
  return p;
}

export async function createAssignment(input: {
  lineId: string;
  templateId: string;
  purpose: string;
  sources: unknown;
  note?: string | null;
}): Promise<{ id: string; reactivada: boolean }> {
  const info = purposeInfo(input.purpose);
  if (!info) throw new AssignmentError("Propósito desconocido");
  if (!info.enabled) throw new AssignmentError(`«${info.label}»: ${info.when}.`, 409);
  const line = await getLineRow(input.lineId);
  if (!line) throw new AssignmentError("Línea no encontrada", 404);
  if (!line.active) throw new AssignmentError(`La línea «${line.label}» está desactivada`);
  const supabase = createAdminClient();
  const { data: tpl } = await supabase.from("whatsapp_templates").select("*").eq("id", input.templateId).maybeSingle();
  if (!tpl) throw new AssignmentError("La plantilla no está en el catálogo", 404);
  const problems = [
    ...templateProblems(tpl as CatalogTemplateRow, lineWabaId(line.credential_key)),
    ...sourcesProblems((tpl as CatalogTemplateRow).variables, input.sources),
  ];
  if (problems.length) throw new AssignmentError(problems.join(". "));
  const sources = (input.sources as string[]).slice();

  const { data: prev } = await supabase
    .from("template_assignments")
    .select("id, variable_sources")
    .eq("line_id", line.id)
    .eq("purpose", info.key)
    .eq("template_id", tpl.id)
    .eq("active", true)
    .maybeSingle();
  if (prev) {
    const { error } = await supabase
      .from("template_assignments")
      .update({ variable_sources: sources, note: input.note ?? null })
      .eq("id", prev.id);
    if (error) throw new AssignmentError(error.message, 500);
    await supabase.from("ops_change_log").insert({
      actor: "panel",
      action: "asignar_plantilla",
      target: `template_assignments:${prev.id}`,
      before: { variable_sources: prev.variable_sources },
      after: { variable_sources: sources },
    });
    return { id: prev.id, reactivada: false };
  }
  const { data: row, error } = await supabase
    .from("template_assignments")
    .insert({
      rubro_id: line.rubro_id,
      line_id: line.id,
      purpose: info.key,
      template_id: tpl.id,
      variable_sources: sources,
      note: input.note ?? null,
    })
    .select("id")
    .single();
  if (error || !row) throw new AssignmentError(error?.message ?? "No se pudo guardar", 500);
  await supabase.from("ops_change_log").insert({
    actor: "panel",
    action: "asignar_plantilla",
    target: `template_assignments:${row.id}`,
    before: null,
    after: { line_id: line.id, purpose: info.key, template: `${tpl.name} (${tpl.language})`, variable_sources: sources },
  });
  return { id: row.id, reactivada: false };
}

export async function deactivateAssignment(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { data: a } = await supabase.from("template_assignments").select("id, active").eq("id", id).maybeSingle();
  if (!a) throw new AssignmentError("Asignación no encontrada", 404);
  if (!a.active) return;
  const { error } = await supabase
    .from("template_assignments")
    .update({ active: false, deactivated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new AssignmentError(error.message, 500);
  await supabase.from("ops_change_log").insert({
    actor: "panel",
    action: "desactivar_asignacion_plantilla",
    target: `template_assignments:${id}`,
    before: { active: true },
    after: { active: false },
  });
}

export interface TemplateOption {
  assignment_id: string;
  template_id: string;
  name: string;
  language: string;
  category: string | null;
  status: string;
  status_label: string;
  variables: string[];
  sources: string[];
  body_text: string | null;
  usable: boolean;
  problems: string[];
}

/** Plantillas asignadas a una línea para un propósito, con lo que impide usarlas. */
export async function templateOptions(lineId: string, purpose: TemplatePurpose): Promise<TemplateOption[]> {
  const line = await getLineRow(lineId);
  if (!line) return [];
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("template_assignments")
    .select("id, variable_sources, template:whatsapp_templates(*)")
    .eq("line_id", lineId)
    .eq("purpose", purpose)
    .eq("active", true)
    .order("created_at");
  const waba = lineWabaId(line.credential_key);
  return ((data ?? []) as any[])
    .filter((a) => a.template)
    .map((a) => {
      const tpl = a.template as CatalogTemplateRow;
      const problems = [...templateProblems(tpl, waba), ...sourcesProblems(tpl.variables, a.variable_sources)];
      return {
        assignment_id: a.id,
        template_id: tpl.id,
        name: tpl.name,
        language: tpl.language,
        category: tpl.category,
        status: tpl.status,
        status_label: statusLabel(tpl.status),
        variables: tpl.variables?.bodyVariables ?? [],
        sources: Array.isArray(a.variable_sources) ? a.variable_sources : [],
        body_text: tpl.body_text,
        usable: problems.length === 0,
        problems,
      };
    });
}

// ---------------------------------------------------------------------
// Control de la campaña

export interface ResolvedCampaignTemplate {
  template: CatalogTemplateRow;
  analysis: TemplateAnalysis;
  assignmentId: string;
  sources: string[];
}

/**
 * Qué falta en la plantilla de una campaña. Un nombre escrito a mano no
 * alcanza: tiene que ser una plantilla del catálogo, aprobada según Meta,
 * de la cuenta de la línea, asignada a esa línea para campañas y con cada
 * variable resuelta.
 */
export async function campaignTemplateCheck(
  campaign: { template_id?: string | null; message_template_name?: string | null },
  line: { id: string; label: string; credential_key: string } | null
): Promise<{ missing: string[]; resolved: ResolvedCampaignTemplate | null }> {
  if (!campaign.template_id) {
    const legacy = campaign.message_template_name?.trim();
    return {
      missing: [
        legacy
          ? `Plantilla aprobada del catálogo: la campaña tiene escrito «${legacy}», que no se confirmó en Meta (elegila del catálogo)`
          : "Plantilla aprobada del catálogo",
      ],
      resolved: null,
    };
  }
  const supabase = createAdminClient();
  const { data: tpl } = await supabase.from("whatsapp_templates").select("*").eq("id", campaign.template_id).maybeSingle();
  if (!tpl) return { missing: ["La plantilla elegida no está en el catálogo"], resolved: null };
  const template = tpl as CatalogTemplateRow;
  const missing: string[] = [];
  const name = `«${template.name}» (${template.language})`;
  if (!line) return { missing: [], resolved: null }; // la falta de línea ya la informa el control del perfil
  const waba = lineWabaId(line.credential_key);
  for (const p of templateProblems(template, waba)) missing.push(`Plantilla ${name}: ${p}`);
  const { data: assignment } = await supabase
    .from("template_assignments")
    .select("id, variable_sources")
    .eq("line_id", line.id)
    .eq("purpose", "campana")
    .eq("template_id", template.id)
    .eq("active", true)
    .maybeSingle();
  if (!assignment) {
    missing.push(`Plantilla ${name}: no está asignada a la línea «${line.label}» para campañas`);
  } else {
    for (const p of sourcesProblems(template.variables, assignment.variable_sources)) missing.push(`Plantilla ${name}: ${p}`);
  }
  const sync = await latestSync(line.id);
  if (sync?.line_verified === false) missing.push(`La línea «${line.label}» no figura en la cuenta de WhatsApp Business configurada`);
  return {
    missing,
    resolved:
      missing.length === 0 && assignment
        ? { template, analysis: template.variables, assignmentId: assignment.id, sources: assignment.variable_sources as string[] }
        : null,
  };
}

/**
 * Confirma en Meta, en el momento, el estado de la plantilla (antes de
 * lanzar). Actualiza el catálogo con lo que responde.
 */
export async function confirmTemplateLive(
  templateId: string,
  line: { credential_key: string },
  fetchImpl?: FetchLike
): Promise<{ ok: boolean; message: string | null }> {
  const supabase = createAdminClient();
  const { data: tpl } = await supabase.from("whatsapp_templates").select("*").eq("id", templateId).maybeSingle();
  if (!tpl) return { ok: false, message: "La plantilla no está en el catálogo" };
  const access = lineAccess(line.credential_key);
  if (!access.waba || !access.token) return { ok: false, message: `Falta ${wabaEnvName(line.credential_key)} o el token de la línea` };
  try {
    const live = await findWabaTemplate(access.waba, access.token, tpl.name, tpl.language, fetchImpl);
    const now = new Date().toISOString();
    if (!live) {
      await supabase.from("whatsapp_templates").update({ missing_since: tpl.missing_since ?? now }).eq("id", tpl.id);
      return { ok: false, message: `La plantilla «${tpl.name}» (${tpl.language}) ya no figura en Meta` };
    }
    const next = toRow(live, tpl.waba_id, tpl.last_sync_id ?? 0, now);
    const update: any = { ...next, last_sync_id: tpl.last_sync_id };
    if (tpl.status !== next.status) {
      update.previous_status = tpl.status;
      update.status_changed_at = now;
    }
    await supabase.from("whatsapp_templates").update(update).eq("id", tpl.id);
    if (!isSendable(next.status)) return { ok: false, message: `La plantilla «${tpl.name}» está ${statusLabel(next.status)} según Meta` };
    if (!next.campaign_compatible) return { ok: false, message: `La plantilla «${tpl.name}» cambió y ya no se puede enviar desde campañas` };
    return { ok: true, message: null };
  } catch (err) {
    return { ok: false, message: `No se pudo confirmar en Meta el estado de la plantilla: ${metaErrorText(err)}` };
  }
}

export async function recordTemplateSendError(templateId: string, message: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("whatsapp_templates")
    .update({ last_send_error: message.slice(0, 500), last_send_error_at: new Date().toISOString() })
    .eq("id", templateId);
}

// ---------------------------------------------------------------------
// Vista del catálogo de un perfil (Configuración)

export async function profileCatalog(rubroId: string) {
  const supabase = createAdminClient();
  const { data: linesData } = await supabase
    .from("profile_lines")
    .select("id, rubro_id, area, label, credential_key, active, use_for_campaigns")
    .eq("rubro_id", rubroId)
    .order("created_at");
  const lines = (linesData ?? []) as LineRow[];
  const lineViews = await Promise.all(
    lines.map(async (l) => ({
      id: l.id,
      label: l.label,
      area: l.area,
      credential_key: l.credential_key,
      active: l.active,
      use_for_campaigns: l.use_for_campaigns,
      access: lineAccessStatus(l.credential_key),
      waba: lineWabaId(l.credential_key),
      last_sync: await latestSync(l.id),
    }))
  );
  const wabas = Array.from(new Set(lineViews.map((l) => l.waba).filter((w): w is string => !!w)));
  const templates: CatalogTemplateRow[] = [];
  for (const w of wabas) templates.push(...(await templatesOfWaba(w)));

  const { data: assignmentsData } = await supabase
    .from("template_assignments")
    .select("id, line_id, purpose, template_id, variable_sources, active, created_at")
    .eq("rubro_id", rubroId)
    .eq("active", true);
  const assignments = (assignmentsData ?? []) as any[];

  const ids = templates.map((t) => t.id);
  const campaignsByTemplate = new Map<string, { id: string; name: string; status: string }[]>();
  for (let i = 0; i < ids.length; i += 150) {
    const { data } = await supabase
      .from("campaigns")
      .select("id, name, status, template_id")
      .in("template_id", ids.slice(i, i + 150));
    for (const c of (data ?? []) as any[]) {
      const list = campaignsByTemplate.get(c.template_id) ?? [];
      list.push({ id: c.id, name: c.name, status: c.status });
      campaignsByTemplate.set(c.template_id, list);
    }
  }
  const names = Array.from(new Set(templates.map((t) => t.name)));
  const usage = new Map<string, { mensajes: number; ultimo: string | null }>();
  if (names.length) {
    const { data } = await supabase.rpc("template_name_usage", { p_names: names });
    for (const u of (data ?? []) as any[]) usage.set(u.name, { mensajes: Number(u.mensajes), ultimo: u.ultimo });
  }
  const legacy = new Map<string, { id: string; name: string }[]>();
  if (names.length) {
    const { data } = await supabase
      .from("campaigns")
      .select("id, name, message_template_name")
      .is("template_id", null)
      .in("message_template_name", names.slice(0, 150));
    for (const c of (data ?? []) as any[]) {
      const list = legacy.get(c.message_template_name) ?? [];
      list.push({ id: c.id, name: c.name });
      legacy.set(c.message_template_name, list);
    }
  }

  return {
    lines: lineViews.map(({ waba, ...rest }) => ({ ...rest, has_waba: !!waba })),
    templates: templates.map((t) => ({
      ...t,
      lines: lineViews.filter((l) => l.waba === t.waba_id).map((l) => l.id),
      assignments: assignments.filter((a) => a.template_id === t.id),
      campaigns: campaignsByTemplate.get(t.id) ?? [],
      legacy_campaigns: legacy.get(t.name) ?? [],
      usage: usage.get(t.name) ?? { mensajes: 0, ultimo: null },
    })),
  };
}

/** ¿El perfil tiene al menos una plantilla aprobada asignada a una línea para campañas? */
export async function profileHasCampaignTemplate(rubroId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("template_assignments")
    .select("id, template:whatsapp_templates(status, missing_since, campaign_compatible)")
    .eq("rubro_id", rubroId)
    .eq("purpose", "campana")
    .eq("active", true);
  return ((data ?? []) as any[]).some(
    (a) => a.template && isSendable(a.template.status) && !a.template.missing_since && a.template.campaign_compatible
  );
}

/**
 * Para los envíos automáticos que todavía usan un nombre de la configuración
 * privada (plantilla de la landing y seguimientos de Marketing, que se pasan
 * al catálogo en la Etapa 2): solo salen si ese nombre figura en el catálogo
 * como aprobado según Meta. Si no, el envío no sale (queda pendiente).
 */
export async function isApprovedInCatalog(name: string, language: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("whatsapp_templates")
    .select("status, missing_since, campaign_compatible")
    .eq("name", name)
    .eq("language", language);
  return ((data ?? []) as any[]).some((t) => isSendable(t.status) && !t.missing_since && t.campaign_compatible);
}
