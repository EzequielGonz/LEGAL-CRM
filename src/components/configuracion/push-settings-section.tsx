import { vapidConfig } from "@/lib/webpush";
import { PushControls } from "@/components/telefono/push-controls";
import { VapidKeyGenerator } from "@/components/configuracion/vapid-key-generator";

/**
 * Avisos web (bloque 1.9): estado de la configuración, activación en este
 * dispositivo, aviso de prueba y lista de dispositivos para desactivar o
 * retirar. Mientras falten las claves, solo queda deshabilitada la
 * activación y el envío.
 */
export function PushSettingsSection() {
  const { config, missing } = vapidConfig();
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Avisos del panel en teléfonos y computadoras aunque la página esté cerrada (según lo que permita cada sistema). Por
        ahora solo se envían avisos de prueba; los avisos de cierre llegan con la Etapa 2.
      </p>
      <PushControls showDevices />
      {!config && (
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="mb-2 text-xs font-semibold text-slate-700">Falta configurar: {missing.join(", ")}</p>
          <VapidKeyGenerator />
        </div>
      )}
    </div>
  );
}
