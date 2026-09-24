import { redirect } from "next/navigation";

// "/" ya no es la home del panel de escritorio (eso se movió a
// /estadisticas). Ahora "/" es la puerta de entrada del link del panel, y
// siempre manda primero a /inicio (elegir Teléfono o Computadora) — así
// nunca se salta directo al dashboard, ni siquiera si ya se eligió
// "Computadora" en una visita anterior.
export default function RootPage() {
  redirect("/inicio");
}
