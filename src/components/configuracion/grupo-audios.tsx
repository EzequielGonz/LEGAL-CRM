import { createAdminClient } from "@/lib/supabase/admin";
import { audiosEncendidos } from "@/lib/audios/reglas";
import { leerLlaveAudios } from "@/lib/audios/transcribir";
import { GrupoAjustes } from "@/components/configuracion/grupo-ajustes";
import { SeccionAjustes } from "@/components/configuracion/seccion-ajustes";
import { AudiosControl } from "@/components/configuracion/audios-control";
import type { GrupoNav } from "@/components/configuracion/navegacion-ajustes";

/** ¿Está encendido «El bot entiende los audios» en este perfil? Si no se puede leer, apagado. */
export async function leerAudiosDePerfil(perfil: string): Promise<boolean> {
  try {
    return audiosEncendidos(await leerLlaveAudios(createAdminClient()), perfil);
  } catch {
    return false;
  }
}

export function grupoNavAudios(encendido: boolean): GrupoNav {
  return { id: "audios", titulo: "Mensajes de voz", resumen: encendido ? "El bot entiende los audios" : "El bot pide que los escriban" };
}

/** Grupo de Ajustes de cada perfil (cada rubro por separado). */
export function GrupoAudios({ perfil, encendido }: { perfil: string; encendido: boolean }) {
  return (
    <GrupoAjustes id="audios" titulo="Mensajes de voz" resumen={grupoNavAudios(encendido).resumen}>
      <SeccionAjustes id="audios-a-texto" titulo="El bot entiende los audios" alcance="perfil" nivel="simple" palabras="audio voz nota de voz transcripción texto escuchar">
        <AudiosControl perfil={perfil} encendido={encendido} />
      </SeccionAjustes>
    </GrupoAjustes>
  );
}
