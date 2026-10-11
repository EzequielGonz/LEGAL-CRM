"use client";

import { useCallback, useEffect, useState } from "react";

interface Device {
  id: string;
  label: string | null;
  status: string;
  user_agent: string | null;
  created_at: string;
  last_success_at: string | null;
  last_error: string | null;
  last_error_at: string | null;
}

interface Estado {
  configurado: boolean;
  faltantes: string[];
  clave_publica: string | null;
  dispositivos: Device[];
}

const STORAGE_KEY = "panel-aviso-dispositivo";

function readStoredId(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
function storeId(id: string | null) {
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // sin almacenamiento local: el dispositivo igual queda registrado en el servidor
  }
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function guessLabel(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Mac/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows";
  return "Dispositivo";
}

const STATUS_LABEL: Record<string, string> = {
  activo: "Activo",
  desactivado: "Desactivado",
  vencido: "Vencido (hay que volver a activarlo)",
};

/**
 * Avisos web en este dispositivo (doc. 1, 15.2 · bloque 1.9): activar,
 * enviar un aviso de prueba y desactivar; muestra si está activo, bloqueado
 * o no es compatible. Con `showDevices` (Configuración) lista todos los
 * dispositivos para desactivarlos o retirarlos con el PIN general.
 */
export function PushControls({ showDevices = false }: { showDevices?: boolean }) {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [support, setSupport] = useState<"cargando" | "no_compatible" | "requiere_instalar" | "ok">("cargando");
  const [permission, setPermission] = useState<string>("default");
  const [myId, setMyId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/push/estado", { cache: "no-store" });
      if (res.ok) setEstado(await res.json());
    } catch {
      // sin conexión: se muestra lo que haya
    }
  }, []);

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true;
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    if (!supported) setSupport(ios && !standalone ? "requiere_instalar" : "no_compatible");
    else setSupport("ok");
    if ("Notification" in window) setPermission(Notification.permission);
    setMyId(readStoredId());
    setLabel(guessLabel());
    load();
  }, [load]);

  const mine = estado?.dispositivos.find((d) => d.id === myId) ?? null;
  const activeHere = !!mine && mine.status === "activo" && permission === "granted";

  async function activar() {
    if (!estado?.clave_publica) return;
    setBusy(true);
    setMsg(null);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setMsg({ ok: false, text: "El navegador no dio permiso para avisos. Se puede habilitar en los ajustes del sitio." });
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(estado.clave_publica) as unknown as BufferSource,
        });
      }
      const res = await fetch("/api/push/suscripcion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), label: label.trim() || guessLabel() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "No se pudo registrar el dispositivo");
      storeId(data.id);
      setMyId(data.id);
      setMsg({ ok: true, text: "Avisos activados en este dispositivo." });
      await load();
    } catch (err: any) {
      setMsg({ ok: false, text: String(err?.message ?? err) });
    } finally {
      setBusy(false);
    }
  }

  async function probar(id: string | null) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/push/prueba", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dispositivo_id: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setMsg({ ok: false, text: data.error ?? "No se pudo enviar el aviso de prueba" });
      else
        setMsg({
          ok: data.ok,
          text: data.ok
            ? "Aviso de prueba enviado. Si no aparece en unos segundos, revisá los permisos de notificaciones del dispositivo."
            : `No llegó a todos: ${(data.resultados ?? []).filter((r: any) => r.status !== "enviado").map((r: any) => `${r.label ?? "dispositivo"} (${r.detail ?? "error"})`).join(", ")}`,
        });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function cambiar(id: string, accion: "desactivar" | "activar" | "retirar") {
    setBusy(true);
    setMsg(null);
    try {
      if (id === myId && accion !== "activar") {
        const reg = await navigator.serviceWorker?.getRegistration?.();
        const sub = await reg?.pushManager.getSubscription();
        await sub?.unsubscribe().catch(() => undefined);
        storeId(null);
        setMyId(null);
      }
      const res = await fetch(`/api/push/suscripcion/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMsg({ ok: false, text: data.error ?? "No se pudo guardar" });
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  const btn = "rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50";

  return (
    <div className="space-y-3 text-sm">
      {estado && !estado.configurado && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Pendiente de configuración: faltan {estado.faltantes.join(", ")} en la configuración privada del servidor. Hasta entonces no se pueden activar avisos.
        </p>
      )}
      <p className="text-xs text-slate-600">
        Este dispositivo:{" "}
        <span className="font-semibold">
          {support === "cargando"
            ? "…"
            : support === "no_compatible"
              ? "No compatible con este navegador"
              : support === "requiere_instalar"
                ? "Hay que instalar el panel en la pantalla de inicio para recibir avisos"
                : permission === "denied"
                  ? "Bloqueado por el navegador (habilitalo en los ajustes del sitio)"
                  : activeHere
                    ? "Activo"
                    : "Inactivo"}
        </span>
      </p>
      {support === "ok" && permission !== "denied" && !activeHere && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Nombre del dispositivo"
            className="w-40 rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none focus-gold"
          />
          <button type="button" onClick={activar} disabled={busy || !estado?.configurado} className="btn-gold px-3 py-1.5 text-xs">
            {busy ? "Activando…" : "Activar avisos"}
          </button>
        </div>
      )}
      {activeHere && mine && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => probar(mine.id)} disabled={busy} className={btn}>
            Enviar aviso de prueba
          </button>
          <button type="button" onClick={() => cambiar(mine.id, "desactivar")} disabled={busy} className={btn}>
            Desactivar en este dispositivo
          </button>
        </div>
      )}
      {msg && <p className={`text-xs ${msg.ok ? "text-green-600" : "text-red-600"}`}>{msg.text}</p>}

      {showDevices && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Dispositivos registrados</p>
          {(estado?.dispositivos ?? []).length === 0 ? (
            <p className="text-xs text-slate-400">Todavía no hay dispositivos con avisos.</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {(estado?.dispositivos ?? []).map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs">
                  <div>
                    <p className="font-medium text-slate-800">
                      {d.label ?? "Dispositivo"} {d.id === myId ? "(este)" : ""} · {STATUS_LABEL[d.status] ?? d.status}
                    </p>
                    <p className="text-slate-400">
                      Alta {new Date(d.created_at).toLocaleDateString("es-AR")}
                      {d.last_success_at ? ` · último aviso ${new Date(d.last_success_at).toLocaleString("es-AR")}` : ""}
                      {d.last_error ? ` · último error: ${d.last_error.slice(0, 80)}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    {d.status === "activo" && (
                      <button type="button" onClick={() => probar(d.id)} disabled={busy || !estado?.configurado} className={btn}>
                        Probar
                      </button>
                    )}
                    {d.status === "activo" ? (
                      <button type="button" onClick={() => cambiar(d.id, "desactivar")} disabled={busy} className={btn}>
                        Desactivar
                      </button>
                    ) : d.status === "desactivado" ? (
                      <button type="button" onClick={() => cambiar(d.id, "activar")} disabled={busy} className={btn}>
                        Reactivar
                      </button>
                    ) : null}
                    <button type="button" onClick={() => cambiar(d.id, "retirar")} disabled={busy} className={btn}>
                      Retirar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
