import { redirect } from "next/navigation";

// Entrada al panel del perfil: el Inicio con prioridades y siguiente paso
// (rediseño 17/10, bloque 3). Antes llevaba directo a Clientes cerrados.
export default function PanelInicioPage() {
  redirect("/hoy?perfil=marketing");
}
