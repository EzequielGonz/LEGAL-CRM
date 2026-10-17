"use client";

import { useState } from "react";

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Genera en ESTE navegador un par de claves VAPID para los avisos web. Las
 * claves no se envían ni se guardan en el panel: se copian a la
 * configuración privada del servidor (Vercel) y se vuelve a publicar.
 */
export function VapidKeyGenerator() {
  const [keys, setKeys] = useState<{ pub: string; priv: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function generar() {
    setError(null);
    try {
      const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
      const pub = await crypto.subtle.exportKey("raw", pair.publicKey);
      const jwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
      setKeys({ pub: b64url(pub), priv: jwk.d ?? "" });
    } catch (err: any) {
      setError(`Este navegador no pudo generar las claves: ${String(err?.message ?? err)}`);
    }
  }

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("No se pudo copiar: seleccioná el texto y copialo a mano.");
    }
  }

  return (
    <div className="space-y-2 text-xs text-slate-600">
      {!keys ? (
        <button type="button" onClick={generar} className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50">
          Generar claves para avisos web
        </button>
      ) : (
        <div className="space-y-2 rounded-lg bg-slate-50 p-3">
          <p>
            Cargá estas dos variables en Vercel (entorno Production, marcadas como sensibles) y volvé a publicar. No se guardan
            en el panel: si cerrás esta pantalla sin copiarlas, generá otras.
          </p>
          {[
            ["VAPID_PUBLIC_KEY", keys.pub],
            ["VAPID_PRIVATE_KEY", keys.priv],
          ].map(([name, value]) => (
            <div key={name}>
              <p className="font-semibold text-slate-700">{name}</p>
              <div className="flex items-center gap-2">
                <code className="block flex-1 break-all rounded border border-slate-200 bg-white px-2 py-1 font-mono text-xs">{value}</code>
                <button type="button" onClick={() => copy(name, value)} className="rounded border border-slate-300 px-2 py-1">
                  {copied === name ? "Copiado ✓" : "Copiar"}
                </button>
              </div>
            </div>
          ))}
          <p>
            Opcional: <span className="font-mono">VAPID_SUBJECT</span> con un correo de contacto en formato{" "}
            <span className="font-mono">mailto:correo@dominio</span>. Si no se carga, se usa la dirección del panel.
          </p>
        </div>
      )}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
