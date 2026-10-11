"use client";

import { useEffect, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Instrucciones para instalar el panel como app en el teléfono (PWA). En
 * Android/Chrome aparece el botón "Instalar"; en iPhone/iPad se explica el
 * paso por el menú Compartir (necesario también para recibir avisos).
 */
export function InstallHint() {
  const [standalone, setStandalone] = useState(true);
  const [ios, setIos] = useState(false);
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true;
    setStandalone(!!isStandalone);
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (standalone || installed) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
      <p className="mb-1 font-semibold text-slate-800">Instalar como app</p>
      {prompt ? (
        <button
          type="button"
          onClick={async () => {
            await prompt.prompt();
            await prompt.userChoice.catch(() => null);
            setPrompt(null);
          }}
          className="btn-gold"
        >
          Instalar el panel en este teléfono
        </button>
      ) : ios ? (
        <p className="text-slate-600">
          En iPhone o iPad: abrí esta página en Safari, tocá <span className="font-medium">Compartir</span> y elegí{" "}
          <span className="font-medium">Agregar a pantalla de inicio</span>. Para recibir avisos hace falta abrir el panel desde ese ícono
          (iOS 16.4 o posterior).
        </p>
      ) : (
        <p className="text-slate-600">
          Desde el menú del navegador, elegí <span className="font-medium">Instalar app</span> o{" "}
          <span className="font-medium">Agregar a pantalla de inicio</span>.
        </p>
      )}
    </section>
  );
}
