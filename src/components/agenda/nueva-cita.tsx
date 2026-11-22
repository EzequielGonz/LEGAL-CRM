"use client";

import { useState } from "react";
import { Dialogo } from "@/components/contactos/dialogo";
import { FormularioCita } from "@/components/agenda/formulario-cita";

/** Botón «Nueva cita» con su diálogo (persona, fecha y hora, duración y nota). */
export function NuevaCita({ slug }: { slug: string }) {
  const [abierto, setAbierto] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  return (
    <>
      <button type="button" className="pm-boton pm-boton--primario" onClick={() => { setAviso(null); setAbierto(true); }}>+ Nueva cita</button>
      <p role="status" aria-live="polite" className={aviso ? "ct-aviso ct-aviso--en-linea" : "ct-solo-lector"}>{aviso}</p>
      <Dialogo abierto={abierto} titulo="Nueva cita" onCerrar={() => setAbierto(false)}>
        {abierto ? <FormularioCita slug={slug} onCancelar={() => setAbierto(false)} onListo={(m) => { setAbierto(false); setAviso(m); }} /> : null}
      </Dialogo>
    </>
  );
}
